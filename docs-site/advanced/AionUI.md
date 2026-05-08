# AionUi

AionUI 是一个统一的图形界面工具，可同时管理 Claude Code、Gemini、Codex、Qwen Code 等多个 CLI AI 工具。

## 主要特性

- **统一界面**：自动检测本地 CLI 工具，提供单一 GUI 入口
- **多会话**：支持多个独立上下文的并行对话
- **本地数据**：所有对话存储在本地 SQLite 数据库
- **格式预览**：支持 PDF、Word、Excel、PPT、代码、Markdown、图片等 9+ 格式
- **远程 WebUI**：可通过浏览器从任意设备访问
- **多模型切换**：支持 Gemini、Claude、OpenAI、Qwen、Ollama

## 安装

| 系统 | 安装方式 |
|------|---------|
| Windows | 下载 `.exe` 安装包 |
| macOS | `brew install aionui` 或下载 `.dmg` |
| Linux | 下载 `.deb` 或 `.AppImage` |

前往 [AionUI GitHub](https://github.com/iOfficeAI/AionUi) 获取最新版本。

## 配置 LLM-Link

1. 在 [LLM-Link 控制台](https://www.llm-link.top) 创建对应分组的令牌（Gemini、CC 或 Codex 分组）

2. 打开 AionUI → 设置 → LLM 配置 → 添加模型

3. 平台选择「自定义」

4. 填写 API Key 和请求地址：

   | 分组 | 请求地址 |
   |------|---------|
   | Gemini / Claude | `https://www.llm-link.top` |
   | Codex | `https://www.llm-link.top/v1` |

5. 选择模型并保存
