# Gemini 配置

手动配置 Gemini CLI 以使用 LLM-Link。

::: warning 暂未支持 Gemini
LLM-Link 当前**尚未上架 Gemini 系列模型**，也没有专属的 Gemini 分组。
Gemini CLI 接入功能正在筹备中，上线后会在此更新配置说明。

如有迫切需求，可加入官方交流群反馈，加快排期。
:::

以下为 Gemini CLI 配置方法，待 LLM-Link 上线 Gemini 支持后可按此操作。

## Windows 配置步骤

1. 按 `Win+R`，输入 `%userprofile%\.gemini`，回车打开配置目录

2. 检查目录内是否存在 `.env` 文件，若不存在则手动创建

3. 写入以下内容（上线后替换为实际 base URL 和分组令牌）：

```env
GOOGLE_GEMINI_BASE_URL=https://www.llm-link.top
GEMINI_API_KEY=sk-xxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-2.5-pro
```

4. 在 [LLM-Link 控制台](https://www.llm-link.top/console/token) 创建对应分组的令牌，将 `sk-xxxxxxxxxxxxxxxx` 替换为你的 ApiKey

5. 在终端运行 `gemini`，能看到对话界面并正常交互表示配置成功

## macOS / Linux 配置步骤

1. 在访达中按 `Command+Shift+G`，输入 `~/.gemini` 打开配置目录（Linux 直接打开 `~/.gemini`）

2. 按照 Windows 步骤 2-4 相同方式创建 `.env` 文件并填写配置

3. 在终端运行 `gemini`，能看到对话界面并正常交互表示配置成功
