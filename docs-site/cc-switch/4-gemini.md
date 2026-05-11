# Gemini 配置

通过 CC-Switch 为 Gemini 配置 LLM-Link。

::: warning 关于截图中的品牌名称
以下流程截图来自 CC-Switch 软件内置预设，可能显示其他品牌的供应商名称作为示例。**实际配置请按本页文字步骤操作**：选择「自定义供应商」或将名称改为 `LLM-Link`，API 地址填 `https://www.llm-link.top`。
:::

## 配置步骤

1. 启动已下载的 CC-Switch 应用程序

![CC-Switch 启动界面](/images/cc-switch/CC-Switch-003.webp)

2. 在分组条中将选项设置为 **「Gemini」**

![选择 Gemini 分组](/images/cc-switch/CC-Switch-012.webp)

3. 在供应商分组中选择 **「LLM-Link」**

![选择 LLM-Link 供应商](/images/cc-switch/CC-Switch-013.png)

4. 在 [LLM-Link 控制台](https://www.llm-link.top) 创建 **Gemini 分组**的令牌，点击复制按钮将 ApiKey 复制到剪贴板

![从控制台复制 API Key](/images/cli-config/Cli-026.webp)

5. 在下拉菜单中找到「API Key」配置项，粘贴复制的密钥后点击「添加」

![填写 API Key](/images/cc-switch/CC-Switch-014.png)

6. 在主界面中点击「启用」按钮，待状态显示「使用中」即完成

![启用状态](/images/cc-switch/CC-Switch-015.png)

7. 在终端运行 `gemini`，能看到对话界面并正常交互说明配置成功

![终端运行 gemini 验证](/images/cli-config/Cli-022.webp)
