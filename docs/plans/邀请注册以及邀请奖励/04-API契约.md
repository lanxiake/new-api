# 04 — API 契约

> 父文档：[README.md](./README.md)

所有接口统一返回格式：

```json
{
  "success": true,
  "message": "",
  "data": {}
}
```

错误返回 `success: false`，错误信息在 `message` 字段。

---

## 一、用户端接口（需要 `UserAuth`）

### 1.1 `GET /api/user/aff/stats` — 邀请统计概览

**Response data**：

```typescript
{
  aff_code: string                // 当前用户的邀请码（如 "g4Me"）
  aff_quota: number               // 待使用收益（quota）
  aff_pending_quota: number       // 待到账金额（quota）
  aff_history_quota: number       // 历史总收益（quota）
  aff_count: number               // 邀请人数
  rebate_ratio: number            // 当前系统返利比例（0~1）
  rebate_wait_days: number        // 解冻等待天数
}
```

**示例**：

```json
{
  "success": true,
  "data": {
    "aff_code": "g4Me",
    "aff_quota": 0,
    "aff_pending_quota": 100000,
    "aff_history_quota": 38500000,
    "aff_count": 3,
    "rebate_ratio": 0.10,
    "rebate_wait_days": 30
  }
}
```

---

### 1.2 `GET /api/user/aff/invitees` — 邀请记录（被邀请人列表）

**Query 参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `p` | int | 否 | 页码（默认 1） |
| `page_size` | int | 否 | 每页大小（默认 20，最大 100） |

**Response data**（PageInfo 结构）：

```typescript
{
  page: number
  page_size: number
  total: number
  items: Array<{
    username: string        // 脱敏后用户名（如 "to**an"）
    total_rebate: number    // 该被邀请人累计贡献的返佣（包含 pending + settled）
  }>
}
```

**示例**：

```json
{
  "success": true,
  "data": {
    "page": 1,
    "page_size": 20,
    "total": 3,
    "items": [
      {"username": "oi**56", "total_rebate": 30000000},
      {"username": "ch**ng", "total_rebate": 2500000},
      {"username": "to**an", "total_rebate": 1000000}
    ]
  }
}
```

---

### 1.3 `GET /api/user/aff/rebates` — 返佣明细（分页）

**Query 参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `p` | int | 否 | 页码 |
| `page_size` | int | 否 | 每页大小 |
| `status` | string | 否 | 过滤状态：`pending` / `settled` / `cancelled`，留空表示全部 |

**Response data**：

```typescript
{
  page: number
  page_size: number
  total: number
  items: Array<{
    id: number
    invitee_id: number
    topup_id: number
    topup_quota: number
    rebate_quota: number
    rebate_ratio: number
    status: 'pending' | 'settled' | 'cancelled'
    created_at: number       // Unix 秒
    settle_at: number        // Unix 秒，预计到账时间
    settled_at: number       // Unix 秒，实际到账时间（status=settled 时有效）
  }>
}
```

**示例**：

```json
{
  "success": true,
  "data": {
    "page": 1,
    "page_size": 20,
    "total": 5,
    "items": [
      {
        "id": 105,
        "invitee_id": 42,
        "topup_id": 88,
        "topup_quota": 5000000,
        "rebate_quota": 500000,
        "rebate_ratio": 0.10,
        "status": "settled",
        "created_at": 1740547295,
        "settle_at": 1743139295,
        "settled_at": 1743145000
      }
    ]
  }
}
```

---

### 1.4 `POST /api/user/aff_transfer` — 划转返利到主账户（已存在）

**保持现有实现不变**。

**Body**：

```json
{ "quota": 1000000 }
```

**Response**：

```json
{ "success": true, "message": "划转成功" }
```

---

### 1.5 `GET /api/user/aff` — 获取/生成邀请码（已存在）

**保持现有实现不变**。

---

## 二、管理员接口（需要 `AdminAuth`）

### 2.1 `GET /api/user/aff/report` — 全平台返利统计报表

**Response data**：

```typescript
{
  stats: {
    total_rebate: number      // 全平台累计返利总额（pending + settled）
    pending_rebate: number    // 待结算总额
    settled_rebate: number    // 已结算总额
    total_inviters: number    // 参与邀请的不同用户数
    total_invitees: number    // 触发返利的不同被邀请用户数
    total_records: number     // 返利记录总条数
  }
  top_inviters: Array<{
    inviter_id: number
    username: string          // 完整用户名（管理员视角不脱敏）
    total: number             // 累计返利金额
  }>
}
```

