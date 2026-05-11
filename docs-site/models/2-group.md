# 令牌分组介绍

LLM-Link 通过 **令牌分组** 将不同来源、不同价格策略的模型隔离，创建 API 令牌时必须选择正确的分组，否则会返回「模型不存在」。

当前生产环境共有 **7 个分组**，可在 [模型广场](https://www.llm-link.top/pricing) 左侧筛选区查看。

## 分组速查表

| 分组 | 倍率 | 主要供应商 | 模型范围 | 适用场景 |
|------|------|----------|---------|---------|
| `cc` | **2.5x** | Anthropic | Claude 3.5/4/4.1/4.5/4.6/4.7 全系列 | Claude Code 原生 |
| `cc-sale` | **0.9x** | Anthropic | Claude 折扣池 | Claude Code 经济档 |
| `codex` | **1x** | OpenAI | GPT-4.1 / GPT-4o / GPT-5 / GPT-5.1 / GPT-5-codex 系列 | Codex CLI、OpenAI 通用调用 |
| `codex-sale` | **0.8x** | OpenAI | OpenAI 折扣池 | Codex CLI 经济档 |
| `default` | **1x** | DeepSeek / Mistral / Moonshot / 智谱 / 阿里巴巴 等 | 通用对话模型 | Roo Code、Cline、Cherry Studio 等第三方工具 |
| `doubao-seed` | **1x** | 阿里巴巴 | wan2.6-5s（视频生成，按次计费） | 视频生成调用 |
| `vip` | 1x | — | （当前为空，预留） | — |

## 各分组详解

### `cc` — Claude Code 专用（2.5x）

![cc 分组模型](/images/models/marketplace-group-cc.png)

包含全部 Claude 模型：
- `claude-3-5-sonnet-20240620` / `claude-3-5-sonnet-20241022`
- `claude-haiku-4-5-20251001`
- `claude-opus-4-20250514` / `claude-opus-4-1-20250805` / `claude-opus-4-5-20251101`
- `claude-opus-4-6` / `claude-opus-4-7`
- `claude-sonnet-4-5-20250929` / `claude-sonnet-4-6`

::: warning CC 分组限制
`cc` 分组**仅供 Claude Code 原生使用**，**不支持第三方工具**（如 Cherry Studio、Cline 等）调用测试。配置后请直接在 Claude Code 对话中验证。
:::

### `codex` — OpenAI / Codex CLI（1x）

![codex 分组模型](/images/models/marketplace-group-codex.png)

包含全部 OpenAI 模型（约 56 个）：
- **GPT-4.1**：`gpt-4.1`、`gpt-4.1-2025-04-14`
- **GPT-4o**：`gpt-4o`、`gpt-4o-2024-05-13`、`gpt-4o-2024-08-06`、`gpt-4o-2024-11-20`
- **GPT-5**：`gpt-5`、`gpt-5-high`、`gpt-5-medium`、`gpt-5-chat-latest`
- **GPT-5.1**：`gpt-5.1`、`gpt-5.1-chat-latest`、`gpt-5.1-codex`
- **GPT-5-codex**：`gpt-5-codex`、`gpt-5-codex-high/medium/low/mini`

适用于 Codex CLI、OpenAI SDK、以及兼容 OpenAI 协议的第三方工具。

### `cc-sale` / `codex-sale` — 折扣池

折扣池版本（Claude 0.9x、OpenAI 0.8x），模型名集合与 `cc` / `codex` 一致，价格更优但**稳定性可能略低于主分组**，适合非关键调用。

### `default` — 通用模型（1x）

![default 分组模型](/images/models/marketplace-group-default.png)

包含 OpenAI/Anthropic 以外的多家供应商：
- **DeepSeek**：deepseek 系列
- **Mistral**：mistral 系列（5 个）
- **Moonshot**：kimi-k2 系列（4 个）
- **智谱**：GLM 系列
- 等等

适用于 Roo Code、Cline、Cherry Studio、OpenCode 等第三方工具，端点类型同时支持 `openai` 与 `anthropic`。

### `doubao-seed` — 视频生成（1x，按次）

![doubao-seed 分组模型](/images/models/marketplace-group-doubao-seed.png)

仅含 `wan2.6-5s`（阿里巴巴视频生成模型），**按次计费**。

### `vip` — 预留分组

![vip 分组（当前为空）](/images/models/marketplace-group-vip.png)

当前未上架模型，保留以供后续高级套餐使用。

## 如何选择分组

| 你要使用的工具 | 推荐分组 |
|--------------|---------|
| Claude Code（原生） | `cc` |
| Codex CLI | `codex` |
| Gemini CLI / 第三方 GPT 调用 | `codex` |
| Cherry Studio、Cline、Roo Code、OpenCode 等通用工具 | `default` |
| 价格敏感、可容忍轻微不稳定 | `cc-sale` / `codex-sale` |
| 视频生成 | `doubao-seed` |

::: tip 创建令牌流程
1. 进入 [模型广场](https://www.llm-link.top/pricing)，按「可用令牌分组」筛选，确认目标模型在该分组下
2. 进入控制台「令牌管理」→ 新建令牌，**分组**字段选择对应名称
3. 复制令牌 sk-... 用于 CLI 工具或 SDK
:::

::: warning 分组与端点不可错配
- `cc` 分组的 Claude 模型必须通过 **anthropic 端点**（`/v1/messages`）调用
- `codex` / `default` 分组的模型通过 **openai 端点**（`/v1/chat/completions`）调用
- 端点类型可在模型广场的「端点类型」筛选中确认
:::
