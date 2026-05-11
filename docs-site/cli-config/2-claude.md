# Claude Code 配置

手动配置 Claude Code 以使用 LLM-Link。

## 分组选择

LLM-Link 提供两个 Claude Code 专属分组，根据需求选择：

| 分组 | 倍率 | 说明 |
|------|------|------|
| **cc** | 2.5x | 高质量，智商在线，高效稳定，推荐用于日常开发 |
| **cc-sale** | 0.9x | 特价分组，性价比首选，适合高频使用 |

在 [LLM-Link 控制台](https://www.llm-link.top/console/token) 创建令牌时选择对应分组。

## Windows 配置步骤

1. 按 `Win+R`，输入 `%userprofile%\.claude`，回车打开配置目录

![Win+R 输入路径](/images/cli-config/Cli-013.webp)

2. 检查目录内是否存在 `settings.json`，若不存在则手动创建

![.claude 目录内容](/images/cli-config/Cli-014.webp)

3. 写入以下配置内容：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://www.llm-link.top",
    "ANTHROPIC_AUTH_TOKEN": "sk-xxxxxxxxxxxxxxxx",
    "CLAUDE_CODE_ATTRIBUTION_HEADER": "0",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "CLAUDE_CODE_DISABLE_TERMINAL_TITLE": "1"
  }
}
```


4. 将 `sk-xxxxxxxxxxxxxxxx` 替换为你在控制台创建的 **cc** 或 **cc-sale** 分组令牌

![从控制台复制令牌](/images/cli-config/Cli-025.webp)

5. 在终端运行 `claude`，能正常收到回复表示配置成功

![终端测试 claude](/images/cli-config/Cli-016.webp)

## macOS / Linux 配置步骤

1. 在访达中按 `Command+Shift+G`，输入 `~/.claude` 打开配置目录（Linux 直接打开 `~/.claude`）

![访达跳转 ~/.claude](/images/cli-config/Cli-017.webp)

2. 检查目录内是否存在 `settings.json`，若不存在则手动创建

![macOS .claude 目录](/images/cli-config/Cli-018.webp)

3. 写入与 Windows 步骤 3 相同的配置内容，并将令牌替换为你的 cc / cc-sale 分组令牌

4. 在终端运行 `claude`，能正常收到回复表示配置成功

::: warning 配置后仍报错？
若提示需要登录，请参考 [Claude Code 常见问题 → 无法连接到 Anthropic 服务](/faq/CC#claude-code-无法连接到-anthropic-服务) 中的解决方案。
:::
