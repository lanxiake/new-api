package controller

import (
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

// CheckAffCode 公开接口：校验邀请码是否存在且对应有效用户
// GET /api/user/aff/check?code=xxxx
func CheckAffCode(c *gin.Context) {
	code := strings.TrimSpace(c.Query("code"))
	if code == "" {
		common.ApiSuccess(c, gin.H{"valid": false})
		return
	}
	inviterId, err := model.GetUserIdByAffCode(code)
	valid := err == nil && inviterId > 0
	common.ApiSuccess(c, gin.H{"valid": valid})
}

// GetAffStats 邀请奖励页顶部统计卡片数据
// GET /api/user/aff/stats
func GetAffStats(c *gin.Context) {
	userId := c.GetInt("id")
	user, err := model.GetUserById(userId, false)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	// 自动生成邀请码：使用幂等的条件 UPDATE，防并发覆盖
	if user.AffCode == "" {
		if code, e := model.EnsureUserAffCode(user.Id); e == nil && code != "" {
			user.AffCode = code
		}
	}
	common.ApiSuccess(c, gin.H{
		"aff_code":          user.AffCode,
		"aff_quota":         user.AffQuota,
		"aff_pending_quota": user.AffPendingQuota,
		"aff_history_quota": user.AffHistoryQuota,
		"aff_count":         user.AffCount,
		"rebate_ratio":      common.AffRebateRatio,
		"rebate_wait_days":  common.AffRebateWaitDays,
		"rebate_enabled":    common.AffRebateEnabled,
	})
}

// GetAffInvitees 邀请记录（被邀请人列表 + 累计贡献返佣）
// GET /api/user/aff/invitees?p=1&page_size=20
func GetAffInvitees(c *gin.Context) {
	userId := c.GetInt("id")
	page := common.GetPageQuery(c)

	type Row struct {
		InviteeId   int `json:"invitee_id"`
		TotalRebate int `json:"total_rebate"`
	}
	var rows []Row
	if err := model.DB.Table("aff_rebate_records").
		Select("invitee_id, COALESCE(SUM(rebate_quota), 0) AS total_rebate").
		Where("inviter_id = ? AND status IN ?", userId,
			[]string{model.AffRebateStatusPending, model.AffRebateStatusSettled}).
		Group("invitee_id").
		Order("total_rebate DESC").
		Limit(page.PageSize).Offset(page.GetStartIdx()).
		Scan(&rows).Error; err != nil {
		common.ApiError(c, err)
		return
	}

	// 总数：显式 COUNT(DISTINCT invitee_id)，跨 SQLite/MySQL/PostgreSQL 行为一致
	var total int64
	model.DB.Table("aff_rebate_records").
		Where("inviter_id = ? AND status IN ?", userId,
			[]string{model.AffRebateStatusPending, model.AffRebateStatusSettled}).
		Select("COUNT(DISTINCT invitee_id)").Scan(&total)

	// 取脱敏用户名
	items := make([]gin.H, 0, len(rows))
	if len(rows) > 0 {
		ids := make([]int, len(rows))
		for i, r := range rows {
			ids[i] = r.InviteeId
		}
		var users []model.User
		_ = model.DB.Select("id, username").Where("id IN ?", ids).Find(&users).Error
		userMap := make(map[int]string, len(users))
		for _, u := range users {
			userMap[u.Id] = maskUsername(u.Username)
		}
		for _, r := range rows {
			name := userMap[r.InviteeId]
			if name == "" {
				name = "u**" + strconv.Itoa(r.InviteeId)
			}
			items = append(items, gin.H{
				"invitee_id":   r.InviteeId,
				"username":     name,
				"total_rebate": r.TotalRebate,
			})
		}
	}

	page.SetTotal(int(total))
	page.SetItems(items)
	common.ApiSuccess(c, page)
}

// GetAffRebates 返佣明细（分页）
// GET /api/user/aff/rebates?p=1&page_size=20&status=pending|settled
func GetAffRebates(c *gin.Context) {
	userId := c.GetInt("id")
	statusFilter := c.Query("status")
	page := common.GetPageQuery(c)

	q := model.DB.Model(&model.AffRebateRecord{}).Where("inviter_id = ?", userId)
	if statusFilter == model.AffRebateStatusPending ||
		statusFilter == model.AffRebateStatusSettled ||
		statusFilter == model.AffRebateStatusCancelled {
		q = q.Where("status = ?", statusFilter)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		common.ApiError(c, err)
		return
	}

	var records []model.AffRebateRecord
	if err := q.Order("created_at DESC").
		Limit(page.PageSize).Offset(page.GetStartIdx()).
		Find(&records).Error; err != nil {
		common.ApiError(c, err)
		return
	}

	page.SetTotal(int(total))
	page.SetItems(records)
	common.ApiSuccess(c, page)
}

// GetAffReport 管理员统计报表
// GET /api/user/aff/report
func GetAffReport(c *gin.Context) {
	type Stats struct {
		TotalRebate   int   `json:"total_rebate"`
		PendingRebate int   `json:"pending_rebate"`
		SettledRebate int   `json:"settled_rebate"`
		TotalInviters int64 `json:"total_inviters"`
		TotalInvitees int64 `json:"total_invitees"`
		TotalRecords  int64 `json:"total_records"`
	}
	var stats Stats

	// 聚合主统计 + 计数：合并为单条 SQL，避免 3 次表扫描；
	// 同时使用显式 COUNT(DISTINCT) 保障跨 SQLite/MySQL/PostgreSQL 行为一致
	row := struct {
		TotalRebate   int   `gorm:"column:total_rebate"`
		PendingRebate int   `gorm:"column:pending_rebate"`
		SettledRebate int   `gorm:"column:settled_rebate"`
		TotalInviters int64 `gorm:"column:total_inviters"`
		TotalInvitees int64 `gorm:"column:total_invitees"`
		TotalRecords  int64 `gorm:"column:total_records"`
	}{}
	if err := model.DB.Table("aff_rebate_records").
		Select(
			"COALESCE(SUM(rebate_quota), 0) AS total_rebate, "+
				"COALESCE(SUM(CASE WHEN status = ? THEN rebate_quota ELSE 0 END), 0) AS pending_rebate, "+
				"COALESCE(SUM(CASE WHEN status = ? THEN rebate_quota ELSE 0 END), 0) AS settled_rebate, "+
				"COUNT(DISTINCT inviter_id) AS total_inviters, "+
				"COUNT(DISTINCT invitee_id) AS total_invitees, "+
				"COUNT(*) AS total_records",
			model.AffRebateStatusPending, model.AffRebateStatusSettled).
		Scan(&row).Error; err != nil {
		common.ApiError(c, err)
		return
	}
	stats.TotalRebate = row.TotalRebate
	stats.PendingRebate = row.PendingRebate
	stats.SettledRebate = row.SettledRebate
	stats.TotalInviters = row.TotalInviters
	stats.TotalInvitees = row.TotalInvitees
	stats.TotalRecords = row.TotalRecords

	// TOP 10 邀请人
	type TopRow struct {
		InviterId int    `json:"inviter_id"`
		Username  string `json:"username"`
		Total     int    `json:"total"`
	}
	var topRows []TopRow
	rawRows, err := model.DB.Table("aff_rebate_records").
		Select("inviter_id, COALESCE(SUM(rebate_quota), 0) AS total").
		Group("inviter_id").
		Order("total DESC").
		Limit(10).Rows()
	if err == nil {
		defer rawRows.Close()
		ids := make([]int, 0, 10)
		idTotal := make(map[int]int, 10)
		for rawRows.Next() {
			var id int
			var t int
			_ = rawRows.Scan(&id, &t)
			ids = append(ids, id)
			idTotal[id] = t
		}
		if len(ids) > 0 {
			var users []model.User
			_ = model.DB.Select("id, username").Where("id IN ?", ids).Find(&users).Error
			nameMap := make(map[int]string, len(users))
			for _, u := range users {
				nameMap[u.Id] = u.Username
			}
			for _, id := range ids {
				topRows = append(topRows, TopRow{
					InviterId: id,
					Username:  nameMap[id],
					Total:     idTotal[id],
				})
			}
		}
	}

	common.ApiSuccess(c, gin.H{
		"stats":        stats,
		"top_inviters": topRows,
	})
}

// maskUsername 用户名脱敏（如 "alice" -> "al**ce"）
func maskUsername(name string) string {
	r := []rune(name)
	switch {
	case len(r) == 0:
		return ""
	case len(r) <= 2:
		return string(r)
	case len(r) <= 4:
		return string(r[:1]) + "**" + string(r[len(r)-1:])
	default:
		return string(r[:2]) + "**" + string(r[len(r)-2:])
	}
}

// requireAffCodeIfEnforced 邀请码强制注册校验。
//
// 当 common.AffRegisterRequired 开启时，要求 affCode 非空且 inviterId > 0。
// 用于普通注册及各 OAuth 注册分支统一调用，避免在多处重复硬编码同一段判断。
//
// 返回 (msg, ok)：ok=false 时 msg 为面向最终用户的错误提示；ok=true 时 msg 为空。
// 当开关未启用时直接返回 ok=true。
func requireAffCodeIfEnforced(affCode string, inviterId int) (string, bool) {
	if !common.AffRegisterRequired {
		return "", true
	}
	if strings.TrimSpace(affCode) == "" {
		return "当前系统仅支持邀请注册，请通过有效邀请链接访问", false
	}
	if inviterId == 0 {
		return "邀请码无效或不存在", false
	}
	return "", true
}
