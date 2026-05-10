package service

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// init 注册 model 层的返利钩子，避免 model -> service 循环导入
func init() {
	model.AffRebateHook = CreateAffRebate
}

// CreateAffRebate 在充值成功后调用，创建一条 pending 返利记录。
//
// 调用约定：
//   - 必须在 TopUp 状态已更新为 success 且【充值事务已 Commit 之后】调用，
//     避免对未实际到账的充值进行返利，并避免延长用户表行锁。
//   - 函数内部使用独立 DB 句柄（非充值事务），失败不会回滚充值流程。
//   - 通过 AffRebateRecord.TopupId 唯一索引保证幂等：同一笔充值重复触发只产生一条返利。
//
// 参数：
//   - inviteeId：充值用户ID（被邀请人）
//   - topupId：充值订单ID，作为幂等键（管理员补单等不便提供时传 0，调用方需自行保证不重复）
//   - topupTradeNo：充值订单号（冗余字段，便于排查）
//   - topupQuota：本次充值实际到账 quota 数
func CreateAffRebate(inviteeId int, topupId int, topupTradeNo string, topupQuota int) error {
	// 功能未启用、参数无效时静默跳过
	if !common.AffRebateEnabled {
		return nil
	}
	if topupQuota <= 0 || common.AffRebateRatio <= 0 {
		return nil
	}
	if inviteeId <= 0 {
		return nil
	}

	db := model.DB

	// 1. 查询用户的邀请人
	var invitee struct {
		Id        int
		InviterId int
	}
	if err := db.Table("users").Select("id, inviter_id").
		Where("id = ?", inviteeId).Take(&invitee).Error; err != nil {
		return fmt.Errorf("[CreateAffRebate] 查询用户失败 invitee=%d: %w", inviteeId, err)
	}
	if invitee.InviterId == 0 {
		// 该用户没有邀请人，无需返利
		return nil
	}

	// 2. 计算返利金额（按 quota 比例向下取整）
	dQuota := decimal.NewFromInt(int64(topupQuota))
	dRatio := decimal.NewFromFloat(common.AffRebateRatio)
	rebateQuota := dQuota.Mul(dRatio).IntPart()
	if rebateQuota <= 0 {
		return nil
	}

	now := time.Now().Unix()
	settleAt := now + int64(common.AffRebateWaitDays)*86400

	// 3. 创建 pending 返利记录 + 累加邀请人待到账金额（同一事务内执行，但与外层充值事务解耦）
	err := db.Transaction(func(tx *gorm.DB) error {
		record := &model.AffRebateRecord{
			InviterId:    invitee.InviterId,
			InviteeId:    inviteeId,
			TopupId:      topupId,
			TopupTradeNo: topupTradeNo,
			TopupQuota:   topupQuota,
			RebateQuota:  int(rebateQuota),
			RebateRatio:  common.AffRebateRatio,
			Status:       model.AffRebateStatusPending,
			CreatedAt:    now,
			SettleAt:     settleAt,
		}
		if cErr := tx.Create(record).Error; cErr != nil {
			return cErr
		}
		if uErr := tx.Model(&model.User{}).Where("id = ?", invitee.InviterId).
			Update("aff_pending_quota", gorm.Expr("aff_pending_quota + ?", rebateQuota)).Error; uErr != nil {
			return uErr
		}
		return nil
	})

	if err != nil {
		// 唯一索引冲突视为幂等成功（同一笔充值已经创建过返利记录）
		if isDuplicateKeyErr(err) {
			common.SysLog(fmt.Sprintf(
				"[CreateAffRebate] 重复触发，已存在返利记录 invitee=%d topup=%d", inviteeId, topupId))
			return nil
		}
		return fmt.Errorf("[CreateAffRebate] 创建返利失败: %w", err)
	}

	common.SysLog(fmt.Sprintf(
		"[CreateAffRebate] 创建返利成功 inviter=%d invitee=%d topup=%d quota=%d ratio=%.4f",
		invitee.InviterId, inviteeId, topupId, rebateQuota, common.AffRebateRatio))
	return nil
}

