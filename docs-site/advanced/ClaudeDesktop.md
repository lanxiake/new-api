# Claude Desktop

本教程介绍如何将 Claude Desktop 接入 LLM-Link。

::: warning 关于截图中的品牌名称
以下流程截图来自第三方工具，可能显示其他品牌的供应商名称作为示例。**实际配置请按本页文字步骤操作**：供应商名称填 `LLM-Link`，API 地址填 `https://www.llm-link.top`。
:::

## 下载与安装

前往 [Claude Desktop 下载页](https://claude.ai/download)，选择适合你操作系统的安装包。

![Claude Desktop 下载页](/images/advanced/ClaudeDesktop-01.webp)

::: warning Windows 用户注意
Windows 系统需要代理（TUN 模式或命令行代理）才能访问 Anthropic 服务器。  
建议在运行安装包之前，先设置 HTTP/HTTPS 代理环境变量（如使用 Clash Verge，端口通常为 7897）。
:::

直接双击安装包会报错：

![Windows 直接安装报错](/images/advanced/ClaudeDesktop-02.webp)

在 Clash Verge 等代理软件中查看本地端口（通常为 7897）：

![查看代理本地端口](/images/advanced/ClaudeDesktop-03.webp)

然后在命令行中带上代理环境变量执行安装：

![命令行带代理执行安装](/images/advanced/ClaudeDesktop-04.webp)

安装顺利完成：

![安装完成](/images/advanced/ClaudeDesktop-05.webp)

macOS 用户直接双击安装即可，无需额外配置：

![macOS 直接安装](/images/advanced/ClaudeDesktop-06.webp)

打开 Claude Desktop 进入登录界面：

![Claude Desktop 登录界面](/images/advanced/ClaudeDesktop-07.webp)

## 开启开发者模式

为了绕过登录并接入第三方 API，需要先启用开发者模式：

**Windows：** 顶部菜单 → 帮助 → 故障排查 → 启用开发者模式

![Windows 启用开发者模式](/images/advanced/ClaudeDesktop-08.webp)

切换开关启用：

![启用开发者模式开关](/images/advanced/ClaudeDesktop-09.webp)

**macOS：** 通过顶部菜单进入开发者菜单

![macOS 开发者菜单路径](/images/advanced/ClaudeDesktop-10.webp)

按提示重启应用。

## 配置第三方 API

开发者模式启用后：

1. 进入 **开发者 → 配置第三方推理**

![打开第三方推理配置](/images/advanced/ClaudeDesktop-11.webp)

2. 填写以下信息：
   - **网关基础 URL**：`https://www.llm-link.top`
   - **网关 API Key**：填入你的 **CC 分组** API Key
3. 开启「跳过登录模式选择」开关
4. 点击「本地应用」完成配置

![填写第三方推理配置](/images/advanced/ClaudeDesktop-12.png)

配置完成后即可正常对话：

![Claude Desktop 对话成功](/images/advanced/ClaudeDesktop-13.webp)

::: tip
完成配置后，Claude Desktop 将通过 LLM-Link 的 CC 渠道进行请求。
:::
