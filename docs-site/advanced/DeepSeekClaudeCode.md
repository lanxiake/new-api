# DS 接入 CC

本教程介绍如何将 DeepSeek 模型接入 Claude Code。

## 前置要求

已完成 Claude Code 的安装与基础配置，参考 [Claude Code 配置](/cli-config/2-claude)。

## 第一步：创建令牌

在 [LLM-Link 控制台](https://www.llm-link.top) 创建新的 API 令牌，选择 `deepseek-officially` 分组，保存生成的 API Key。

## 第二步：配置方法（二选一）

### 方法一：通过 CC-Switch 配置（推荐）

在 CC-Switch 的 Claude Code 配置中添加供应商，填写以下信息：

- **供应商名称**：`LLM-Link`
- **请求地址**：`https://www.llm-link.top`
- **API 格式**：`Anthropic Messages（原生）`
- **默认模型**：`deepseek-v4-pro` 或 `deepseek-v4-flash`

### 方法二：手动编辑 settings.json

在 Claude Code 配置文件中添加以下环境变量：

::: code-group

```json [Windows（%userprofile%\.claude\settings.json）]
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://www.llm-link.top",
    "ANTHROPIC_AUTH_TOKEN": "你的deepseek-officially令牌",
    "CLAUDE_CODE_ATTRIBUTION_HEADER": "0",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "ANTHROPIC_MODEL": "deepseek-v4-pro"
  }
}
```

```json [macOS（~/.claude/settings.json）]
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://www.llm-link.top",
    "ANTHROPIC_AUTH_TOKEN": "你的deepseek-officially令牌",
    "CLAUDE_CODE_ATTRIBUTION_HEADER": "0",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "ANTHROPIC_MODEL": "deepseek-v4-pro"
  }
}
```

:::

## 验证步骤

重启终端，运行 `claude`，确认左侧显示正确的 DeepSeek 模型名称，发送测试消息验证功能。

::: tip 模型名称说明
模型名称默认无需 `[1m]` 后缀；仅在需要启用 1M 上下文时才添加该后缀。
:::
