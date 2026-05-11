# OpenCode

OpenCode 是一款开源 AI 编程助手，支持终端、IDE 和桌面环境，兼容 75+ 模型供应商。

## 安装

```bash
npm install -g opencode-ai
```

安装后运行 `opencode` 确认安装成功：

![终端验证安装](/images/advanced/OpenCode-02.webp)

## 配置步骤

### 1. 创建令牌

在 [LLM-Link 控制台](https://www.llm-link.top) 的「令牌管理」中创建对应分组的令牌，复制 ApiKey。

根据要调用的模型选择分组：

| 目标模型系列 | 推荐分组 | 接口格式 |
|------------|---------|---------|
| Claude 系列（claude-opus-4-x / claude-sonnet-4-x） | `cc` | `Anthropic` |
| Claude 系列（折扣池） | `cc-sale` | `Anthropic` |
| GPT / Codex 系列（gpt-5.x / gpt-4.1） | `codex` | `OpenAI` |
| GPT / Codex 系列（折扣池） | `codex-sale` | `OpenAI` |
| DeepSeek / Mistral / Moonshot 等 | `default` | `OpenAI` |

### 2. 添加供应商

::: warning 关于截图中的品牌名称
以下流程截图来自第三方工具，可能显示其他品牌的供应商名称作为示例。**实际配置请按本页文字步骤操作**：供应商名称填 `LLM-Link`，API 地址填 `https://www.llm-link.top`。
:::

在 CC-Switch 中打开 OpenCode 配置区域，点击「添加供应商」，填写如下信息：

| 字段 | 填写内容 |
|------|---------|
| 供应商标识 | 自定义，如 `llm-link-cc` |
| 接口格式 | 见上表（`Anthropic` 或 `OpenAI`） |
| API Key | 从控制台复制的令牌 sk-... |
| API 地址 | `https://www.llm-link.top` |
| 模型 ID | 与令牌分组中的模型名称一致 |

![多字段供应商配置表单](/images/advanced/OpenCode-04.png)

### 3. 选择供应商

![LLM-Link 渠道选择](/images/advanced/OpenCode-05.png)

## 验证配置

运行 `opencode`，输入 `/models`，确认 LLM-Link 渠道出现在列表中：

![/models 命令输出](/images/advanced/OpenCode-06.png)

正常对话即配置成功：

![成功对话](/images/advanced/OpenCode-07.png)

::: tip 多分组并行配置
可以为同一供应商配置多套令牌（如分别命名 `llm-link-cc`、`llm-link-codex`），在 `/models` 中切换，按需选用不同价格档次。
:::
