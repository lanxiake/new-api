# 渠道故障无感切换 + 自动恢复设计

- 日期：2026-05-19
- 状态：草案，待用户审阅
- 关联问题：上游渠道返回 429 时，命中亲和性的老用户会持续收到 429，而新用户被路由到同 group 内低优先级备用渠道。

## 1. 背景与根因

### 1.1 现象

- 上游渠道（例如某个 Anthropic API key）开始返回 429。
- 当时正在使用该渠道的"老用户"持续收到 429，长达上游真实恢复时间（可能 2-3 小时）。
- **新发起请求的用户**被正常路由到同 group 内低优先级的备用渠道。

### 1.2 已确认的根因

1. **渠道亲和性 (Channel Affinity) 把老用户黏在故障渠道**。`setting/operation_setting/channel_affinity_setting.go` 默认开启两条规则：
   - codex cli trace：`^gpt-.*$` + `/v1/responses`，按 `prompt_cache_key` 黏住
   - claude cli trace：`^claude-.*$` + `/v1/messages`，按 `metadata.user_id` 黏住
   - 两条都设 `SkipRetryOnFailure: true`，TTL 1 小时，且 `SwitchOnSuccess: true` 会在每次成功时续期。
2. **命中亲和性后失败不重试**。`controller/relay.go` 的 `shouldRetry` 在亲和命中时直接 return false，整个重试循环不进入。
3. **429 不会触发自动禁用**。`AutomaticDisableStatusCodeRanges` 默认只有 `{401, 401}`，渠道既不会被熔断也不会被禁用。
4. **次要问题**：默认 `RetryTimes = 0`，普通重试路径也未传递"排除失败渠道"的集合。

### 1.3 设计诉求（用户确认）

| 维度 | 决策 |
|---|---|
| 保留亲和性 | 是（prompt cache 命中率重要） |
| 单请求内重试次数 | 5 次仍尝试原渠道，第 5 次失败后才换渠道 |
| 冷却触发阈值 | 跨请求连续失败 5 次进入冷却 |
| 失败口径 | 429 / 5xx / 超时 / 网络错误（4xx 除 429 不计） |
| 冷却中行为 | 直接绕过原渠道走备用，零延迟，用户无感 |
| 恢复机制 | 后台探活，每 60s 一次，用 channel 自己最便宜的模型 |
| 恢复响应 | 探活成功立即清除冷却 → 下一次请求自动回到原渠道 |
| 用户无感 | 整个过程不改动 affinity 缓存，不破坏 prompt cache 命中链路 |

## 2. 总体架构

经典断路器（Circuit Breaker）+ 半开探测模式，叠加在现有亲和性 + 重试机制之上，**不替换、不破坏**现有逻辑。

```
┌─────────────────────────────────────────────────────────┐
│  用户请求进入                                            │
│  middleware/distributor.go                              │
│    └─ GetPreferredChannelByAffinity()                   │
│         ├─ 缓存命中 pinned channel id = X               │
│         │   └─ ★ 新增：cooldown.IsInCooldown(X)?         │
│         │       ├─ 否：用 X（原行为）                    │
│         │       └─ 是：跳过 X，回退到 random 选择        │
│         └─ 缓存未命中                                    │
│             └─ CacheGetRandomSatisfiedChannel           │
│                 └─ ★ 新增：选择时跳过 cooldown 中渠道    │
└────────────────────┬────────────────────────────────────┘
                     ↓
              ┌──────────────┐
              │ relay 请求   │ ←─ 单请求内重试 5 次（仅原渠道）
              └──────┬───────┘
                     ↓
         ┌───────────────────────┐
         │ controller/relay.go    │
         │  ★ 修复 shouldRetry：  │
         │  - affinity 命中 + 失败│
         │    1~4 次：重试原渠道  │
         │  - 第 5 次失败：bypass │
         │    affinity 走备用      │
         │  ★ 新增：每次失败/成功 │
         │    上报到 cooldown 模块│
         └──────┬────────────────┘
                ↓
        是否累计连续失败 = 5？
          ├─ 是：写 channel:cooldown:{id} = 1（无 TTL）
          │      → 探活协程会扫描到并开始探活
          └─ 否：递增 channel:fail_count:{id}（10min TTL）

        ┌─────────────────────────────────────────┐
        │  后台：ChannelProbeLoop（main 启动一次）│
        │  - 每 60s 扫描 cooldown 集合            │
        │  - 对每个 cooldown channel              │
        │  - 分布式锁防止集群多实例重复探活        │
        │  - 用 channel.TestModel（最便宜模型）   │
        │    发 max_tokens=1 的请求               │
        │  - 成功 → 清除 cooldown + fail_count    │
        │  - 失败 → 留在 cooldown，下次再试       │
        └─────────────────────────────────────────┘
```

