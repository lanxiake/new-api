# 通用步骤

CC-Switch 是 Claude Code / Codex / Gemini CLI 全方位辅助工具，可快速切换多个 API 供应商、通过图形界面管理配置，并内置 LLM-Link 配置模板。

## 安装 CC-Switch

根据你的操作系统选择对应的安装方式：

::: code-group

```bash [macOS（Homebrew）]
brew tap farion1231/ccswitch
brew install --cask cc-switch
```

```bash [Windows]
# 从 GitHub Releases 下载 MSI 安装包并运行
# https://github.com/farion1231/cc-switch/releases
```

```bash [Linux（Debian/Ubuntu）]
# 从 GitHub Releases 下载 .deb 文件
# https://github.com/farion1231/cc-switch/releases
sudo dpkg -i cc-switch_*.deb
```

:::

Windows 用户可直接前往 GitHub Releases 下载最新版 MSI 安装包：

![GitHub Releases 下载页](/images/cc-switch/CC-Switch-001.webp)

安装完成后启动程序，进入主界面：

![CC-Switch 主界面](/images/cc-switch/CC-Switch-002.png)

## 重要前置步骤

::: warning 请务必先检查环境！！！
安装 CC-Switch 后，在进行任何 CLI 配置之前，**请务必先完成** [环境检查](/cli-config/1-env) 步骤，确认 Node.js 已正确安装，各 CLI 工具已初始化。
:::

## 接下来

根据你需要使用的工具，选择对应的配置教程：

- [Claude Code 配置](./2-claude)
- [Codex 配置](./3-codex)
- [Gemini 配置](./4-gemini)
- [CC-Switch-CLI 使用](./5-ccs_cli)（服务器 / macOS 命令行环境）
