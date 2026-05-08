# Gemini 相关问题

## Gemini CLI 使用难题与建议

### 现状说明

Gemini CLI 目前存在多种使用问题，例如可能无法正常调用模型、无法粘贴图片。  
因此通常**不建议**将 Gemini-3 接入 Gemini CLI。

### 更推荐的方式

- 优先使用 **Roo Code** 等第三方 VSCode 插件
- 如必须使用 Gemini CLI，建议使用 **Antigravity 分组**渠道（兼容性更好）

::: warning 重要
如果你不会使用 Roo Code，我们推荐你使用 **Antigravity 分组**渠道的模型在 Gemini CLI 使用，能比较好地适配 CLI。

**特别提醒：** 该分组的 Gemini-3 模型名称可能与其他分组不同，详情查看 [令牌分组介绍](/models/2-group) 内容，避免配置时出现「无可用渠道」或「模型不存在」问题。
:::

::: tip 特别提醒
- 在 Roo Code 等第三方工具中使用时，选取 **OpenAI Response** 请求格式
- Antigravity 分组的模型通常不自带联网功能，可能需要借助 MCP 等工具实现
:::

---

## 如何在 Cline 使用 Gemini-3

### 软件要求

| 软件 | 版本要求 | 下载链接 |
|------|---------|---------|
| VSCode | 1.80.0+ | [下载 VSCode](https://code.visualstudio.com) |

### 1. 创建 Gemini 分组令牌

按照 [创建 API 令牌](/guide/4-token) 中的方法，创建 **Gemini 分组**的令牌。

### 2. 安装 Cline 插件

在 VSCode 扩展市场中搜索 **Cline**，点击安装。

### 3. 打开 Cline 界面

安装完成后，点击左侧活动栏的 Cline 图标，或使用命令面板（`Ctrl+Shift+P`）输入 `Cline: Open` 打开。

### 4. 首次配置

在 Cline 界面中填写以下配置：

| 配置项 | 值 |
|--------|-----|
| API Provider | `OpenAI Compatible` |
| Base URL | `https://www.llm-link.top/v1` |
| API Key | 你的 Gemini 分组令牌 |
| Model ID | `gemini-3-pro-preview` |

### 5. 完成配置

点击「Done」保存配置，即可开始使用。

::: warning API Key 安全提醒
请妥善保管你的 API Key，**不要在公开场合分享**，防止 Key 被盗用产生额外费用。
:::
