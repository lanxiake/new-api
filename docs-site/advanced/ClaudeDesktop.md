# Claude Desktop

本教程介绍如何将 Claude Desktop 接入 LLM-Link。

## 下载与安装

前往 [Claude Desktop 下载页](https://claude.ai/download)，选择适合你操作系统的安装包。

::: warning Windows 用户注意
Windows 系统需要代理（TUN 模式或命令行代理）才能访问 Anthropic 服务器。  
建议在运行安装包之前，先设置 HTTP/HTTPS 代理环境变量（如使用 Clash Verge，端口通常为 7897）。
:::

macOS 用户直接安装即可，无需额外配置。

## 开启开发者模式

为了绕过登录并接入第三方 API，需要先启用开发者模式：

1. 启动 Claude Desktop，进入登录界面
2. 点击菜单，进入 **帮助 → 故障排查 → 启用开发者模式**
3. 按提示重启应用

## 配置第三方 API

开发者模式启用后：

1. 进入 **开发者 → 配置第三方推理**
2. 填写以下信息：
   - **网关基础 URL**：`https://www.llm-link.top`
   - **网关 API Key**：填入你的 **CC 分组** API Key
3. 开启「跳过登录模式选择」开关
4. 点击「本地应用」完成配置

::: tip
完成配置后，Claude Desktop 将通过 LLM-Link 的 CC 渠道进行请求。
:::
