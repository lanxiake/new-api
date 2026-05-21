package service

import (
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/types"
)

func formatNotifyType(channelId int, status int) string {
	return fmt.Sprintf("%s_%d_%d", dto.NotifyTypeChannelUpdate, channelId, status)
}

func init() {
	RegisterReenableAutoDisabledChannel(ReenableChannelIfAutoDisabled)
}

// ReenableChannelIfAutoDisabled 若指定渠道当前状态为"自动禁用"，则把它改回 Enabled
// 并触发 OnChannelEnabled（清亲和性等）。手动禁用的渠道不动。
func ReenableChannelIfAutoDisabled(channelId int) {
	ch, err := model.GetChannelById(channelId, true)
	if err != nil || ch == nil {
		return
	}
	if ch.Status != common.ChannelStatusAutoDisabled {
		return
	}
	success := model.UpdateChannelStatus(channelId, "", common.ChannelStatusEnabled, "")
	if !success {
		return
	}
	OnChannelEnabled(channelId)
	subject := fmt.Sprintf("通道「%s」（#%d）已自动恢复启用", ch.Name, channelId)
	content := fmt.Sprintf("通道「%s」（#%d）探活成功，已自动恢复启用", ch.Name, channelId)
	NotifyRootUser(formatNotifyType(channelId, common.ChannelStatusEnabled), subject, content)
	sendChannelAlertEmail(subject, content)
}

// disable & notify
func DisableChannel(channelError types.ChannelError, reason string) {
	common.SysLog(fmt.Sprintf("通道「%s」（#%d）发生错误，准备禁用，原因：%s", channelError.ChannelName, channelError.ChannelId, reason))

	// 检查是否启用自动禁用功能
	if !channelError.AutoBan {
		common.SysLog(fmt.Sprintf("通道「%s」（#%d）未启用自动禁用功能，跳过禁用操作", channelError.ChannelName, channelError.ChannelId))
		return
	}

	success := model.UpdateChannelStatus(channelError.ChannelId, channelError.UsingKey, common.ChannelStatusAutoDisabled, reason)
	if success {
		OnChannelDisabled(channelError.ChannelId)
		subject := fmt.Sprintf("通道「%s」（#%d）已被禁用", channelError.ChannelName, channelError.ChannelId)
		content := fmt.Sprintf("通道「%s」（#%d）已被禁用，原因：%s", channelError.ChannelName, channelError.ChannelId, reason)
		NotifyRootUser(formatNotifyType(channelError.ChannelId, common.ChannelStatusAutoDisabled), subject, content)
		sendChannelAlertEmail(subject, content)
	}
}

func EnableChannel(channelId int, usingKey string, channelName string) {
	success := model.UpdateChannelStatus(channelId, usingKey, common.ChannelStatusEnabled, "")
	if success {
		OnChannelEnabled(channelId)
		subject := fmt.Sprintf("通道「%s」（#%d）已被启用", channelName, channelId)
		content := fmt.Sprintf("通道「%s」（#%d）已被启用", channelName, channelId)
		NotifyRootUser(formatNotifyType(channelId, common.ChannelStatusEnabled), subject, content)
		sendChannelAlertEmail(subject, content)
	}
}

// OnChannelEnabled 渠道被启用（自动恢复 / 手动启用 / 探活成功后重启用）时调用。
// 作用：
//  1. 清掉该渠道残留的 cooldown 标记，避免选择路径仍然把它当成冷却态跳过；
//  2. 清掉所有 (group, model) 维度下、priority 比该渠道更低的渠道的亲和性绑定，
//     使得绑在低优渠道上的用户下一次请求时重新选渠道，从而优先走该高优渠道。
//
// 整个流程异步执行，失败不影响主流程。
func OnChannelEnabled(channelId int) {
	if channelId <= 0 {
		return
	}
	go func() {
		defer func() {
			if r := recover(); r != nil {
				common.SysError(fmt.Sprintf("[OnChannelEnabled] 渠道 %d panic: %v", channelId, r))
			}
		}()
		ClearCooldown(channelId)
		lowerIds, err := model.GetLowerPriorityChannelIdsByChannel(channelId)
		if err != nil {
			common.SysError(fmt.Sprintf("[OnChannelEnabled] 渠道 %d 查询低优渠道失败: %s", channelId, err.Error()))
			return
		}
		totalCleared := 0
		for _, lowerId := range lowerIds {
			totalCleared += ClearChannelAffinityCacheByChannelId(lowerId)
		}
		common.SysLog(fmt.Sprintf("[OnChannelEnabled] 渠道 %d 已恢复：清理 %d 个低优渠道的 %d 条亲和性绑定",
			channelId, len(lowerIds), totalCleared))
	}()
}

// OnChannelDisabled 渠道被禁用（自动禁用 / 手动禁用）时调用。
// 清掉所有指向该渠道的亲和性绑定，让绑定到该渠道的用户下一次请求立刻切到其他可用渠道，
// 避免被打回 ForbiddenError 后再懒清理（用户首请求会失败一次）。
func OnChannelDisabled(channelId int) {
	if channelId <= 0 {
		return
	}
	go func() {
		defer func() {
			if r := recover(); r != nil {
				common.SysError(fmt.Sprintf("[OnChannelDisabled] 渠道 %d panic: %v", channelId, r))
			}
		}()
		cleared := ClearChannelAffinityCacheByChannelId(channelId)
		common.SysLog(fmt.Sprintf("[OnChannelDisabled] 渠道 %d 已禁用：清理 %d 条亲和性绑定", channelId, cleared))
	}()
}

// sendChannelAlertEmail 向运营设置中配置的告警邮箱发送渠道异常/恢复通知
// 该通道独立于 root 用户的个人通知设置，便于运维统一收件
func sendChannelAlertEmail(subject string, content string) {
	addrs := strings.TrimSpace(operation_setting.GetMonitorSetting().ChannelAlertEmail)
	if addrs == "" {
		return
	}
	for _, addr := range strings.Split(addrs, ",") {
		addr = strings.TrimSpace(addr)
		if addr == "" {
			continue
		}
		if err := common.SendEmail(subject, addr, content); err != nil {
			common.SysLog(fmt.Sprintf("[channel-alert] 发送告警邮件失败 addr=%s err=%s", addr, err.Error()))
		}
	}
}

func ShouldDisableChannel(err *types.NewAPIError) bool {
	if !common.AutomaticDisableChannelEnabled {
		return false
	}
	if err == nil {
		return false
	}
	if types.IsChannelError(err) {
		return true
	}
	if types.IsSkipRetryError(err) {
		return false
	}
	if operation_setting.ShouldDisableByStatusCode(err.StatusCode) {
		return true
	}

	lowerMessage := strings.ToLower(err.Error())
	search, _ := AcSearch(lowerMessage, operation_setting.AutomaticDisableKeywords, true)
	return search
}

func ShouldEnableChannel(newAPIError *types.NewAPIError, status int) bool {
	if !common.AutomaticEnableChannelEnabled {
		return false
	}
	if newAPIError != nil {
		return false
	}
	if status != common.ChannelStatusAutoDisabled {
		return false
	}
	return true
}
