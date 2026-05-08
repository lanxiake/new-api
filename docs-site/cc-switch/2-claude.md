# Claude Code 配置

通过 CC-Switch 为 Claude Code 配置 LLM-Link。

## 配置步骤

1. 启动 CC-Switch 软件，进入初始界面

2. 在分组下拉菜单中选择 **「Claude」**

3. 在供应商分组中选择 **「LLM-Link」**

4. 在 [LLM-Link 控制台](https://www.llm-link.top) 创建 **CC 分组**的令牌，点击复制按钮将 ApiKey 复制到剪贴板

5. 找到「API Key」配置项，粘贴 ApiKey，点击「添加」按钮

6. 点击「启用」按钮，待状态显示「使用中」即配置完成

7. 进入「设置」→「通用」，勾选「跳过 Claude Code 初次安装确认」

8. 在终端运行 `claude`，能正常对话说明配置成功

::: warning CC 分组不支持第三方集成
CC 分组仅供 Claude Code 原生使用，**不支持第三方工具调用测试**。  
无法在 CC-Switch 内完成完整的调用测试，请直接在 Claude Code 对话中验证是否生效。
:::
