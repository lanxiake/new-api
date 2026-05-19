package operation_setting

import "github.com/QuantumNous/new-api/setting/config"

// ChannelCooldownSetting 渠道冷却（断路器）配置
type ChannelCooldownSetting struct {
	// Enabled 总开关，关闭时退化为现有行为
	Enabled bool `json:"enabled"`
	// FailThreshold 跨请求连续失败次数达到该值后进入冷却
	FailThreshold int `json:"fail_threshold"`
	// FailWindowSeconds 失败计数 TTL（防止永久累积）
	FailWindowSeconds int `json:"fail_window_seconds"`
	// InSingleRequestRetries 单次请求内最多对同一渠道（命中亲和性时）重试的次数
	InSingleRequestRetries int `json:"in_single_request_retries"`
	// ProbeIntervalSeconds 后台探活间隔
	ProbeIntervalSeconds int `json:"probe_interval_seconds"`
	// ProbeMaxTokens 探活请求 max_tokens
	ProbeMaxTokens int `json:"probe_max_tokens"`
	// ProbeTimeoutSeconds 单次探活超时
	ProbeTimeoutSeconds int `json:"probe_timeout_seconds"`
	// RetryableStatusCodes 哪些状态码计入"失败"
	RetryableStatusCodes []int `json:"retryable_status_codes"`
}

var channelCooldownSetting = ChannelCooldownSetting{
	Enabled:                true,
	FailThreshold:          5,
	FailWindowSeconds:      600,
	InSingleRequestRetries: 5,
	ProbeIntervalSeconds:   60,
	ProbeMaxTokens:         1,
	ProbeTimeoutSeconds:    10,
	RetryableStatusCodes:   []int{408, 429, 500, 502, 503, 504},
}

func init() {
	config.GlobalConfig.Register("channel_cooldown_setting", &channelCooldownSetting)
}

func GetChannelCooldownSetting() *ChannelCooldownSetting {
	return &channelCooldownSetting
}

// IsRetryableStatusCode 判断状态码是否计入失败
func (s *ChannelCooldownSetting) IsRetryableStatusCode(code int) bool {
	for _, c := range s.RetryableStatusCodes {
		if c == code {
			return true
		}
	}
	return false
}
