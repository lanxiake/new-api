package controller

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/gin-gonic/gin"
)

// MtbotNotifyRequest mtbot 支付完成后发送的通知请求体
type MtbotNotifyRequest struct {
	Username      string  `json:"username"`
	OrderId       string  `json:"order_id"`
	AlipayTradeNo string  `json:"alipay_trade_no"`
	Amount        float64 `json:"amount"`
	Ts            string  `json:"ts"`
	Sign          string  `json:"sign"`
}

// verifyMtbotNotifySign 验证 mtbot 回调签名
// 签名规则：HMAC-SHA256("username=<u>&order_id=<o>&amount=<a>&ts=<ts>", secret)
func verifyMtbotNotifySign(req *MtbotNotifyRequest) bool {
	secret := strings.TrimSpace(setting.MtbotTopupSecret)
	if secret == "" {
		return false
	}

	tsNum, err := strconv.ParseInt(req.Ts, 10, 64)
	if err != nil {
		return false
	}
	diff := time.Now().Unix() - tsNum
	if diff < 0 {
		diff = -diff
	}
	if diff > 300 {
		return false
	}

	message := fmt.Sprintf("username=%s&order_id=%s&amount=%.0f&ts=%s",
		req.Username, req.OrderId, req.Amount, req.Ts)

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(message))
	expected := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(req.Sign), []byte(expected))
}

// MtbotNotify POST /api/mtbot/notify
// mtbot 支付完成后调用此接口，创建 TopUp 记录并给用户充值
func MtbotNotify(c *gin.Context) {
	if !IsMtbotTopupEnabled() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"success": false, "message": "mtbot 充值未启用"})
		return
	}

	var req MtbotNotifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "请求参数错误"})
		return
	}

	if req.Username == "" || req.OrderId == "" || req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "缺少必要参数"})
		return
	}

	if !verifyMtbotNotifySign(&req) {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "签名验证失败"})
		return
	}

	// 查找用户
	user := &model.User{Username: req.Username}
	if err := model.DB.Where("username = ?", req.Username).First(user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "用户不存在"})
		return
	}

	// 幂等检查：同一 order_id 只处理一次
	existing := model.GetTopUpByTradeNo(req.OrderId)
	if existing != nil {
		if existing.Status == common.TopUpStatusSuccess {
			c.JSON(http.StatusOK, gin.H{"success": true, "message": "已处理"})
			return
		}
		// 已存在但未成功，尝试完成充值
		if err := model.RechargeMtbot(req.OrderId, c.ClientIP()); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "充值成功"})
		return
	}

	// 创建 TopUp 记录（amount 为人民币整数，1:1 对应美元）
	topUp := &model.TopUp{
		UserId:          user.Id,
		Amount:          int64(req.Amount),
		Money:           req.Amount,
		TradeNo:         req.OrderId,
		PaymentMethod:   model.PaymentMethodMtbot,
		PaymentProvider: model.PaymentProviderMtbot,
		CreateTime:      common.GetTimestamp(),
		Status:          common.TopUpStatusPending,
	}

	if err := model.DB.Create(topUp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "创建充值记录失败"})
		return
	}

	// 执行充值
	if err := model.RechargeMtbot(req.OrderId, c.ClientIP()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "充值成功"})
}
