# Claude Code 相关问题

## 在 VSCode Claude Code 插件中使用 LLM-Link

1. 找到 `.claude` 配置目录（Windows：`%userprofile%\.claude`；macOS：`~/.claude`）

**Windows：** 按 `Win+R` 输入路径打开：

![Windows 打开 .claude 目录](/images/cli-config/Cli-013.webp)

目录内容如下：

![Windows .claude 目录内容](/images/cli-config/Cli-014.webp)

**macOS：** 在访达中按 `Command+Shift+G` 输入路径：

![macOS 跳转 ~/.claude](/images/cli-config/Cli-017.webp)

目录内容如下：

![macOS .claude 目录内容](/images/cli-config/Cli-018.webp)

2. 打开 `config.json`，添加以下内容：

```json
{
  "primaryApiKey": "LLM-Link"
}
```

## 常用 Claude Code 命令

| 命令 | 说明 |
|------|------|
| `claude` | 启动交互式对话 |
| `claude -p "问题"` | 一次性打印模式 |
| `claude -c` | 继续上一次对话 |
| `claude --model sonnet` | 指定模型 |
| `claude --verbose` | 详细日志输出 |

## Claude Code 无法连接到 Anthropic 服务

启动 `claude` 时常见的连接错误：

![无法连接到 Anthropic 服务](/images/faq/CC-001.webp)

macOS 用户可通过自带终端执行修复脚本：

![macOS 终端位置](/images/faq/CC-002.webp)

初次配置时可能再次出现连接错误，按下方脚本处理即可：

![首次配置连接错误](/images/faq/CC-003.webp)

如果运行 `claude` 时提示连接失败，执行以下脚本以跳过初始化验证：

::: code-group

```powershell [Windows（PowerShell）]
$file = "$env:USERPROFILE\.claude.json"
$content = Get-Content $file -Raw | ConvertFrom-Json
$content | Add-Member -Force -MemberType NoteProperty -Name hasCompletedOnboarding -Value $true
$content | ConvertTo-Json | Set-Content $file
```

```bash [macOS / Linux]
jq '.hasCompletedOnboarding = true' ~/.claude.json > /tmp/claude.json && mv /tmp/claude.json ~/.claude.json
```

:::

## 调整上下文窗口

若希望使用原版 200K 上下文（而非 1M），在 `settings.json` 中添加：

```json
{
  "env": {
    "CLAUDE_CODE_DISABLE_1M_CONTEXT": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "CLAUDE_CODE_DISABLE_TERMINAL_TITLE": "1"
  }
}
```
