# Claude Code 配置

通过 CC-Switch 为 Claude Code 配置 LLM-Link。

::: warning 关于截图中的品牌名称
以下流程截图来自 CC-Switch 软件内置预设，可能显示其他品牌的供应商名称作为示例。**实际配置请按本页文字步骤操作**：选择「自定义供应商」或将名称改为 `LLM-Link`，API 地址填 `https://www.llm-link.top`。
:::

## 配置步骤

1. 启动 CC-Switch 软件，进入初始界面

![CC-Switch 启动界面](/images/cc-switch/CC-Switch-003.webp)

2. 在分组下拉菜单中选择 **「Claude」**

![选择 Claude 分组](/images/cc-switch/CC-Switch-004.webp)

3. 在供应商分组中选择 **「LLM-Link」**

![选择 LLM-Link 供应商](/images/cc-switch/CC-Switch-005.png)

4. 在 [LLM-Link 控制台](https://www.llm-link.top) 创建 **CC 分组**的令牌，点击复制按钮将 ApiKey 复制到剪贴板

![从控制台复制 API Key](/images/cli-config/Cli-025.webp)

5. 回到 CC-Switch，找到「API Key」配置项，粘贴 ApiKey，点击「添加」按钮

![粘贴 API Key](/images/cc-switch/CC-Switch-006.png)

6. 点击「启用」按钮，待状态显示「使用中」即配置完成

![启用状态 - 使用中](/images/cc-switch/CC-Switch-007.png)

7. 进入「设置」→「通用」，勾选「跳过 Claude Code 初次安装确认」

![跳过安装确认设置](/images/cc-switch/CC-Switch-017.webp)

8. 在终端运行 `claude`，能正常对话说明配置成功

![终端运行 claude 验证](/images/cli-config/Cli-016.webp)

::: warning CC 分组不支持第三方集成
CC 分组仅供 Claude Code 原生使用，**不支持第三方工具调用测试**。  
无法在 CC-Switch 内完成完整的调用测试，请直接在 Claude Code 对话中验证是否生效。
:::
