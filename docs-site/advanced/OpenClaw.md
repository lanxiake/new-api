# OpenClaw

OpenClaw 是一个开源工程型 AI 智能体，支持多供应商、本地 Gateway 代理、多 Agent 路由，配合 CC-Switch 可快速接入 LLM-Link。

## 安装

```bash
# macOS / Linux（官方脚本，自动处理 Node.js 依赖）
curl -fsSL https://openclaw.ai/install.sh | bash

# 或通过 npm 手动安装（Node.js ≥ 22）
npm i -g openclaw
```

安装完成后运行初始化向导：

```bash
openclaw onboard
```

向导过程中如无特殊需求可直接回车跳过默认项；涉及供应商的步骤建议**先跳过**，后续通过 CC-Switch 统一配置更方便。

## 通过 CC-Switch 配置 LLM-Link 供应商

### 1. 切换到 OpenClaw 选项卡

启动 CC-Switch，在顶部 Tab 切换到 **OpenClaw** 选项卡。

### 2. 添加供应商

点击界面右上角橙色 **「+」** 按钮（Add Provider），填写以下字段：

| 字段 | 填写内容 |
|------|---------|
| 名称 | `LLM-Link`（自定义显示名） |
| Base URL | `https://www.llm-link.top` |
| API Key | 从 LLM-Link 控制台「令牌管理」复制的 sk-... |
| 主模型 | 按需填写（见下方分组推荐） |

::: tip Base URL 说明
OpenClaw 配置中 Base URL **不需要加 `/v1`**，CC-Switch 和 OpenClaw 会自动拼接路径。
:::

### 3. 选择分组与模型

根据需要调用的模型系列，在 LLM-Link 控制台创建对应分组的令牌，并填入上方 API Key：

| 目标模型系列 | 推荐分组 | 模型示例 |
|------------|---------|---------|
| Claude 系列 | `cc` | `claude-opus-4-7`、`claude-sonnet-4-6` |
| Claude 系列（折扣） | `cc-sale` | 同上，价格更低 |
| GPT / Codex 系列 | `codex` | `gpt-5.1`、`gpt-5-codex` |
| GPT / Codex 系列（折扣） | `codex-sale` | 同上 |
| DeepSeek / Mistral 等 | `default` | `deepseek-v4-flash`、`kimi-k2` |

### 4. 启用

点击 **「Enable」** 按钮，CC-Switch 自动将配置写入 `~/.openclaw/openclaw.json`，无需手动编辑文件。

## 启动 Gateway

```bash
openclaw gateway --port 18789
```

启动成功后 OpenClaw 在本地监听 18789 端口。打开浏览器访问 `http://127.0.0.1:18789/` 可查看可视化控制台（请求日志、渠道状态、模型列表等）。

## 切换供应商（无需重启）

在 CC-Switch 供应商列表中，直接点击目标供应商的 **「Enable」**，切换立即生效，无需重启 Gateway。

## 工作区文件（AGENTS.md 等）

CC-Switch 内置 **工作区编辑器**，可可视化编辑 OpenClaw 的 Agent 文件，支持 Markdown 实时预览：

| 文件 | 用途 |
|------|------|
| `AGENTS.md` | 多 Agent 路由规则 |
| `SOUL.md` | Agent 人格与语气风格 |
| `USER.md` | 你的个人信息 |
| `MEMORY.md` | 长期记忆（可手动追加） |
| `BOOT.md` | 启动提示词 |

在 CC-Switch 的 **「工作区」** 面板中直接编辑，保存后自动同步到 `~/.openclaw/workspace/`。

## 验证配置

```bash
# 查看当前模型
openclaw config get agent.model

# 切换模型（也可在 CC-Switch 中操作）
openclaw config set agent.model "llm-link/claude-opus-4-7"

# 校验配置合法性
openclaw config validate
```

::: tip 多套令牌并行
可在 CC-Switch 中为 LLM-Link 添加多个供应商条目（分别命名如 `LLM-Link cc`、`LLM-Link codex`），按需一键切换，无需修改任何配置文件。
:::
