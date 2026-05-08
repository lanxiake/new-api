# 令牌分组介绍

LLM-Link 提供多个令牌分组，每个分组对应不同的模型渠道和价格策略。创建 API 令牌时**必须选择正确的分组**。

## 分组列表

| 分组名称 | 适用场景 | 是否支持第三方工具 |
|---------|---------|----------------|
| **Default** | 测试用途，不推荐用于 CLI | ✅ 支持 |
| **CC** | 专供 Claude Code 使用 | ❌ 不支持第三方 |
| **Codex** | 编程专用模型，支持第三方工具 | ✅ 支持 |
| **Azure** | Azure / GCP 的 GPT 模型 | ✅ 支持 |
| **GPT-officially** | OpenAI 官方 API 密钥 | ✅ 支持 |
| **Claude-officially** | 官方 Claude 渠道，接近官方定价 | ✅ 支持 |
| **AWS** | 亚马逊官方 Claude 模型，稳定但价格较高 | ✅ 支持 |
| **AWS-Q** | 逆向 AWS 模型，极低价，200K 上下文，稳定性略低 | ✅ 支持 |
| **CC-azu-sale** | 基于 Azure 的池子，5 分钟缓存，不稳定 | ✅ 支持 |
| **Antigravity** | 逆向 Google Antigravity IDE 模型 | ✅ 支持 |
| **Gemini-slb** | 企业级 Gemini 池，稳定性更好 | ✅ 支持 |
| **Gemini** | 标准 Gemini 池，经济实惠 | ✅ 支持 |
| **Gemini-Web** | 极低价，适合休闲使用 | ✅ 支持 |
| **Zai-officially** | 智谱 GLM 官方渠道 | ✅ 支持 |

::: tip 如何选择分组？
- 使用 **Claude Code**（原生 CC 功能）→ 选 `CC` 分组
- 使用 **Codex CLI** → 选 `Codex` 分组
- 使用 **Gemini CLI** 或 Roo Code → 选 `Gemini` 或 `Gemini-slb` 分组
- 使用 **GPT 系列模型** → 选 `Azure` 或 `GPT-officially` 分组
- 使用 **DeepSeek 模型** → 在控制台查看对应分组
:::

::: warning 注意
`CC` 分组**不支持第三方工具集成**，仅限 Claude Code 原生使用。  
其他第三方工具（如 Roo Code、Cline、OpenCode 等）请使用对应的其他分组。
:::

## 在模型广场确认分组

创建令牌前，建议先在控制台「模型广场」中查看各分组下的具体可用模型列表，确认所需模型存在于目标分组中，再创建对应分组的令牌。
