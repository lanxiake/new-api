# 环境检查（通用步骤）

在配置 Claude Code、Codex 或 Gemini 之前，请先完成以下环境检查和 CLI 工具安装。

## 第一步：验证 Node.js 安装

在终端运行：

```bash
npm list -g --depth-0
```

![打开终端](/images/cli-config/Cli-001.webp)

若提示命令未找到，请先安装 Node.js：前往 [nodejs.org](https://nodejs.org) 下载并安装 LTS 版本。

## 第二步：安装 CLI 工具

```bash
npm install -g @anthropic-ai/claude-code@latest @openai/codex@latest @google/gemini-cli@latest
```

![npm 全局安装 CLI](/images/cli-config/Cli-002.webp)

## 第三步：测试安装（非常重要）

::: warning 此步骤不可跳过
运行以下命令会生成各工具的配置目录，**必须执行**，否则后续配置文件无法写入正确位置。
:::

依次运行每个工具，确认安装成功：

```bash
claude   # 测试 Claude Code
codex    # 测试 Codex
gemini   # 测试 Gemini
```

![Claude Code 安装成功](/images/cli-config/Cli-003.webp)

![Codex 安装成功](/images/cli-config/Cli-004.webp)

![Gemini 安装成功](/images/cli-config/Cli-005.webp)

每个工具首次运行时会显示初始化界面或提示，属于正常现象。

::: tip Claude Code 提示「无法连接」？
如果 `claude` 提示无法连接到 Anthropic 服务，请先参考 [Claude Code 常见问题 → 无法连接](/faq/CC#claude-code-无法连接到-anthropic-服务) 解决后再继续。
:::

## 第四步：按工具继续配置

环境检查完成后，选择你需要的工具继续配置：

- [Claude Code 配置](./2-claude)
- [Codex 配置](./3-codex)
- [Gemini 配置](./4-gemini)
