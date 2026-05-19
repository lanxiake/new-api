# 渠道故障无感切换 + 自动恢复（MVP）实施计划

> **For agentic workers:** 本计划由对话内执行。每个 Task 完成后即时提交。

**Goal:** 实现"老用户卡在 429 故障渠道"的无感切换 + 自动恢复机制。命中亲和但 5 次连续失败后绕过原渠道走备用；后台 60s 探活，原渠道恢复后立即回切。同时合并并部署已就绪的需求 1（渠道异常邮件告警）和需求 2（docs-site 联系方式）。

**Architecture:** 经典断路器 + 半开探测。在 `service/channel_cooldown.go` 集中所有冷却状态（Redis 存储 + 本地内存缓存）；在 `middleware/distributor.go` 和 `controller/relay.go` 叠加 cooldown 检查；后台 goroutine 定期用 channel 自身的"最便宜模型"探活。**不改动 affinity 缓存的写入路径**，保留 prompt cache 命中链路。

**Tech Stack:** Go 1.22+、Gin、GORM、go-redis v8、`samber/hot.HotCache` LRU、testify。

**关联 spec:** `docs/superpowers/specs/2026-05-19-channel-failover-design.md`

---

## 文件结构

| 文件 | 类型 | 责任 |
|---|---|---|
| `setting/operation_setting/channel_cooldown_setting.go` | 新建 | 冷却配置块（阈值、间隔、状态码白名单等） |
| `service/channel_cooldown.go` | 新建 | 失败计数 / cooldown 状态读写 / 后台探活循环 |
| `service/channel_cooldown_test.go` | 新建 | 单元测试 |
| `middleware/distributor.go` | 修改 | affinity 命中后检查 cooldown；选择渠道走备用 |
| `controller/relay.go` | 修改 | shouldRetry 修复 + RecordFailure/Success 打点 + 排除已失败 channel |
| `service/channel_select.go` | 修改 | 透传"排除 channel id"集合 |
| `model/channel_cache.go` | 修改 | 加权随机时过滤 cooldown 渠道 + 排除集 |
| `controller/channel-test.go` | 修改 | 暴露 `ProbeChannelLightweight` 供 cooldown 模块复用 |
| `main.go` | 修改 | 启动探活 goroutine |
| `constant/context_key.go` | 修改 | 新增 `ContextKeyAffinityBypass`、`ContextKeyExcludedChannelIds`、`ContextKeyIsProbe` |

---

## Task 0: 提交需求 1 和需求 2 的现有代码（独立提交，方便回滚）

**Files:**
- 已修改：`service/channel.go`, `setting/operation_setting/monitor_setting.go`, `web/classic/src/pages/Setting/Operation/SettingsMonitoring.jsx`, `docs-site/index.md`

- [ ] **Step 1: 分别提交两个独立 commit**

```bash
cd /e/open-source-project/new-api
git add service/channel.go setting/operation_setting/monitor_setting.go web/classic/src/pages/Setting/Operation/SettingsMonitoring.jsx
git commit -m "feat(monitor): 渠道异常邮件告警（可配置邮箱）

- monitor_setting 新增 ChannelAlertEmail 字段（多邮箱逗号分隔）
- DisableChannel/EnableChannel 复用 root 通知逻辑额外发邮件告警
- 监控设置页新增'渠道异常告警邮箱'输入框
"
git add docs-site/index.md
git commit -m "feat(docs-site): 首页追加联系我们区块

- 企业微信客服二维码 + QQ 群 llm-link-02 (1102925294)
- 响应式两列卡片，深浅色主题自适应
"
```

- [ ] **Step 2: 确认 git status 干净**

Run: `git status --short | grep -v -e topup_mtbot -e articles -e InviteRewards -e TokensColumnDefs -e topup/index -e router/api-router -e aff.go`
Expected: 输出为空（其余 modified 文件与本次任务无关）

---

## Task 1: 新增 context key 常量

**Files:**
- Modify: `constant/context_key.go`

- [ ] **Step 1: 找到现有 context key 定义位置**

Run: `grep -n "ContextKeyChannelId" "E:/open-source-project/new-api/constant/context_key.go"`
Expected: 该文件存在并有现成定义。

