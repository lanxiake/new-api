# 令牌分组介绍

LLM-Link 通过 **令牌分组** 将不同来源、不同价格策略的模型隔离，创建 API 令牌时必须选择正确的分组，否则会返回「模型不存在」。

当前生产环境共有 **7 个分组**，可在 [模型广场](https://www.llm-link.top/pricing) 左侧筛选区查看。

## 分组速查表

| 分组 | 倍率 | 用户可选 | 描述 |
|------|------|---------|------|
| `default` | **1x** | ✅ | 默认分组，可用部分免费模型 |
| `cc` | **2.0x** | ✅ | 高质量的 Claude Code 专用分组，智商在线，高效稳定 |
| `codex` | **0.6x** | ✅ | Codex CLI 专用分组 |
| `codex-sale` | **低至 0.4x** | ✅ | GPT 特价分组，支持 Codex、CC 和工具调用 |
| `cc-sale` | **低至 0.8x** | ✅ | Claude CC 特价分组，性价比首选 |
| `doubao-seed` | **1x** | ✅ | 视频生成，高清无水印 |
| `vip` | 1x | — | 预留分组 |

## 如何选择分组

| 你要使用的工具 | 推荐分组 |
|--------------|---------|
| Claude Code（原生，追求质量） | `cc` |
| Claude Code（追求性价比） | `cc-sale` |
| Codex CLI / OpenAI 模型标准档 | `codex` |
| Codex CLI / OpenAI 模型极致低价 | `codex-sale` |
| Cherry Studio、Cline、Roo Code、OpenCode 等通用工具 | `default` |
| 视频生成（豆包） | `doubao-seed` |

## 各分组详解

### `default` — 默认分组（1x）

![default 分组模型](/images/models/marketplace-group-default.png)

包含 OpenAI/Anthropic 以外的多家供应商，以及部分免费可用模型：
- **DeepSeek**：deepseek 系列
- **Mistral**：mistral 系列（5 个）
- **Moonshot**：kimi-k2 系列（4 个）
- **智谱**：GLM 系列
- 等等

适用于 Roo Code、Cline、Cherry Studio、OpenCode 等第三方工具，端点类型同时支持 `openai` 与 `anthropic`。

### `cc` — Claude Code 专用（2.0x）

![cc 分组模型](/images/models/marketplace-group-cc.png)

**高质量渠道，智商在线，高效稳定。** 包含全部 Claude 模型：
- `claude-3-5-sonnet-20240620` / `claude-3-5-sonnet-20241022`
- `claude-haiku-4-5-20251001`
- `claude-opus-4-20250514` / `claude-opus-4-1-20250805` / `claude-opus-4-5-20251101`
- `claude-opus-4-6` / `claude-opus-4-7`
- `claude-sonnet-4-5-20250929` / `claude-sonnet-4-6`

::: warning CC 分组限制
`cc` 分组**仅供 Claude Code 原生使用**，**不支持第三方工具**（如 Cherry Studio、Cline 等）调用测试。配置后请直接在 Claude Code 对话中验证。
:::

### `cc-sale` — Claude CC 特价分组（低至 0.8x）

模型名集合与 `cc` 一致，覆盖全部 Claude 系列，**最低倍率 0.8x**，**性价比首选**。  
价格更优，稳定性可能略低于 `cc` 主分组，适合成本敏感或非关键调用场景。

### `codex` — Codex CLI 专用分组（0.6x）

![codex 分组模型](/images/models/marketplace-group-codex.png)

包含全部 OpenAI 模型（约 56 个），**倍率 0.6x**：
- **GPT-4.1**：`gpt-4.1`、`gpt-4.1-2025-04-14`
- **GPT-4o**：`gpt-4o`、`gpt-4o-2024-05-13`、`gpt-4o-2024-08-06`、`gpt-4o-2024-11-20`
- **GPT-5**：`gpt-5`、`gpt-5-high`、`gpt-5-medium`、`gpt-5-chat-latest`
- **GPT-5.1**：`gpt-5.1`、`gpt-5.1-chat-latest`、`gpt-5.1-codex`
- **GPT-5-codex**：`gpt-5-codex`、`gpt-5-codex-high/medium/low/mini`

适用于 Codex CLI、OpenAI SDK、以及兼容 OpenAI 协议的第三方工具。

### `codex-sale` — GPT 特价分组（低至 0.4x）

模型名集合与 `codex` 一致，**最低倍率 0.4x**，支持 Codex CLI、CC 以及工具调用（Function Calling）。  
适合高频批量调用、对价格极度敏感的场景。稳定性可能略低于 `codex` 主分组。

### `doubao-seed` — 视频生成（1x，按次）

![doubao-seed 分组模型](/images/models/marketplace-group-doubao-seed.png)

豆包视频生成专属分组，仅含 `wan2.6-5s`（阿里巴巴视频生成模型），**按次计费**，生成结果**高清无水印**。

### `vip` — 预留分组

当前未上架模型，保留以供后续高级套餐使用。

## 创建令牌流程

1. 进入 [模型广场](https://www.llm-link.top/pricing)，按「可用令牌分组」筛选，确认目标模型在该分组下
2. 进入控制台「令牌管理」→ 新建令牌，**分组**字段选择对应名称
3. 复制令牌 `sk-...` 用于 CLI 工具或 SDK

::: warning 分组与端点不可错配
- `cc` / `cc-sale` 分组的 Claude 模型必须通过 **Anthropic 端点**（`/v1/messages`）调用
- `codex` / `codex-sale` / `default` 分组的模型通过 **OpenAI 端点**（`/v1/chat/completions`）调用
- 端点类型可在模型广场的「端点类型」筛选中确认
:::
