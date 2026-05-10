package model

// AffRebateStatus 返利记录状态类型
type AffRebateStatus string

const (
	AffRebateStatusPending   = "pending"   // 待到账（30 天解冻期内）
	AffRebateStatusSettled   = "settled"   // 已到账（已加到邀请人 AffQuota）
	AffRebateStatusCancelled = "cancelled" // 已取消（保留字段，暂不使用）
)

// AffRebateRecord 邀请返利明细记录
//
// 每一笔被邀请人的成功充值都会产生一条对应的返利记录：
//  1. 创建时 status=pending，settle_at = created_at + 解冻天数
//  2. 定时任务扫描到 settle_at 已到时，将记录置为 settled，并把 rebate_quota 转入邀请人 AffQuota
type AffRebateRecord struct {
	Id           int     `json:"id" gorm:"primaryKey"`
	InviterId    int     `json:"inviter_id" gorm:"index;not null"`              // 邀请人 user_id（接收返利）
	InviteeId    int     `json:"invitee_id" gorm:"index;not null"`              // 被邀请人 user_id（充值的人）
	TopupId      int     `json:"topup_id" gorm:"index;not null"`                // 关联 TopUp 记录 id
	TopupTradeNo string  `json:"topup_trade_no" gorm:"type:varchar(255);index"` // 冗余：充值订单号
	TopupQuota   int     `json:"topup_quota" gorm:"not null"`                   // 充值实际到账 quota
	RebateQuota  int     `json:"rebate_quota" gorm:"not null"`                  // 本次返利 quota
	RebateRatio  float64 `json:"rebate_ratio" gorm:"not null"`                  // 返利比例快照（0~1）
	Status       string  `json:"status" gorm:"type:varchar(32);not null;index:idx_aff_status_settle,priority:1"`
	CreatedAt    int64   `json:"created_at" gorm:"index;not null"`                                 // 产生时间（unix 秒）
	SettleAt     int64   `json:"settle_at" gorm:"not null;index:idx_aff_status_settle,priority:2"` // 应到账时间（unix 秒）
	SettledAt    int64   `json:"settled_at" gorm:"default:0"`                                      // 实际到账时间
}

// Insert 创建一条返利记录
func (r *AffRebateRecord) Insert() error {
	return DB.Create(r).Error
}
