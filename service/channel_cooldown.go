package service

import (
	"context"
	"fmt"
	"strconv"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
)

// 渠道冷却（断路器）实现：
//
// 数据模型（Redis）：
//
//	channel:fail_count:{id}    INT，跨请求连续失败次数，TTL = FailWindowSeconds
//	channel:cooldown:{id}      "1"，冷却态标记，**无 TTL**，由探活清除
//	channel:probe_running:{id} "1"，探活分布式锁，TTL=90s
//
// 热路径上的查询走本地内存集合（sync.Map），周期性与 Redis 同步。
//
// Redis 不可达时整个模块 fail-open：不冤枉任何渠道。
const (
	cooldownKeyFailCount    = "channel:fail_count:"
	cooldownKeyCooldown     = "channel:cooldown:"
	cooldownKeyProbeRunning = "channel:probe_running:"

	probeLockTTL = 90 * time.Second
)

// cooldownLocalSet 本地内存集合，记录当前处于冷却态的 channelId
var cooldownLocalSet sync.Map // map[int]bool

// RecordFailure 上报一次失败。返回 true 表示本次失败让 channelId 新进入冷却。
// 仅 RetryableStatusCodes 内的状态码计入。
func RecordFailure(channelId int, statusCode int) bool {
	cs := operation_setting.GetChannelCooldownSetting()
	if !cs.Enabled {
		return false
	}
	if !cs.IsRetryableStatusCode(statusCode) {
		return false
	}
	if !common.RedisEnabled {
		return false
	}

	ctx := context.Background()
	failKey := cooldownKeyFailCount + strconv.Itoa(channelId)
	pipe := common.RDB.TxPipeline()
	incrCmd := pipe.Incr(ctx, failKey)
	pipe.Expire(ctx, failKey, time.Duration(cs.FailWindowSeconds)*time.Second)
	if _, err := pipe.Exec(ctx); err != nil {
		common.SysLog(fmt.Sprintf("[RecordFailure] 渠道 %d 写入 Redis 失败: %s", channelId, err.Error()))
		return false
	}
	count := incrCmd.Val()
	common.SysLog(fmt.Sprintf("[RecordFailure] 渠道 %d 第 %d 次连续失败 (statusCode=%d)", channelId, count, statusCode))

	if int(count) < cs.FailThreshold {
		return false
	}

	cooldownKey := cooldownKeyCooldown + strconv.Itoa(channelId)
	if err := common.RDB.Set(ctx, cooldownKey, "1", 0).Err(); err != nil {
		common.SysLog(fmt.Sprintf("[RecordFailure] 渠道 %d 写入 cooldown 失败: %s", channelId, err.Error()))
		return false
	}
	cooldownLocalSet.Store(channelId, true)
	common.SysLog(fmt.Sprintf("[RecordFailure] 渠道 %d 已达失败阈值 %d，进入冷却", channelId, cs.FailThreshold))
	return true
}

// RecordSuccess 上报一次成功，清空连续失败计数
func RecordSuccess(channelId int) {
	if !common.RedisEnabled {
		return
	}
	_ = common.RDB.Del(context.Background(), cooldownKeyFailCount+strconv.Itoa(channelId)).Err()
}

// IsInCooldown 查询渠道是否处于冷却态（热路径，走本地内存）
func IsInCooldown(channelId int) bool {
	if !operation_setting.GetChannelCooldownSetting().Enabled {
		return false
	}
	v, ok := cooldownLocalSet.Load(channelId)
	if !ok {
		return false
	}
	return v.(bool)
}

// GetAllCooldownChannelIds 返回当前所有处于冷却态的渠道 ID 列表
func GetAllCooldownChannelIds() []int {
	if !operation_setting.GetChannelCooldownSetting().Enabled {
		return nil
	}
	var ids []int
	cooldownLocalSet.Range(func(key, value interface{}) bool {
		if channelId, ok := key.(int); ok {
			if inCooldown, ok := value.(bool); ok && inCooldown {
				ids = append(ids, channelId)
			}
		}
		return true
	})
	return ids
}

// ClearCooldown 立刻清除一个渠道的冷却态（探活成功 / 管理员手动恢复时调用）
func ClearCooldown(channelId int) {
	cooldownLocalSet.Delete(channelId)
	if !common.RedisEnabled {
		return
	}
	ctx := context.Background()
	_ = common.RDB.Del(ctx, cooldownKeyCooldown+strconv.Itoa(channelId)).Err()
	_ = common.RDB.Del(ctx, cooldownKeyFailCount+strconv.Itoa(channelId)).Err()
}

// SyncCooldownFromRedis 把 Redis 中的 cooldown 集合同步到本地内存
// 用于多实例集群中保持其它实例的状态变化
func SyncCooldownFromRedis() {
	if !common.RedisEnabled {
		return
	}
	ctx := context.Background()
	var cursor uint64
	seen := make(map[int]bool)
	for {
		keys, next, err := common.RDB.Scan(ctx, cursor, cooldownKeyCooldown+"*", 100).Result()
		if err != nil {
			common.SysLog(fmt.Sprintf("[SyncCooldownFromRedis] SCAN 失败: %s", err.Error()))
			return
		}
		for _, k := range keys {
			idStr := k[len(cooldownKeyCooldown):]
			id, parseErr := strconv.Atoi(idStr)
			if parseErr != nil {
				continue
			}
			seen[id] = true
			cooldownLocalSet.Store(id, true)
		}
		cursor = next
		if cursor == 0 {
			break
		}
	}
	// 清除本地有但 Redis 已经没有的（其他实例探活成功后清除了）
	cooldownLocalSet.Range(func(k, _ any) bool {
		id := k.(int)
		if !seen[id] {
			cooldownLocalSet.Delete(id)
		}
		return true
	})
}