- [ ] **Step 2: 追加新 key**

Append at end of const block:
```go
// ContextKeyAffinityBypass 标记本次请求绕过 affinity，直接进入随机选择
ContextKeyAffinityBypass = "affinity_bypass"
// ContextKeyExcludedChannelIds 当前请求已失败、不能再选的 channel id 列表 ([]int)
ContextKeyExcludedChannelIds = "excluded_channel_ids"
// ContextKeyIsProbe 标记本次请求是探活请求（不计入失败计数）
ContextKeyIsProbe = "is_probe"
```

- [ ] **Step 3: 编译通过**

Run: `cd /e/open-source-project/new-api && go build ./constant/...`
Expected: 无输出（成功）

- [ ] **Step 4: 提交**

```bash
git add constant/context_key.go
git commit -m "feat(constant): 新增 cooldown/affinity-bypass/probe 三个 context key"
```

---

## Task 2: 新增配置块 `channel_cooldown_setting.go`

**Files:**
- Create: `setting/operation_setting/channel_cooldown_setting.go`

- [ ] **Step 1: 创建文件**

```go
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
	// InSingleRequestRetries 单次请求内最多对同一渠道重试的次数
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
```

- [ ] **Step 2: 编译**

Run: `cd /e/open-source-project/new-api && go build ./setting/...`
Expected: 无输出（成功）

- [ ] **Step 3: 提交**

```bash
git add setting/operation_setting/channel_cooldown_setting.go
git commit -m "feat(setting): 新增渠道冷却配置块"
```

---

## Task 3: 实现 `service/channel_cooldown.go`（核心模块）

**Files:**
- Create: `service/channel_cooldown.go`

- [ ] **Step 1: 编写完整模块**

```go
package service

import (
	"context"
	"fmt"
	"strconv"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/operation_setting"
)

const (
	cooldownKeyFailCount    = "channel:fail_count:"
	cooldownKeyCooldown     = "channel:cooldown:"
	cooldownKeyProbeRunning = "channel:probe_running:"
	probeLockTTL            = 90 * time.Second
)

// cooldownLocalSet 本地内存集合，记录当前处于冷却态的 channelId
// 写入：RecordFailure 命中阈值 / 周期同步 Redis；清除：探活成功 / 周期同步
var cooldownLocalSet sync.Map // map[int]bool

// RecordFailure 上报一次失败。返回 true 表示本次失败让 channelId 新进入冷却。
// 在 RedisEnabled=false 时静默退化为无操作（fail-open）。
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

	key := cooldownKeyFailCount + strconv.Itoa(channelId)
	ctx := context.Background()
	pipe := common.RDB.TxPipeline()
	incrCmd := pipe.Incr(ctx, key)
	pipe.Expire(ctx, key, time.Duration(cs.FailWindowSeconds)*time.Second)
	if _, err := pipe.Exec(ctx); err != nil {
		common.SysLog(fmt.Sprintf("[RecordFailure] 渠道 %d 写入 Redis 失败: %s", channelId, err.Error()))
		return false
	}
	count := incrCmd.Val()
	common.SysLog(fmt.Sprintf("[RecordFailure] 渠道 %d 第 %d 次连续失败 (statusCode=%d)", channelId, count, statusCode))

	if int(count) < cs.FailThreshold {
		return false
	}

	// 达到阈值，写入 cooldown 集合
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
	key := cooldownKeyFailCount + strconv.Itoa(channelId)
	if err := common.RDB.Del(context.Background(), key).Err(); err != nil {
		// 静默
		return
	}
}

// IsInCooldown 查询渠道是否处于冷却态（O(1)，走本地内存）
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

// SyncCooldownFromRedis 周期性把 Redis 中的 cooldown 集合同步到本地内存
// 这是多实例集群下保持一致性的关键
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
			id, err := strconv.Atoi(idStr)
			if err != nil {
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
	// 清除本地有但 Redis 没有的（其他实例已经探活成功）
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
			if id, err := strconv.Atoi(idStr); err == nil {
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

// acquireProbeLock 用 Redis SETNX 拿锁，集群多实例下保证只有一个在探活
func acquireProbeLock(channelId int) bool {
	if !common.RedisEnabled {
		return true // 单实例无 Redis：随意探
	}
	key := cooldownKeyProbeRunning + strconv.Itoa(channelId)
	ok, err := common.RDB.SetNX(context.Background(), key, "1", probeLockTTL).Result()
	if err != nil {
		return false
	}
	return ok
}

// StartChannelProbeLoop 启动探活循环（main.go 中以 goroutine 形式调用一次）
func StartChannelProbeLoop() {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				common.SysError(fmt.Sprintf("[StartChannelProbeLoop] panic: %v", r))
			}
		}()
		// 启动时先同步一次
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
			for _, id := range ids {
				if !acquireProbeLock(id) {
					continue
				}
				go probeChannelSafely(id)
			}
		}
	}()
}

// probeChannelSafely 单个渠道探活，失败不影响其它流程
// 注意：这里只声明，实际的 ProbeChannel 调用在 Task 6 由 controller 包提供
var probeChannelImpl func(channelId int) (ok bool, err error)

// RegisterProbeChannelImpl 由 controller 包在启动时注入探活实现，避免 service→controller 循环引用
func RegisterProbeChannelImpl(fn func(channelId int) (ok bool, err error)) {
	probeChannelImpl = fn
}

func probeChannelSafely(channelId int) {
	defer func() {
		if r := recover(); r != nil {
			common.SysError(fmt.Sprintf("[probeChannelSafely] channel %d panic: %v", channelId, r))
		}
	}()
	if probeChannelImpl == nil {
		return
	}
	common.SysLog(fmt.Sprintf("[ChannelProbe] 渠道 %d 开始探活", channelId))
	ok, err := probeChannelImpl(channelId)
	if ok {
		ClearCooldown(channelId)
		common.SysLog(fmt.Sprintf("[ChannelProbe] 渠道 %d 探活成功，已清除冷却", channelId))
	} else {
		errMsg := ""
		if err != nil {
			errMsg = err.Error()
		}
		common.SysLog(fmt.Sprintf("[ChannelProbe] 渠道 %d 探活失败，保持冷却: %s", channelId, errMsg))
	}
}
```

