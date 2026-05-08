# OpenCode

OpenCode 是一款开源 AI 编程助手，支持终端、IDE 和桌面环境，兼容 75+ 模型供应商。

## 安装

```bash
npm install -g opencode-ai
```

安装后运行 `opencode` 确认安装成功。

## 配置步骤

1. 安装 CC-Switch，打开 CC-Switch 中的 OpenCode 配置区域

2. 点击「添加供应商」，配置如下信息：
   - **供应商预设**：选择「LLM-Link」
   - **供应商标识**：自定义，如 `llm-link-codex`
   - **接口格式**：根据模型类型选择
     - Claude 模型 → `Anthropic`
     - Codex 模型 → `OpenAI`
     - Gemini 模型 → `Google (Gemini)`
   - **API Key**：从控制台令牌管理页复制
   - **Extra 选项**：`{"setCacheKey":true}`
   - **模型 ID 和显示名称**：与令牌分组中的模型名称保持一致

3. 各分组推荐使用的令牌：
   - GPT 系列 → `codex`、`gpt-officially` 分组
   - Claude 系列 → `aws-q`、`aws`、`claude-officially` 分组
   - Gemini 系列 → `gemini-slb` 分组

## 验证配置

运行 `opencode`，输入 `/models`，确认 LLM-Link 渠道出现在列表中。