// listCooldownChannelIds 扫描 Redis 列出所有冷却中渠道
func listCooldownChannelIds() []int {
	if !common.RedisEnabled {
		return nil
	}
	ctx := context.Background()
	var cursor uint64
	var ids []int
	for {
		keys, next, err := common.RDB.Scan(ctx, cursor, cooldownKeyCooldown+"*", 100).Result()
		if err != nil {
			return ids
		}
		for _, k := range keys {
			idStr := k[len(cooldownKeyCooldown):]
			if id, parseErr := strconv.Atoi(idStr); parseErr == nil {
				ids = append(ids, id)
			}
		}
		cursor = next
		if cursor == 0 {
			break
		}
	}
	return ids
}

// acquireProbeLock 用 Redis SETNX 拿锁，保证集群多实例下同一 channel 只有一个在探活
func acquireProbeLock(channelId int) bool {
	if !common.RedisEnabled {
		// 单实例或无 Redis：任意探
		return true
	}
	key := cooldownKeyProbeRunning + strconv.Itoa(channelId)
	ok, err := common.RDB.SetNX(context.Background(), key, "1", probeLockTTL).Result()
	if err != nil {
		return false
	}
	return ok
}

// probeChannelImpl 由 controller 包在启动时注入探活实现，避免 service→controller 循环引用
var probeChannelImpl func(channelId int) (ok bool, err error)

// RegisterProbeChannelImpl 由 controller 包在启动时注入探活实现
func RegisterProbeChannelImpl(fn func(channelId int) (ok bool, err error)) {
	probeChannelImpl = fn
}

func probeChannelSafely(channelId int) {
	defer func() {
		if r := recover(); r != nil {
			common.SysError(fmt.Sprintf("[probeChannelSafely] 渠道 %d panic: %v", channelId, r))
		}
	}()
	if probeChannelImpl == nil {
		return
	}
	common.SysLog(fmt.Sprintf("[ChannelProbe] 渠道 %d 开始探活", channelId))
	ok, err := probeChannelImpl(channelId)
	if ok {
		ClearCooldown(channelId)
		// 若渠道当前状态为"自动禁用"，探活成功表示上游已恢复，
		// 需要重新启用，否则 ability 表里仍是 enabled=false，选择路径永远不会再选到它。
		// 仅对 AutoDisabled 自动恢复；手动禁用保持运维意图不变。
		reenableAutoDisabledChannel(channelId)
		common.SysLog(fmt.Sprintf("[ChannelProbe] 渠道 %d 探活成功，已清除冷却", channelId))
		return
	}
	errMsg := ""
	if err != nil {
		errMsg = err.Error()
	}
	common.SysLog(fmt.Sprintf("[ChannelProbe] 渠道 %d 探活失败，保持冷却: %s", channelId, errMsg))
}

// reenableAutoDisabledChannel 由 service/channel.go 在 init 时注入实现，避免循环引用。
var reenableAutoDisabledChannel = func(channelId int) {}

// RegisterReenableAutoDisabledChannel 同包注入接口（供 channel.go 调用）。
func RegisterReenableAutoDisabledChannel(fn func(channelId int)) {
	reenableAutoDisabledChannel = fn
}

// StartChannelProbeLoop 启动后台探活循环（main.go 调用一次）
//
// 循环逻辑：
//  1. 每 ProbeIntervalSeconds 秒一次
//  2. SyncCooldownFromRedis 同步本地状态
//  3. 列出 Redis 中所有 cooldown 渠道
//  4. 对每个渠道尝试拿分布式锁，拿到则起 goroutine 探活
//
// 若 Enabled=false，循环空转（30s 后再检查），便于运维不重启即可热切换。
func StartChannelProbeLoop() {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				common.SysError(fmt.Sprintf("[StartChannelProbeLoop] panic: %v", r))
			}
		}()
		SyncCooldownFromRedis()

		for {
			cs := operation_setting.GetChannelCooldownSetting()
			if !cs.Enabled {
				time.Sleep(30 * time.Second)
				continue
			}
			interval := time.Duration(cs.ProbeIntervalSeconds) * time.Second
			if interval < 10*time.Second {
				interval = 10 * time.Second
			}
			time.Sleep(interval)

			SyncCooldownFromRedis()
			ids := listCooldownChannelIds()
			probed := make(map[int]bool, len(ids))
			for _, id := range ids {
				probed[id] = true
				if !acquireProbeLock(id) {
					continue
				}
				go probeChannelSafely(id)
			}

			// 同时扫描所有 status=AutoDisabled 的渠道。
			// 这些渠道未必经过 cooldown 路径（比如启动时全量测试直接禁用、
			// monitor 直接禁用等），如果不主动探活会永远停在禁用态。
			autoDisabledIds, err := model.GetAutoDisabledChannelIds()
			if err != nil {
				common.SysError(fmt.Sprintf("[StartChannelProbeLoop] 查询自动禁用渠道失败: %s", err.Error()))
				continue
			}
			for _, id := range autoDisabledIds {
				if probed[id] {
					continue
				}
				if !acquireProbeLock(id) {
					continue
				}
				go probeChannelSafely(id)
			}
		}
	}()
}