**示例**：

```json
{
  "success": true,
  "data": {
    "stats": {
      "total_rebate": 125000000,
      "pending_rebate": 5000000,
      "settled_rebate": 120000000,
      "total_inviters": 18,
      "total_invitees": 87,
      "total_records": 234
    },
    "top_inviters": [
      {"inviter_id": 5, "username": "alice", "total": 38500000},
      {"inviter_id": 12, "username": "bob", "total": 22000000}
    ]
  }
}
```

---

## 三、公开接口（无需认证）

### 3.1 `GET /api/user/aff/check` — 校验邀请码

**Query 参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `code` | string | 是 | 邀请码（4 位） |

**Response data**：

```typescript
{
  valid: boolean   // 邀请码是否有效（存在且对应有效用户）
}
```

**示例**：

```json
{ "success": true, "data": { "valid": true } }
```

> 安全考虑：
> - 该接口需要 IP 限流（防爆破）
> - 不返回任何用户信息（username/id），仅返回 `valid`

---

## 四、注册接口扩展

### 4.1 `POST /api/user/register`（已存在，扩展校验）

**Request Body**（增加邀请码必填校验）：

```json
{
  "username": "newuser",
  "password": "secret123",
  "email": "user@example.com",
  "verification_code": "123456",
  "aff_code": "g4Me"
}
```

**新增错误返回**：

| 场景 | message |
|------|---------|
| 邀请注册开启但未填邀请码 | `当前系统仅支持邀请注册，请填写邀请码` |
| 邀请码无效 | `邀请码无效或不存在` |

---

### 4.2 `GET /api/status`（已存在，扩展返回字段）

**Response data 新增字段**：

```typescript
{
  // ... 现有字段 ...
  aff_register_required: boolean   // 邀请注册是否开启（前端注册页据此显示必填）
}
```

---

## 五、配置项接口

### 5.1 `GET /api/option/`（已存在）

返回所有配置项，已自动包含本次新增的 4 个配置项：

```json
{
  "AffRegisterRequired": "false",
  "AffRebateEnabled": "false",
  "AffRebateRatio": "0.1",
  "AffRebateWaitDays": "30"
}
```

### 5.2 `PUT /api/option/`（已存在）

修改单个配置项。Body：

```json
{ "key": "AffRebateRatio", "value": "0.15" }
```

**新增校验**（在 `controller/option.go` UpdateOption 中）：

| key | 校验规则 |
|-----|---------|
| `AffRebateRatio` | 0 ≤ value ≤ 1（解析为 float） |
| `AffRebateWaitDays` | 0 ≤ value ≤ 365（解析为 int） |

---

## 六、路由注册清单

**文件**：`router/api-router.go`

```go
// 公开路由
apiRouter.GET("/user/aff/check", middleware.GlobalAPIRateLimit(), controller.CheckAffCode)

// 用户登录后
selfRoute.GET("/aff",          controller.GetAffCode)         // 已存在
selfRoute.GET("/aff/stats",    controller.GetAffStats)        // 新增
selfRoute.GET("/aff/invitees", controller.GetAffInvitees)     // 新增
selfRoute.GET("/aff/rebates",  controller.GetAffRebates)      // 新增
selfRoute.POST("/aff_transfer", controller.TransferAffQuota)  // 已存在

// 管理员
adminRoute.GET("/aff/report", controller.GetAffReport)        // 新增
```

---

## 七、HTTP 状态码约定

- `200 OK`：所有业务请求统一返回 200，业务结果在 `success` 字段
- `401 Unauthorized`：未登录访问需要登录的接口
- `403 Forbidden`：无权限（如普通用户访问管理员接口）
- `429 Too Many Requests`：限流命中（如 CheckAffCode 频繁调用）
- `500 Internal Server Error`：服务器异常

---

## 八、限流配置建议

| 接口 | 建议限流 |
|------|---------|
| `/api/user/aff/check` | 每 IP 每分钟 30 次（防爆破邀请码） |
| `/api/user/aff/stats` | 走默认 UserAuth 限流 |
| `/api/user/aff/invitees` | 走默认 UserAuth 限流 |
| `/api/user/aff/rebates` | 走默认 UserAuth 限流 |
| `/api/user/aff/report` | 走默认 AdminAuth 限流 |