- [ ] **Step 2: 编译**

Run: `cd /e/open-source-project/new-api && go build ./service/...`
Expected: 无输出

- [ ] **Step 3: 提交**

```bash
git add service/channel_cooldown.go
git commit -m "feat(service): 实现渠道冷却模块（失败计数 / 状态 / 探活循环骨架）"
```

---

## Task 4: 单元测试 `service/channel_cooldown_test.go`

**Files:**
- Create: `service/channel_cooldown_test.go`

由于项目未引入 miniredis，本测试只覆盖 `RedisEnabled=false` 时的 fail-open 路径 + 本地内存集合行为。Redis 路径靠生产灰度 + 端到端测试覆盖。

- [ ] **Step 1: 创建测试**

```go
package service

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/require"
)

func TestRecordFailure_RedisDisabled_NoOp(t *testing.T) {
	saved := common.RedisEnabled
	common.RedisEnabled = false
	defer func() { common.RedisEnabled = saved }()

	got := RecordFailure(42, 429)
	require.False(t, got, "Redis 不可用时应返回 false 而不是 panic")
}

func TestIsInCooldown_FailOpenWhenEmpty(t *testing.T) {
	cooldownLocalSet.Delete(99)
	require.False(t, IsInCooldown(99))
}

func TestClearCooldown_RemovesFromLocalSet(t *testing.T) {
	cooldownLocalSet.Store(7, true)
	require.True(t, IsInCooldown(7))
	ClearCooldown(7)
	require.False(t, IsInCooldown(7))
}

func TestRecordSuccess_RedisDisabled_NoOp(t *testing.T) {
	saved := common.RedisEnabled
	common.RedisEnabled = false
	defer func() { common.RedisEnabled = saved }()
	RecordSuccess(42) // 不应 panic
}
```

- [ ] **Step 2: 跑测试**

Run: `cd /e/open-source-project/new-api && go test ./service/ -run "TestRecordFailure_RedisDisabled_NoOp|TestIsInCooldown_FailOpenWhenEmpty|TestClearCooldown_RemovesFromLocalSet|TestRecordSuccess_RedisDisabled_NoOp" -v`
Expected: 4 个测试全部 PASS

