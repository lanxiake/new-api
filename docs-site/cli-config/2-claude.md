# Claude Code 配置

手动配置 Claude Code 以使用 LLM-Link。

## Windows 配置步骤

1. 按 `Win+R`，输入 `%userprofile%\.claude`，回车打开配置目录

2. 检查目录内是否存在 `settings.json`，若不存在则手动创建

3. 写入以下配置内容：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://www.llm-link.top",
    "ANTHROPIC_AUTH_TOKEN": "xxx",
    "CLAUDE_CODE_ATTRIBUTION_HEADER": "0",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "CLAUDE_CODE_DISABLE_TERMINAL_TITLE": "1"
  }
}
```

4. 在 [LLM-Link 控制台](https://www.llm-link.top) 创建 **CC 分组**的令牌，将 `xxx` 替换为你的 ApiKey

5. 在终端运行 `claude`，能正常收到回复表示配置成功

## macOS 配置步骤

1. 在访达中按 `Command+Shift+G`，输入 `~/.claude` 打开配置目录

2. 检查目录内是否存在 `settings.json`，若不存在则手动创建

3. 写入与 Windows 步骤 3 相同的配置内容

4. 将 `xxx` 替换为你的 CC 分组令牌

5. 在终端运行 `claude`，能正常收到回复表示配置成功

::: warning 配置后仍报错？
若提示需要登录，请参考 [Claude Code 常见问题 → 无法连接到 Anthropic 服务](/faq/CC#claude-code-无法连接到-anthropic-服务) 中的解决方案。
:::
