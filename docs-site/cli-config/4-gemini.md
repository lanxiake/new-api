# Gemini 配置

手动配置 Gemini CLI 以使用 LLM-Link。

## Windows 配置步骤

1. 按 `Win+R`，输入 `%userprofile%\.gemini`，回车打开配置目录

2. 检查目录内是否存在 `.env` 文件，若不存在则手动创建

3. 写入以下内容：

```env
GOOGLE_GEMINI_BASE_URL=https://www.llm-link.top
GEMINI_API_KEY=xxx
GEMINI_MODEL=gemini-2.5-pro
```

4. 在 [LLM-Link 控制台](https://www.llm-link.top) 创建 **Gemini 分组**的令牌，将 `xxx` 替换为你的 ApiKey

5. 在终端运行 `gemini`，能看到对话界面并正常交互表示配置成功

## macOS 配置步骤

1. 在访达中按 `Command+Shift+G`，输入 `~/.gemini` 打开配置目录

2. 按照 Windows 步骤 2-4 相同方式创建 `.env` 文件并填写配置

3. 在终端运行 `gemini`，能看到对话界面并正常交互表示配置成功