- [ ] **Step 3: 提交**

```bash
git add service/channel_cooldown_test.go
git commit -m "test(service): channel_cooldown 基础路径单测"
```

---

## Task 5: 修改 `middleware/distributor.go`：affinity 命中后检查 cooldown

**Files:**
- Modify: `middleware/distributor.go:102-128`（affinity 命中分支）

- [ ] **Step 1: 阅读当前代码并定位**

Run: `grep -n "GetPreferredChannelByAffinity" "E:/open-source-project/new-api/middleware/distributor.go"`
Expected: 第 102 行附近

- [ ] **Step 2: 在 affinity 命中后增加 cooldown 检查**

找到调用 `service.GetPreferredChannelByAffinity` 后、`MarkChannelAffinityUsed` 前的位置，把"命中后使用 pinned channel"分支用 cooldown 检查包裹：

```go
preferredChannelID, hasPreferred := service.GetPreferredChannelByAffinity(c, modelRequest.Model, usingGroup)
if hasPreferred {
    // 新增：渠道处于冷却态时，跳过 affinity，回退到随机选择
    if service.IsInCooldown(preferredChannelID) {
        logger.LogInfo(c, fmt.Sprintf("[Distribute] 亲和命中渠道 %d 但已冷却，回退到随机选择", preferredChannelID))
        common.SetContextKey(c, constant.ContextKeyAffinityBypass, true)
        // 落入下面的 CacheGetRandomSatisfiedChannel 分支
    } else {
        // 原有逻辑：使用 pinned channel
        // ... (保持现状)
    }
}
```

具体编辑方式：用 Edit 工具按现有代码结构最小化修改，确保失败时落入下方的随机选择分支。**不要破坏现有 affinity 校验流程**（检查 channel.Status、IsChannelEnabledForGroupModel 等）。

- [ ] **Step 3: 编译**

Run: `cd /e/open-source-project/new-api && go build ./middleware/...`
Expected: 无输出

- [ ] **Step 4: 提交**

```bash
git add middleware/distributor.go
git commit -m "feat(distributor): 亲和命中但渠道冷却时回退到随机选择"
```

---

## Task 6: 修改 `controller/relay.go`：失败/成功打点 + shouldRetry 修复 + 排除集

**Files:**
- Modify: `controller/relay.go:180-236`（重试循环）
- Modify: `controller/relay.go:292-322`（getChannel）
- Modify: `controller/relay.go:324-354`（shouldRetry）
- Modify: `controller/relay.go:356-401`（processChannelError）

- [ ] **Step 1: 在 retry 循环成功路径加 RecordSuccess**

在 `controller/relay.go:223` `if newAPIError == nil { ... return }` 之前加：
```go
if newAPIError == nil {
    service.RecordSuccess(channel.Id)
    relayInfo.LastError = nil
    return
}
```

- [ ] **Step 2: 修改 shouldRetry**

把第 328 行 `if service.ShouldSkipRetryAfterChannelAffinityFailure(c)` 分支改为：当本请求 retryCount < InSingleRequestRetries 时仍重试同渠道；达到上限时设置 affinity_bypass = true 后继续重试（让 getChannel 选备用）。

```go
func shouldRetry(c *gin.Context, openaiErr *types.NewAPIError, retryTimes int) bool {
	if openaiErr == nil {
		return false
	}
	cs := operation_setting.GetChannelCooldownSetting()
	if service.ShouldSkipRetryAfterChannelAffinityFailure(c) {
		// 关键修复：affinity 命中失败时不再直接 return false
		// 改为：累计本请求重试次数；超过 InSingleRequestRetries 则进入 bypass
		retries := c.GetInt("affinity_retry_count")
		retries++
		c.Set("affinity_retry_count", retries)
		if cs.Enabled && retries >= cs.InSingleRequestRetries {
			common.SetContextKey(c, constant.ContextKeyAffinityBypass, true)
			return retryTimes > 0
		}
		return retryTimes > 0
	}
	if types.IsChannelError(openaiErr) {
		return true
	}
	if types.IsSkipRetryError(openaiErr) {
		return false
	}
	if retryTimes <= 0 {
		return false
	}
	if _, ok := c.Get("specific_channel_id"); ok {
		return false
	}
	code := openaiErr.StatusCode
	if code >= 200 && code < 300 {
		return false
	}
	if code < 100 || code > 599 {
		return true
	}
	if operation_setting.IsAlwaysSkipRetryCode(openaiErr.GetErrorCode()) {
		return false
	}
	return operation_setting.ShouldRetryByStatusCode(code)
}
```