## 3. 关键不变性

| 不变性 | 保证机制 |
|---|---|
| 亲和性缓存绝不被 cooldown 模块改写 | cooldown 模块只读 affinity，从不写/删 |
| 探活成功后无需任何客户端动作即可切回 | affinity 缓存从头到尾未动 |
| 同一 channel 全集群最多一个探活协程 | Redis `channel:probe_running:{id}` 分布式锁 |
| 失败计数不会因偶发抖动永久累积 | `channel:fail_count` 10 分钟 TTL + 任何成功立即清零 |
| Redis 故障不能让所有渠道被误判冷却 | `IsInCooldown` 在 Redis 不可达时返回 false（fail-open） |

## 4. 组件设计

### 4.1 新模块 `service/channel_cooldown.go`

所有冷却状态集中在这里，对外只暴露 5 个公开方法。

```go
package service

// 失败上报。返回 true 表示本次失败使 channelId 进入了 cooldown。
func RecordFailure(channelId int, statusCode int) bool

// 成功上报。用于清空连续失败计数器。
func RecordSuccess(channelId int)

// 状态查询。热路径调用，必须高效（走内存缓存）。
func IsInCooldown(channelId int) bool

// 启动后台探活循环。main.go 启动时调用一次。
func StartChannelProbeLoop(ctx context.Context)

// 管理面板用：列出当前所有冷却中渠道及失败计数。
func ListCooldownChannels() []CooldownStatus
```

#### Redis 存储模型

| Key | Type | 内容 | TTL |
|---|---|---|---|
| `channel:fail_count:{channelId}` | INT | 跨请求连续失败次数 | 10 分钟 |
| `channel:cooldown:{channelId}` | "1" | 是否处于冷却态 | 无 TTL（由探活清除） |
| `channel:probe_running:{channelId}` | "1" | 探活分布式锁 | 90s |

#### 热路径性能

`IsInCooldown` 不能每次查 Redis（请求量大时是热点）。采用 **本地内存集合 + 周期同步**：

- 本地维护 `sync.Map[channelId]bool`
- 每 10s 同步一次 Redis cooldown 集合到本地（一次 SCAN）
- `RecordFailure` 触发 cooldown 时同步更新本地内存 + 写 Redis
- 本地集合空时直接返回 false，O(1)

### 4.2 修改 `middleware/distributor.go`

亲和性命中后增加 cooldown 检查。

```go
// 伪代码
pinnedChannel, hit := GetPreferredChannelByAffinity(...)
if hit {
    if cooldown.IsInCooldown(pinnedChannel.Id) {
        logger.Info("[Distribute] 亲和命中渠道 %d 但已冷却，回退到随机选择", pinnedChannel.Id)
        // 落到下面的随机选择分支，不强制使用 pinned
    } else {
        useChannel(pinnedChannel)
        return
    }
}
// ... 原有随机选择逻辑
```

### 4.3 修改 `controller/relay.go`

#### 4.3.1 `shouldRetry` 修复

```go
// 伪代码：当前逻辑
if affinityHit && rule.SkipRetryOnFailure {
    return false  // 这是根因
}

// 新逻辑
if affinityHit && rule.SkipRetryOnFailure {
    if retryCount < cooldownSetting.InSingleRequestRetries {
        return true  // 继续重试原渠道
    }
    c.Set("affinity_bypass", true)  // 标记本次请求绕过 affinity
    return true  // 让 getChannel 走备用池
}
```

#### 4.3.2 `getChannel` 调用增加排除集

```go
// 把已失败的 channelId 加入排除集（顺便修复 P2：同 tier 内可能重选回失败渠道）
excludedIds := getAlreadyFailedChannelIds(c)
channel := CacheGetRandomSatisfiedChannel(retryParam, excludedIds)
```

#### 4.3.3 `processChannelError` 增加失败/成功上报

```go
if isRetryableError(err) {
    enteredCooldown := cooldown.RecordFailure(channelId, statusCode)
    if enteredCooldown {
        logger.Info("[ProcessChannelError] 渠道 %d 进入冷却", channelId)
    }
}
// 成功路径
if err == nil {
    cooldown.RecordSuccess(channelId)
}
```

注意：`is_probe=true` 标记的请求（探活协程发的）走另一条路径，**不调用 RecordFailure**，避免自循环。

### 4.4 修改 `model/channel_cache.go` / `service/channel_select.go`

`GetRandomSatisfiedChannel` 内部加权随机时，把 cooldown 中的 channel 权重置 0：

