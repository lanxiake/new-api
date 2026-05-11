# Codex 配置

手动配置 Codex 以使用 LLM-Link。

## 分组选择

LLM-Link 提供两个适用于 Codex 的分组：

| 分组 | 倍率 | 说明 |
|------|------|------|
| **codex** | 1x | Codex 专用分组，推荐首选 |
| **codex-sale** | 0.8x | GPT 特价分组，同时支持 Codex、CC 和工具调用 |

在 [LLM-Link 控制台](https://www.llm-link.top/console/token) 创建令牌时选择 **codex** 分组。

## 配置文件说明

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

![Win+R 打开 .codex 目录](/images/cli-config/Cli-006.webp)

2. 检查目录内的配置文件，若不存在则手动创建

![.codex 目录文件](/images/cli-config/Cli-007.webp)

3. 创建 `config.toml`，填入以下内容：

```toml
model = "gpt-5.2"
provider = "llm-link"

[providers.llm-link]
name = "llm-link"
baseURL = "https://www.llm-link.top/v1"
envVar = "OPENAI_API_KEY"
```

4. 创建 `auth.json`，填入以下内容：

```json
{"OPENAI_API_KEY": "sk-xxxxxxxxxxxxxxxx"}
```

![auth.json 配置](/images/cli-config/Cli-008.webp)

5. 在 [LLM-Link 控制台](https://www.llm-link.top/console/token) 创建 **codex 分组**的令牌，将 `sk-xxxxxxxxxxxxxxxx` 替换为你的 ApiKey

![从控制台复制 codex 令牌](/images/cli-config/Cli-009.webp)

6. 在终端运行 `codex`，能正常对话表示配置成功

![终端测试 codex](/images/cli-config/Cli-010.webp)

## macOS / Linux 配置步骤

1. 在访达中按 `Command+Shift+G`，输入 `~/.codex` 打开配置目录（Linux 直接打开 `~/.codex`）

![访达跳转 ~/.codex](/images/cli-config/Cli-011.webp)

2. 检查并按需创建配置文件

![macOS .codex 目录](/images/cli-config/Cli-012.webp)

3. 按照 Windows 步骤 3-5 相同方式创建配置文件

4. 在终端运行 `codex`，能正常对话表示配置成功
