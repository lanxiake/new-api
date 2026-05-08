# Codex 配置

手动配置 Codex 以使用 LLM-Link。

Codex 需要配置三个文件：

| 文件 | 说明 |
|------|------|
| `config.toml` | 核心配置，中转服务与 MCP 均在此配置 |
| `auth.json` | 存储 API Key |
| `AGENTS.md` | Codex 全局提示词 |

::: tip
新安装的 Codex 可能需要手动创建这些文件。
:::

## Windows 配置步骤

1. 按 `Win+R`，输入 `%userprofile%\.codex`，回车打开配置目录

2. 创建 `config.toml`，填入以下内容：

```toml
model = "gpt-5.2"
provider = "llm-link"

[providers.llm-link]
name = "llm-link"
baseURL = "https://www.llm-link.top/v1"
envVar = "OPENAI_API_KEY"
```

3. 创建 `auth.json`，填入以下内容：

```json
{"OPENAI_API_KEY": "xxx"}
```

4. 在 [LLM-Link 控制台](https://www.llm-link.top) 创建 **Codex 分组**的令牌，将 `xxx` 替换为你的 ApiKey

5. 在终端运行 `codex`，能正常对话表示配置成功

## macOS 配置步骤

1. 在访达中按 `Command+Shift+G`，输入 `~/.codex` 打开配置目录

2. 按照 Windows 步骤 2-4 相同方式创建配置文件（`config.toml` 中 model 可使用 `gpt-5.1-codex`）

3. 在终端运行 `codex`，能正常对话表示配置成功
