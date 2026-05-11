# Codex 相关问题

## 如何高效使用 Codex

感知到「模型降智」通常源于任务管理不当，而非模型真实下降。建议：

- **细粒度拆分任务**，避免单次提交过多内容
- **保持认知主导**，随时审查 AI 的修改
- **避免上下文过度压缩**，压缩比例超过 60% 时建议新开会话

## Windows 系统完整配置

完整配置可解决文件 I/O、编码错误、Token 浪费和项目记忆等问题。

**config.toml：**

```toml
model = "gpt-5.2"
provider = "llm-link"

[providers.llm-link]
name = "llm-link"
baseURL = "https://www.llm-link.top/v1"
envVar = "OPENAI_API_KEY"
```

**AGENTS.md（全局提示词示例）：**

```markdown
# 全局指令
- 请用中文回复
- 修改代码时必须先解释你的计划
- 遇到不确定的地方先询问再操作
```

## 常用 Codex 命令

| 命令 | 说明 |
|------|------|
| `/model` | 切换模型 |
| `/review` | 查看工作区变更 |
| `/resume` | 继续上一次会话 |
| `/compact` | 压缩对话历史 |

## 常见错误处理

**编码问题（Windows）：** 在 Windows 系统语言设置中开启 UTF-8 支持。

按 `Win+R` 打开命令窗口：

![Win+R 打开命令窗口](/images/faq/Codex-command.webp)

进入区域设置，点击「更改系统区域设置」：

![更改系统区域设置](/images/faq/Codex-001.webp)

勾选「Beta：使用 UTF-8 提供全球语言支持」并重启系统：

![启用 UTF-8 支持](/images/faq/Codex-002.webp)

**VSCode Codex 插件模型版本更新：** 找到对应版本的扩展目录：

![Windows VSCode 扩展目录](/images/faq/Codex-003.webp)

进入 `webview/assets` 目录修改 JS 文件：

![webview/assets 目录](/images/faq/Codex-004.webp)

macOS 用户通过 Finder 进入扩展目录：

![macOS 扩展目录路径](/images/faq/Codex-009.webp)

**401 错误：** API Key 缺失或错误，检查 `auth.json` 中的 `OPENAI_API_KEY` 是否正确。

**403 错误：** 账号额度问题，检查 [LLM-Link 控制台](https://www.llm-link.top) 余额后重试。

**连接失败：** 检查网络和代理设置；若在容器中使用，尝试将 MTU 值调整为 1500。

## 开启网络搜索

在 `config.toml` 中添加搜索工具配置即可启用联网能力（需对应分组支持）：

![Codex 网络搜索效果](/images/faq/Codex-010.webp)