- [ ] **Step 3: processChannelError 增加 RecordFailure 上报**

在 `processChannelError` 函数末尾添加（line 400 前）：

```go
// 上报失败到 cooldown 模块（探活请求除外）
if !c.GetBool(constant.ContextKeyIsProbe) {
    service.RecordFailure(channelError.ChannelId, err.StatusCode)
}
```

- [ ] **Step 4: getChannel 把 affinity_bypass + 排除集传给选择器**

修改 `getChannel`：把 c 中已使用过的 channel id（`use_channel`）作为排除集传给 `CacheGetRandomSatisfiedChannel`。这一步依赖 Task 7。先做最小改动：调用前从 context 读 `use_channel` slice 转 `[]int` 写入 `ContextKeyExcludedChannelIds`：

```go
func getChannel(c *gin.Context, info *relaycommon.RelayInfo, retryParam *service.RetryParam) (*model.Channel, *types.NewAPIError) {
	if info.ChannelMeta == nil {
		// ... 保持原样
	}
	// 把已用过的 channel id 写入 context 给下游选择器
	used := c.GetStringSlice("use_channel")
	excluded := make([]int, 0, len(used))
	for _, s := range used {
		if id, err := strconv.Atoi(s); err == nil {
			excluded = append(excluded, id)
		}
	}
	common.SetContextKey(c, constant.ContextKeyExcludedChannelIds, excluded)

	channel, selectGroup, err := service.CacheGetRandomSatisfiedChannel(retryParam)
	// ... 保持原样
}
```

注意 import：增加 `"strconv"` 如果还没有。

- [ ] **Step 5: 编译**

Run: `cd /e/open-source-project/new-api && go build ./controller/...`
Expected: 无输出

- [ ] **Step 6: 提交**

```bash
git add controller/relay.go
git commit -m "feat(relay): 重试链路增加失败/成功打点 + affinity 命中可重试 + 排除集传递"
```

---

## Task 7: 修改选择算法跳过 cooldown + 排除集

**Files:**
- Modify: `service/channel_select.go:83-162`
- Modify: `model/channel_cache.go:96-191`

- [ ] **Step 1: 在 `service/channel_select.go` 中读取 context 的排除集**

在 `CacheGetRandomSatisfiedChannel` 内部，把 `param.Ctx` 中的 `ContextKeyExcludedChannelIds` 取出，传给 `model.GetRandomSatisfiedChannel`。需要修改 `model.GetRandomSatisfiedChannel` 签名增加 `excludedIds []int` 参数。

- [ ] **Step 2: 修改 `model/channel_cache.go:GetRandomSatisfiedChannel` 签名**

将函数签名改为 `func GetRandomSatisfiedChannel(group, model string, retry int, excludedIds []int) (*Channel, error)`，在加权随机循环（约 line 162-188）中跳过：

```go
for _, ch := range targetChannels {
    if containsInt(excludedIds, ch.Id) {
        continue
    }
    if service.IsInCooldown(ch.Id) {
        continue
    }
    // ... 原有加权计算
}
// 如果过滤后池子空，兜底返回原池（避免 No Available Channel）
```

⚠️ `model` 包不能 import `service` 包（循环依赖）。所以 cooldown 过滤要么：
- (a) 把 `IsInCooldown` 移到 `common` 包（更通用），或
- (b) 在 `service/channel_select.go` 调用 `model.GetRandomSatisfiedChannel` 之后再做一层 cooldown 过滤循环。

**采用方案 (b)**，避免改包结构：
1. `model.GetRandomSatisfiedChannel` 只增加 `excludedIds` 参数
2. `service.CacheGetRandomSatisfiedChannel` 在 model 返回 channel 后检查 `IsInCooldown`，若命中则用相同参数把该 channel 加入临时排除集**再调一次**。最多重试 3 次（避免无限循环）；都冷却时返回第一次结果（兜底）。