// isDuplicateKeyErr 判断错误是否为唯一索引冲突（跨 SQLite/MySQL/PostgreSQL）。
// 不依赖具体驱动，使用消息匹配：
//   - SQLite: "UNIQUE constraint failed"
//   - MySQL:  "Duplicate entry"
//   - Postgres: "duplicate key value violates unique constraint"
func isDuplicateKeyErr(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "unique constraint") ||
		strings.Contains(msg, "duplicate entry") ||
		strings.Contains(msg, "duplicate key")
}

// SettleAffRebates 扫描到期的 pending 记录并结算。
// 单次最多处理 batchSize 条；返回实际结算数量与异常。
func SettleAffRebates(batchSize int) (settled int, err error) {
	if batchSize <= 0 {
		batchSize = 500
	}
	now := time.Now().Unix()

	var records []model.AffRebateRecord
	err = model.DB.Where("status = ? AND settle_at <= ?", model.AffRebateStatusPending, now).
		Order("id ASC").Limit(batchSize).Find(&records).Error
	if err != nil {
		return 0, err
	}

	for i := range records {
		if e := settleOneRebate(&records[i]); e != nil {
			common.SysLog(fmt.Sprintf("[SettleAffRebates] 结算失败 id=%d err=%v", records[i].Id, e))
			continue
		}
		settled++
	}
	return settled, nil
}

// settleOneRebate 结算单条返利记录（事务+行锁防并发）。
// SQLite 使用单连接串行写入，天然互斥，无需也不支持 SELECT ... FOR UPDATE。
func settleOneRebate(rec *model.AffRebateRecord) error {
	if rec == nil || rec.Id == 0 {
		return errors.New("invalid rebate record")
	}
	return model.DB.Transaction(func(tx *gorm.DB) error {
		// 1. 锁定该条记录，再次校验状态（SQLite 跳过 FOR UPDATE）
		var current model.AffRebateRecord
		q := tx
		if !common.UsingSQLite {
			q = q.Set("gorm:query_option", "FOR UPDATE")
		}
		if err := q.First(&current, rec.Id).Error; err != nil {
			return err
		}
		if current.Status != model.AffRebateStatusPending {
			return nil // 已被处理
		}

		// 2. 更新记录状态
		now := time.Now().Unix()
		if err := tx.Model(&current).Updates(map[string]interface{}{
			"status":     model.AffRebateStatusSettled,
			"settled_at": now,
		}).Error; err != nil {
			return err
		}

		// 3. 转移用户金额：AffPendingQuota -= rebate, AffQuota += rebate, AffHistoryQuota += rebate
		if err := tx.Model(&model.User{}).Where("id = ?", current.InviterId).
			Updates(map[string]interface{}{
				"aff_pending_quota": gorm.Expr("aff_pending_quota - ?", current.RebateQuota),
				"aff_quota":         gorm.Expr("aff_quota + ?", current.RebateQuota),
				"aff_history_quota": gorm.Expr("aff_history_quota + ?", current.RebateQuota),
			}).Error; err != nil {
			return err
		}

		// 4. 写日志（事务外可见但作为事务一部分提交）
		model.RecordLog(current.InviterId, model.LogTypeSystem,
			fmt.Sprintf("邀请返利到账：来自用户#%d 的充值返利 %s",
				current.InviteeId, logger.LogQuota(current.RebateQuota)))
		return nil
	})
}

// StartAffRebateScheduler 启动后台定时结算 goroutine。
// 仅应在 master 节点调用一次。
func StartAffRebateScheduler() {
	go func() {
		// 启动时立即跑一次（处理服务停机期间到期的记录）
		runOnce()
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			runOnce()
		}
	}()
}

func runOnce() {
	defer func() {
		if r := recover(); r != nil {
			common.SysLog(fmt.Sprintf("[AffRebateScheduler] panic recovered: %v", r))
		}
	}()
	n, err := SettleAffRebates(500)
	if err != nil {
		common.SysLog(fmt.Sprintf("[AffRebateScheduler] 结算异常: %v", err))
		return
	}
	if n > 0 {
		common.SysLog(fmt.Sprintf("[AffRebateScheduler] 本轮结算 %d 条", n))
	}
}