```go
// 伪代码
for _, ch := range channels {
    if cooldown.IsInCooldown(ch.Id) {
        continue  // 跳过
    }
    if contains(excludedIds, ch.Id) {
        continue
    }
    weightedPool = append(weightedPool, ch)
}
if len(weightedPool) == 0 {
    // 兜底：整个 group 都冷却了，宁可返回 cooldown 中的也比 404 No Available Channel 强
    return fallbackPick(channels)
}
```

### 4.5 后台探活循环

```go
// service/channel_cooldown.go
func StartChannelProbeLoop(ctx context.Context) {
    ticker := time.NewTicker(cooldownSetting.ProbeInterval)
    defer ticker.Stop()
    for {
        select {
        case <-ctx.Done(): return
        case <-ticker.C:
            cooldownChannels := listCooldownChannelsFromRedis()
            for _, channelId := range cooldownChannels {
                if !acquireProbeLock(channelId) { continue }
                go probeChannelSafely(channelId)
            }
        }
    }
}

func probeChannelSafely(channelId int) {
    defer recover()  // 探活不能炸主流程
    defer releaseProbeLock(channelId)

    ch := model.GetChannelById(channelId)
    if ch == nil || ch.Status != ChannelStatusEnabled {
        clearCooldown(channelId)  // channel 不存在或被禁用，直接清除
        return
    }

    testModel := ch.TestModel
    if testModel == "" {
        testModel = ch.PickCheapestModel()
    }

    ok, err := controller.ProbeChannel(ch, testModel, 1)  // 复用 channel-test.go
    if ok {
        clearCooldown(channelId)
        clearFailCount(channelId)
        logger.Info("[ChannelProbe] 渠道 %d 探活成功，已恢复", channelId)
    } else {
        logger.Debug("[ChannelProbe] 渠道 %d 探活失败: %v", channelId, err)
    }
}
```

**关键：复用现有 `controller/channel-test.go` 已实现的"测试单个 channel"逻辑**，提取出 `ProbeChannel(ch, model, maxTokens)` 函数，避免重复造轮子。

## 5. 配置项

新增 `setting/operation_setting/channel_cooldown_setting.go`：

| 配置项 | 默认值 | 含义 |
|---|---|---|
| `Enabled` | `true` | 总开关，关掉退化为现有行为 |
| `FailThreshold` | `5` | 跨请求连续失败几次进入 cooldown |
| `FailWindowSeconds` | `600` | 失败计数 TTL |
| `InSingleRequestRetries` | `5` | 单次请求内对原渠道的最大重试次数 |
| `ProbeIntervalSeconds` | `60` | 探活间隔 |
| `ProbeMaxTokens` | `1` | 探活请求 max_tokens |
| `ProbeTimeoutSeconds` | `10` | 单次探活超时 |
| `RetryableStatusCodes` | `[408,429,500,502,503,504]` | 哪些状态码计入失败 |

存储：复用现有 option 表（JSON 序列化），方式同 `ChannelAffinitySetting`。

前端设置 section：`web/classic/src/pages/Setting/Operation/` 新增 "渠道冷却" 块。**前端可作为后续 PR**，先用 API 改 option。

## 6. 错误处理

### 6.1 探活协程

- 任何 panic 必须 recover，打 error 日志
- 探活超时（默认 10s）强制释放分布式锁
- 探活请求**不计入** `RecordFailure`（通过 `is_probe=true` context 标记识别）

### 6.2 Redis 故障降级

| 操作 | Redis 不可达时行为 |
|---|---|
| `IsInCooldown` | 返回 false（fail-open，不冤枉任何渠道） |
| `RecordFailure` | 静默忽略 + warn 日志 |
| `RecordSuccess` | 静默忽略 |
| 探活循环 | 持续 retry，不退出 |

### 6.3 边界情况

| 情况 | 处理 |
|---|---|
| 整个 group 全部冷却 | 选择时忽略 cooldown，返回任一渠道（用户拿 429 优于 404 No Available Channel） |
| Channel 被管理员手动禁用 | 探活先查 `Status`，已禁用直接 clearCooldown |
| Channel 被删除 | 探活发现不存在，清除所有相关 key |
| 单请求第 5 次重试又被选回原渠道 | `excludedIds` 排除集兜底 |
| 用户主动取消请求（client disconnect） | **不计入** `RecordFailure`（关键，防止误杀） |

## 7. 日志规范

按项目 CLAUDE.md 中文 + 函数名前缀：