伪代码：
```go
func CacheGetRandomSatisfiedChannel(param *RetryParam) (*model.Channel, string, error) {
	excluded := getExcludedFromCtx(param.Ctx)
	var first *model.Channel
	var firstGroup string
	for attempt := 0; attempt < 3; attempt++ {
		ch, grp, err := model.GetRandomSatisfiedChannel(param.TokenGroup, param.ModelName, param.GetRetry(), excluded)
		if err != nil || ch == nil {
			return ch, grp, err
		}
		if first == nil {
			first = ch
			firstGroup = grp
		}
		if !IsInCooldown(ch.Id) {
			return ch, grp, nil
		}
		excluded = append(excluded, ch.Id)
	}
	return first, firstGroup, nil
}
```

- [ ] **Step 3: 修复所有调用方**

`model.GetRandomSatisfiedChannel` 签名变化后，必须修复全仓所有调用点。Run: `grep -rn "GetRandomSatisfiedChannel" "E:/open-source-project/new-api/" --include="*.go"`
对每个调用点追加 `nil`（无排除） 作为第 4 个参数。

- [ ] **Step 4: 编译**

Run: `cd /e/open-source-project/new-api && go build ./...`
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add service/channel_select.go model/channel_cache.go
# 可能还有其他文件被改动，按 git status 决定
git commit -m "feat(channel-select): 选择渠道时支持排除已失败 channel + 跳过冷却中的渠道"
```

---

## Task 8: 暴露轻量探活函数 + 注入到 cooldown 模块

**Files:**
- Modify: `controller/channel-test.go`（暴露 `ProbeChannelLightweight`）
- Modify: `main.go`（启动时注册 + 启动探活循环）

- [ ] **Step 1: 在 `controller/channel-test.go` 末尾增加导出函数**

```go
// ProbeChannelLightweight 用于 cooldown 模块的探活：发一个最小请求验证渠道是否恢复
// 复用 testChannel 的核心逻辑，但只关心是否成功
func ProbeChannelLightweight(channelId int) (ok bool, err error) {
	ch, gErr := model.GetChannelById(channelId, true)
	if gErr != nil || ch == nil {
		return false, fmt.Errorf("channel %d not found: %v", channelId, gErr)
	}
	if ch.Status != common.ChannelStatusEnabled {
		// channel 已被禁用 - 视为"不需要再探了"，返回成功让 cooldown 清除
		return true, nil
	}
	testModel := ch.GetTestModel()
	if testModel == "" {
		// 兜底：随便挑一个该 channel 支持的模型
		models := ch.GetModels()
		if len(models) > 0 {
			testModel = models[0]
		} else {
			return false, fmt.Errorf("channel %d 无可用 test model", channelId)
		}
	}
	result := testChannel(ch, testModel, "", false)
	if result.newAPIError == nil {
		return true, nil
	}
	return false, fmt.Errorf("%s", result.newAPIError.Error())
}
```

⚠️ 检查 `ch.GetTestModel()` / `ch.GetModels()` 函数是否存在；若不存在改用 `ch.TestModel` 字段 + `ch.Models` 字符串拆分。Run: `grep -n "func.*Channel.*TestModel\|TestModel string\|GetModels" "E:/open-source-project/new-api/model/channel.go"` 确认。

- [ ] **Step 2: 标记探活请求**

在 `testChannel` 函数开头（约 line 75）添加：
```go
c.Set(constant.ContextKeyIsProbe, true)
```
确保探活请求不会触发 RecordFailure。但 testChannel 已经用独立的 gin TestContext，不流经 distributor，所以**保险起见**两边都不进 cooldown 上报。

- [ ] **Step 3: main.go 启动钩子**

在 `main.go` 中 `go controller.AutomaticallyTestChannels()`（line 114 附近）下方追加：

```go
// 注入探活实现 + 启动探活循环
service.RegisterProbeChannelImpl(controller.ProbeChannelLightweight)
service.StartChannelProbeLoop()
```

- [ ] **Step 4: 编译**

Run: `cd /e/open-source-project/new-api && go build ./...`
Expected: 无错误

- [ ] **Step 5: 跑全部测试**

Run: `cd /e/open-source-project/new-api && go test ./service/... ./controller/... -count=1 -timeout 60s`
Expected: 全部 PASS（或与改动无关的已有失败保持不变）

- [ ] **Step 6: 提交**

```bash
git add controller/channel-test.go main.go
git commit -m "feat(probe): 暴露轻量探活函数并启动探活循环"
```

---

## Task 9: 集成验证（本地构建）

- [ ] **Step 1: 全量编译**

Run: `cd /e/open-source-project/new-api && go build -o /tmp/new-api-local ./...`
Expected: 生成二进制无错误

- [ ] **Step 2: go vet**

Run: `cd /e/open-source-project/new-api && go vet ./...`
Expected: 无 warning

- [ ] **Step 3: 跑 service / controller 测试**

Run: `cd /e/open-source-project/new-api && go test -count=1 -timeout 90s ./service/... ./controller/... ./middleware/... ./model/...`
Expected: 全部 PASS

---

## Task 10: 生产部署

按 CLAUDE.md 部署流程执行。

- [ ] **Step 1: Docker 构建二进制**

```bash
cd /e/open-source-project/new-api
"/c/Program Files/Docker/Docker/resources/bin/docker.exe" build -f Dockerfile.build -t new-api:local-build .
```
Expected: 成功生成镜像

- [ ] **Step 2: 提取二进制**

```bash
TMP="tmp-extract-$$"
"/c/Program Files/Docker/Docker/resources/bin/docker.exe" create --name "$TMP" new-api:local-build
"/c/Program Files/Docker/Docker/resources/bin/docker.exe" cp "$TMP:/new-api" ./new-api-binary
"/c/Program Files/Docker/Docker/resources/bin/docker.exe" rm "$TMP"
```

- [ ] **Step 3: 上传 + 替换 + 重启**

```bash
scp -i ~/.ssh/id_rsa ./new-api-binary root@130.94.43.100:/tmp/new-api
ssh -i ~/.ssh/id_rsa root@130.94.43.100 \
  "chmod +x /tmp/new-api && docker cp /tmp/new-api new-api:/new-api && docker restart new-api && rm -f /tmp/new-api"
