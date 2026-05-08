# CC-Switch-CLI 使用

CC-Switch-CLI 是 CC-Switch 的命令行版本，适合在**服务器环境**或 **macOS** 系统中使用，无需图形界面即可管理 Claude Code、Codex、Gemini 的供应商配置、MCP 服务器、Skills 扩展和系统提示词。

## 安装

::: code-group

```bash [macOS（Universal）]
# 下载 Universal Binary（支持 Apple Silicon 和 Intel）
curl -L https://github.com/farion1231/cc-switch/releases/latest/download/ccs-cli-macos-universal.tar.gz -o ccs-cli.tar.gz
tar -xzf ccs-cli.tar.gz
chmod +x ccs-cli
sudo mv ccs-cli /usr/local/bin/
```

```bash [Linux x64]
curl -L https://github.com/farion1231/cc-switch/releases/latest/download/ccs-cli-linux-x64.tar.gz -o ccs-cli.tar.gz
tar -xzf ccs-cli.tar.gz
chmod +x ccs-cli
sudo mv ccs-cli /usr/local/bin/
```

```bash [Linux ARM64（树莓派等）]
curl -L https://github.com/farion1231/cc-switch/releases/latest/download/ccs-cli-linux-arm64.tar.gz -o ccs-cli.tar.gz
tar -xzf ccs-cli.tar.gz
chmod +x ccs-cli
sudo mv ccs-cli /usr/local/bin/
```

```bash [Windows]
# 下载 zip 文件后，将可执行文件移至系统 PATH 目录，或直接运行
# https://github.com/farion1231/cc-switch/releases
```

:::

## 主要功能

| 功能 | 说明 |
|------|------|
| **供应商管理** | API 配置切换、多端点支持、速度测试 |
| **MCP 服务器管理** | 支持 stdio、HTTP、SSE 传输类型 |
| **提示词管理** | 管理系统提示词预设，跨应用使用 |
| **Skills 管理** | 安装和管理社区贡献的 Skills |
| **配置备份恢复** | 自动保留最近 10 个备份，支持导入导出 |

## 配置 LLM-Link

1. 在终端运行 `ccs-cli` 启动 TUI 界面

2. 进入「Providers」部分，按 `a` 添加供应商

3. 从模板列表中选择 **「LLM-Link」**

4. 输入你的 API Key，按 `Ctrl+S` 保存

5. 退出前确认所配置的 Provider 已被选中

::: tip
在服务器环境中，推荐使用 CC-Switch-CLI 而非图形界面版本。
:::
