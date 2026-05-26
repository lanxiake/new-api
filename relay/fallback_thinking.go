package relay

import (
	"fmt"
	"io"
	"regexp"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/relay/channel"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/types"

	"github.com/gin-gonic/gin"
)

// invalidThinkingSignatureRe 匹配上游返回的 thinking signature 无效错误
var invalidThinkingSignatureRe = regexp.MustCompile(`(?i)invalid.*signature.*in.*thinking.*block|invalid_request_error.*signature.*thinking`)

// shouldRetryStripThinking 判断是否应该触发剥离 thinking 后的重试
// 必须同时满足：
//  1. 上游状态码为 400
//  2. 错误体匹配 thinking signature 无效
//  3. 渠道配置开启 AutoStripInvalidThinking
//  4. 当前请求确实包含 thinking block
func shouldRetryStripThinking(statusCode int, apiErr *types.NewAPIError, info *relaycommon.RelayInfo, request *dto.ClaudeRequest) bool {
	if statusCode != 400 {
		return false
	}
	if !info.ChannelOtherSettings.AutoStripInvalidThinking {
		return false
	}
	if apiErr == nil || apiErr.Err == nil {
		return false
	}
	if !invalidThinkingSignatureRe.MatchString(apiErr.Err.Error()) {
		return false
	}
	if request == nil || !requestContainsThinking(request) {
		return false
	}
	return true
}

// requestContainsThinking 检测 request 的 messages 中是否存在 thinking block
func requestContainsThinking(request *dto.ClaudeRequest) bool {
	for _, msg := range request.Messages {
		if hasThinkingInContent(msg.Content) {
			return true
		}
	}
	return false
}

// stripThinkingFromRequest 返回一个深拷贝并剥离了所有 thinking/redacted_thinking block 的 ClaudeRequest
// 若某条 message 剥离后 content 为空数组，则替换为 [{"type":"text","text":"."}] 占位以避免上游报 content 非空错误
// 返回值同时给出剥离的 block 数量便于日志
func stripThinkingFromRequest(request *dto.ClaudeRequest) (*dto.ClaudeRequest, int, error) {
	cloned, err := common.DeepCopy(request)
	if err != nil {
		return nil, 0, fmt.Errorf("deep copy claude request failed: %w", err)
	}

	stripped := 0
	for idx := range cloned.Messages {
		msg := &cloned.Messages[idx]
		arr, ok := msg.Content.([]any)
		if !ok {
			continue
		}
		filtered := make([]any, 0, len(arr))
		for _, item := range arr {
			m, isMap := item.(map[string]any)
			if !isMap {
				filtered = append(filtered, item)
				continue
			}
			t, _ := m["type"].(string)
			if t == "thinking" || t == "redacted_thinking" {
				stripped++
				continue
			}
			filtered = append(filtered, item)
		}

		// 剥离后空 content 需占位（最小化干扰：单个 "." 字符）
		if len(filtered) == 0 {
			filtered = []any{
				map[string]any{
					"type": "text",
					"text": ".",
				},
			}
		}
		msg.Content = filtered
	}

	return cloned, stripped, nil
}

// retryBuildFn 与 ClaudeHelper 中的 buildClaudeRequestBody 闭包签名一致
type retryBuildFn func(req *dto.ClaudeRequest, logPrefix string) (io.Reader, []byte, *types.NewAPIError)