```
[RecordFailure] 渠道 42 第 3 次连续失败 (statusCode=429)
[RecordFailure] 渠道 42 已达失败阈值 5，进入冷却
[IsInCooldown] 渠道 42 处于冷却中，跳过
[ChannelProbe] 渠道 42 开始探活 (model=gpt-3.5-turbo, maxTokens=1)
[ChannelProbe] 渠道 42 探活成功，清除冷却
[ChannelProbe] 渠道 42 探活失败 (statusCode=429)，保持冷却
[Distribute] 亲和命中渠道 42 但已冷却，回退到随机选择
```

## 8. 测试策略（小步快跑）

按 CLAUDE.md "完成部分功能就进行测试" 的原则分 4 阶段：

### 阶段 1：基础冷却模块

`service/channel_cooldown_test.go`：

- `RecordFailure` 累加正确，达阈值时写入 cooldown
- `RecordSuccess` 清空计数器
- `IsInCooldown` 内存缓存与 Redis 同步正确
- Redis 不可达时降级行为正确（fail-open）

### 阶段 2：选择路径集成

- `middleware/distributor.go`：affinity 命中 + 渠道冷却 → 走兜底分支
- `model/channel_cache.go`：`GetRandomSatisfiedChannel` 跳过冷却渠道
- 集成测试：手工标记一个渠道冷却 → 请求自动走备用 → 清除冷却 → 请求回到原渠道

### 阶段 3：探活协程

- 探活成功路径、失败路径、channel 不存在路径
- 集成测试：mock 慢恢复渠道，验证 60s 探活循环在恢复后立即解除冷却
- 分布式锁：双实例场景下只有一个在探活

### 阶段 4：端到端

用 `e2e-prod-verify/` 框架写"渠道故障演练"脚本：

1. 配置 2 个同 group 同 model 渠道，priority 不同
2. 故意改坏高优先级渠道的 key
3. 发 6 个请求，第 6 个应该看到自动切到低优先级渠道
4. 恢复 key，等 60s + 1 次请求，验证回到高优先级
5. 老用户（已有 affinity）和新用户都要测

## 9. 可观测性

如果项目已有 Prometheus，加 3 个指标：

| 指标 | 类型 | 用途 |
|---|---|---|
| `channel_cooldown_total{channelId, group}` | counter | 谁在频繁冷却 |
| `channel_probe_success_total{channelId}` | counter | 谁恢复了 |
| `channel_cooldown_duration_seconds` | histogram | 平均冷却时长 |

如未引入 Prometheus，先用结构化日志，admin 面板可加"渠道冷却状态"实时面板（作为后续 task）。

## 10. 实现规模估算

| 改动 | 文件 | 行数 |
|---|---|---|
| 新增 cooldown 模块 | `service/channel_cooldown.go` | ~250 |
| 新增配置块 | `setting/operation_setting/channel_cooldown_setting.go` | ~80 |
| 改 distributor | `middleware/distributor.go` | +20 |
| 改重试循环 | `controller/relay.go` | +40 |
| 改选择算法 | `service/channel_select.go` / `model/channel_cache.go` | +15 |
| 提取探活函数 | `controller/channel-test.go` | +10 |
| main 启动钩子 | `main.go` | +3 |
| 单测 | `service/channel_cooldown_test.go` 等 | ~200 |
| 前端设置 section（可后置） | `web/classic/src/...` | ~150 |
| **总计** | | **~770 行** |

中等大小改动，不动现有亲和性核心代码，只在 cooldown 维度叠加一层。

## 11. 上线灰度策略

1. **Step 1**：合并代码，但 `ChannelCooldownSetting.Enabled = false`（默认值临时设 false）
2. **Step 2**：生产环境通过 admin API 把 `Enabled` 置为 true，观察日志 30 分钟
3. **Step 3**：观察 7 天，确认 cooldown 触发次数、探活成功率符合预期
4. **Step 4**：把默认值改回 `true`，提交合并

回滚方案：admin API 一键把 `Enabled` 置为 false 即可，无需重启。

## 12. 风险与缓解

| 风险 | 缓解 |
|---|---|
| 探活请求消耗 quota | 用 max_tokens=1 + 选最便宜模型；每个冷却渠道每分钟最多 1 次 |
| 短暂网络抖动误杀渠道 | 探活 60s 内即可恢复；阈值 5 已经容忍短抖 |
| 冷却信息内存膨胀 | 本地集合元素数 = cooldown 中渠道数（通常 < 10），无膨胀风险 |
| 集群多实例竞态 | Redis 分布式锁；cooldown 写入是 SET 操作幂等 |
| 新逻辑引入 bug | 阶段化测试 + 灰度开关 |

## 13. 未来扩展（不在本 PR）

- 模型级冷却（如果发现某些上游是按模型限流）
- 自适应阈值（根据历史失败率动态调整 FailThreshold）
- 前端"渠道冷却状态"可视化面板
- Prometheus 指标 + Grafana 看板
