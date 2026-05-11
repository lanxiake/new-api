# Codex 配置

通过 CC-Switch 为 Codex 配置 LLM-Link。

::: warning 关于截图中的品牌名称
以下流程截图来自 CC-Switch 软件内置预设，可能显示其他品牌的供应商名称作为示例。**实际配置请按本页文字步骤操作**：选择「自定义供应商」或将名称改为 `LLM-Link`，API 地址填 `https://www.llm-link.top`。
:::

## 配置步骤

1. 启动已下载的 CC-Switch 应用程序

![CC-Switch 启动界面](/images/cc-switch/CC-Switch-003.webp)

2. 在分组选择菜单中选择 **「Codex」**

![选择 Codex 分组](/images/cc-switch/CC-Switch-008.webp)

3. 在供应商分组中选择 **「LLM-Link」**

![选择 LLM-Link 供应商](/images/cc-switch/CC-Switch-009.png)

4. 在 [LLM-Link 控制台](https://www.llm-link.top) 创建 **Codex 分组**的令牌，点击复制按钮将 ApiKey 复制到剪贴板

![从控制台复制 API Key](/images/cli-config/Cli-008.webp)

5. 展开弹窗，找到「API Key」输入框，粘贴 ApiKey，点击右下角「添加」按钮

![填写 API Key](/images/cc-switch/CC-Switch-010.png)

6. 添加成功后，在主界面点击右侧「启用」按钮，状态显示「使用中」即完成

![启用状态](/images/cc-switch/CC-Switch-011.png)

7. 打开终端运行 `codex`，能正常对话说明配置成功

![终端运行 codex 验证](/images/cli-config/Cli-010.webp)
