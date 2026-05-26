package relay

import (
	"context"
	"crypto/md5"
	"fmt"
	"regexp"

	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/logger"
)

// logThinkingSignature 在 5 个关键节点打印 thinking block 的 signature 摘要
// 仅当 messages 中存在 thinking block 时才打印
func logThinkingSignature(ctx context.Context, stage string, request *dto.ClaudeRequest) {
	if request == nil || len(request.Messages) == 0 {
		return
	}

	hasThinking := false
	for _, msg := range request.Messages {
		if hasThinkingInContent(msg.Content) {
			hasThinking = true
			break
		}
	}

	if !hasThinking {
		return
	}

	var details string
	for msgIdx, msg := range request.Messages {
		sigs := extractThinkingSignatures(msg.Content)
		for blockIdx, sig := range sigs {
			sigLen := len(sig)
			sigHead := sig
			if len(sigHead) > 20 {
				sigHead = sigHead[:20]
			}
			sigHash := fmt.Sprintf("%x", md5.Sum([]byte(sig)))[:6]
			details += fmt.Sprintf("msg[%d].block[%d] sigLen=%d sigHead=%s sigHash=%s | ", msgIdx, blockIdx, sigLen, sigHead, sigHash)
		}
	}

	if details != "" {
		logger.LogInfo(ctx, fmt.Sprintf("[THINK-DEBUG] stage=%s %s", stage, details))
	}
}

// logThinkingSignatureFromJSON 从 JSON bytes 中提取 thinking signature（用于 marshal 后的 jsonData）
func logThinkingSignatureFromJSON(ctx context.Context, stage string, jsonData []byte) {
	if len(jsonData) == 0 {
		return
	}

	// 简单正则匹配 "signature":"xxx" 并提取值
	re := regexp.MustCompile(`"signature"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)\"`)
	matches := re.FindAllStringSubmatch(string(jsonData), -1)

	if len(matches) == 0 {
		return
	}

	var details string
	for i, match := range matches {
		sig := match[1]
		sigLen := len(sig)
		sigHead := sig
		if len(sigHead) > 20 {
			sigHead = sigHead[:20]
		}
		sigHash := fmt.Sprintf("%x", md5.Sum([]byte(sig)))[:6]
		details += fmt.Sprintf("sig[%d] sigLen=%d sigHead=%s sigHash=%s | ", i, sigLen, sigHead, sigHash)
	}

	if details != "" {
		logger.LogInfo(ctx, fmt.Sprintf("[THINK-DEBUG] stage=%s JSON %s", stage, details))
	}
}

func hasThinkingInContent(content any) bool {
	if content == nil {
		return false
	}

	switch c := content.(type) {
	case []any:
		for _, item := range c {
			if m, ok := item.(map[string]any); ok {
				if t, exists := m["type"]; exists && (t == "thinking" || t == "redacted_thinking") {
					return true
				}
			}
		}
	}
	return false
}

func extractThinkingSignatures(content any) []string {
	var sigs []string

	if content == nil {
		return sigs
	}

	switch c := content.(type) {
	case []any:
		for _, item := range c {
			if m, ok := item.(map[string]any); ok {
				if t, exists := m["type"]; exists && (t == "thinking" || t == "redacted_thinking") {
					if sig, ok := m["signature"].(string); ok {
						sigs = append(sigs, sig)
					}
				}
			}
		}
	}

	return sigs
}
