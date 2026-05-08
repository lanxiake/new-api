# OpenClaw

OpenClaw 是面向 Linux 服务器和 macOS 用户的 CLI 工具，可通过 LLM-Link 接入 AI 模型。

## 安装

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

安装完成后按照 QuickStart 向导依次配置：

1. 跳过初始供应商设置
2. 选择 Anthropic 适配器
3. 选择 `opus-4.5` 模型
4. 配置社交媒体适配器（如 Telegram）
5. 安装 hooks 和 gateway 组件
6. 添加 shell 自动补全脚本

## 配置 LLM-Link 渠道

LLM-Link 提供专用配置脚本，通过 openclaw-configurator 完成：

```bash
# 安装配置器
npm install -g openclaw-configurator

# 运行配置
openclaw-configurator
```

按提示操作：
1. 选择「添加供应商」→「LLM-Link」
2. 选择 Claude Opus 4.5 作为模型
3. 输入对应分组的 API 令牌

**各模型推荐分组：**

| 模型类型 | 推荐分组 |
|---------|---------|
| GPT 系列 | `codex`、`gpt-officially` |
| Claude 系列 | `aws-q`、`aws`、`claude-officially` |
| Gemini 系列 | `gemini-slb` |

## 访问 Dashboard

通过控制台命令获取 Dashboard URL，在浏览器中访问。

若部署在服务器上，建议配置 Nginx 反向代理和 SSL 证书，并修改 `openclaw.json` 配置文件中的相关地址。

## Telegram Bot 集成

获取 Bot 首次消息中的配对码，然后运行：

```bash
openclaw pairing approve telegram <配对码>
```

完成配对后即可通过 Telegram 进行交互。
