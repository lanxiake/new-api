package controller

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/setting"
	"github.com/gin-gonic/gin"
)

// GetMtbotTopupLink 生成带 HMAC-SHA256 签名的 mtbot 充值跳转链接
// GET /api/user/mtbot-topup/link
func GetMtbotTopupLink(c *gin.Context) {
	if !IsMtbotTopupEnabled() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"message": "error", "data": "支付宝直连充值未配置"})
		return
	}

	baseURL := strings.TrimSpace(setting.MtbotTopupURL)
	if baseURL == "" {
		baseURL = "https://www.mtbot.top/api/pay/topup"
	}

	username := c.GetString("username")
	if username == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "error", "data": "用户未登录"})
		return
	}

	ts := fmt.Sprintf("%d", time.Now().Unix())
	message := fmt.Sprintf("username=%s&ts=%s", username, ts)

	mac := hmac.New(sha256.New, []byte(setting.MtbotTopupSecret))
	mac.Write([]byte(message))
	sign := hex.EncodeToString(mac.Sum(nil))

	params := url.Values{}
	params.Set("username", username)
	params.Set("ts", ts)
	params.Set("sign", sign)

	fullURL := baseURL + "?" + params.Encode()

	c.JSON(http.StatusOK, gin.H{"message": "success", "data": fullURL})
}

// IsMtbotTopupEnabled 检查是否启用了 mtbot 支付宝直连充值
func IsMtbotTopupEnabled() bool {
	return setting.MtbotEnabled && strings.TrimSpace(setting.MtbotTopupSecret) != ""
}