rm -f ./new-api-binary
```

- [ ] **Step 4: 验证后端启动日志**

```bash
ssh -i ~/.ssh/id_rsa root@130.94.43.100 "docker logs --tail 100 new-api 2>&1 | head -50"
```
Expected: 看到 "[ChannelProbe]" 类日志（如果有冷却中渠道）或常规启动日志。

- [ ] **Step 5: 部署 docs-site**

```bash
cd /e/open-source-project/new-api/docs-site
bun run build
tar -czf docs-dist.tar.gz -C .vitepress/dist .
scp -i ~/.ssh/id_rsa docs-dist.tar.gz root@130.94.43.100:/tmp/
ssh -i ~/.ssh/id_rsa root@130.94.43.100 \
  "rm -rf /opt/new-api/docs-site/.vitepress/dist/* && \
   tar -xzf /tmp/docs-dist.tar.gz -C /opt/new-api/docs-site/.vitepress/dist && \
   nginx -s reload && rm -f /tmp/docs-dist.tar.gz"
rm -f docs-dist.tar.gz
```

- [ ] **Step 6: 验证 docs 首页**

```bash
curl -s https://docs.llm-link.top/ | grep -o "联系我们" | head -1
```
Expected: 输出 `联系我们`

- [ ] **Step 7: 后端冒烟测试**

```bash
curl -s https://www.llm-link.top/api/status | head
```
Expected: 正常 JSON 响应

---

## Self-Review Notes

- **Spec coverage**：spec 第 4 章的 5 个改动点（cooldown 模块、distributor、relay、channel_select/cache、channel-test 复用）全部映射到 Task 3/5/6/7/8；spec 第 5 章配置项映射到 Task 2；spec 第 8 章测试映射到 Task 4 + Task 9。
- **省略**：spec 第 5 章前端 setting section 推到后续 PR（不阻塞核心功能）；spec 第 9 章 Prometheus 指标暂用结构化日志替代。
- **风险**：Task 7 涉及 `model.GetRandomSatisfiedChannel` 签名变更，可能波及多个调用点；步骤 3 显式要求全仓 grep 修复。