// retryWithoutThinking 剥离 thinking 后用相同的 build 流程构造新 body 并重发一次
// 注意：复用同一个 adaptor / info / 渠道，仅替换 request body
// 重试前会保存 info.RequestConversionChain 长度，重试后截断回原状以避免重复 append
func retryWithoutThinking(
	c *gin.Context,
	info *relaycommon.RelayInfo,
	adaptor channel.Adaptor,
	originalRequest *dto.ClaudeRequest,
	buildBody retryBuildFn,
) (any, error) {
	stripped, count, err := stripThinkingFromRequest(originalRequest)
	if err != nil {
		return nil, err
	}

	logger.LogInfo(c.Request.Context(), fmt.Sprintf("[THINK-FALLBACK] triggered stripped=%d blocks", count))

	// 诊断 #1：剥离后再验证 cloned 中是否还残留 thinking block
	stillHasThinking := requestContainsThinking(stripped)
	logger.LogInfo(c.Request.Context(), fmt.Sprintf("[THINK-FALLBACK-DIAG] after-strip containsThinking=%v messageCount=%d", stillHasThinking, len(stripped.Messages)))

	// 诊断 #2：检查原 originalRequest 是否被误改（DeepCopy 是否真的隔离了底层数据）
	origStillHasThinking := requestContainsThinking(originalRequest)
	logger.LogInfo(c.Request.Context(), fmt.Sprintf("[THINK-FALLBACK-DIAG] original-request containsThinking=%v (should be true if DeepCopy worked)", origStillHasThinking))

	// 保存 conversion chain 长度，重试后截断回原状（避免 AppendRequestConversionFromRequest 重复追加）
	chainLenBefore := len(info.RequestConversionChain)

	body, jsonData, buildErr := buildBody(stripped, "retry-")
	if buildErr != nil {
		// 即使 build 失败也要还原 chain（虽然此时不太可能 append 成功）
		if len(info.RequestConversionChain) > chainLenBefore {
			info.RequestConversionChain = info.RequestConversionChain[:chainLenBefore]
		}
		return nil, fmt.Errorf("build retry body failed: %v", buildErr.Err)
	}

	// 诊断 #3：检查最终 jsonData 里是否还残留 "signature" 关键字（含 "thinking" 关键字也一起统计）
	sigCount := strings.Count(string(jsonData), `"signature"`)
	thinkingCount := strings.Count(string(jsonData), `"thinking"`)
	redactedCount := strings.Count(string(jsonData), `"redacted_thinking"`)
	bodyPreview := string(jsonData)
	if len(bodyPreview) > 500 {
		bodyPreview = bodyPreview[:500]
	}
	logger.LogInfo(c.Request.Context(), fmt.Sprintf("[THINK-FALLBACK-DIAG] retry-body bytes=%d signatureCount=%d thinkingCount=%d redactedCount=%d", len(jsonData), sigCount, thinkingCount, redactedCount))
	logger.LogInfo(c.Request.Context(), fmt.Sprintf("[THINK-FALLBACK-DIAG] retry-body-preview=%s", bodyPreview))

	// build 阶段会在 chain 末尾追加一项；截断回原状以保证最终记录与首次请求一致
	if len(info.RequestConversionChain) > chainLenBefore {
		info.RequestConversionChain = info.RequestConversionChain[:chainLenBefore]
	}

	return adaptor.DoRequest(c, info, body)
}

// sanitizeEmptyTextBlocks 移除 messages 中所有 type=text 且 text 为空字符串的 content block
// in-place 修改 request.Messages；若某条 message 清洗后 content 为空数组，则占位为 [{"type":"text","text":"."}]
// 该清洗是幂等的：对已清洗过的 request 再次调用为 no-op
// 返回移除的空 block 数量便于日志
func sanitizeEmptyTextBlocks(request *dto.ClaudeRequest) int {
	if request == nil {
		return 0
	}
	removed := 0
	for idx := range request.Messages {
		msg := &request.Messages[idx]
		arr, ok := msg.Content.([]any)
		if !ok {
			continue
		}
		filtered := make([]any, 0, len(arr))
		for _, item := range arr {
			m, isMap := item.(map[string]any)
			if !isMap {
				filtered = append(filtered, item)
				continue
			}
			t, _ := m["type"].(string)
			if t == "text" {
				text, _ := m["text"].(string)
				if text == "" {
					removed++
					continue
				}
			}
			filtered = append(filtered, item)
		}
		if len(filtered) == 0 {
			filtered = []any{
				map[string]any{
					"type": "text",
					"text": ".",
				},
			}
		}
		msg.Content = filtered
	}
	return removed
}
