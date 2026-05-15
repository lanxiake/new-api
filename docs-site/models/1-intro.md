# 模型广场介绍

模型广场是 LLM-Link 平台展示所有可用模型与令牌分组的入口，提供供应商、分组、计费类型、端点类型等多维筛选能力。

## 如何进入

登录 LLM-Link 控制台后，点击顶部导航栏的 **「模型广场」**，即可进入。

![模型广场入口](/images/models/marketplace-entry.png)

也可直接访问：[https://www.llm-link.top/pricing](https://www.llm-link.top/pricing)

## 页面结构

![模型广场 - 整体视图](/images/models/marketplace-list.png)

页面采用 **左侧筛选 + 右侧模型列表** 布局：

**左侧筛选区：**
- **供应商**：Anthropic、OpenAI、Mistral、Moonshot、DeepSeek、智谱、阿里巴巴、未知供应商
- **可用令牌分组**：cc、cc-sale、codex、codex-sale、default、doubao-seed、vip
- **计费类型**：按量计费 / 按次计费
- **标签**
- **端点类型**：anthropic / openai

**右侧模型卡片：**
- 模型名称（如 `gpt-5.1`、`claude-opus-4-7`）
- 输入价格 / 补全价格 / 缓存读取价格（每 1M Tokens 的 USD 单价）
- 计费类型标识

## 两种视图

### 卡片视图（默认）

每个模型一张卡片，直观展示价格三项。

### 表格视图

点击右上角 **「表格视图」** 按钮可切换：

![模型广场 - 表格视图](/images/models/marketplace-table.png)

表格视图便于横向对比多个模型的价格。

## 价格显示控制

页面右上角提供两个开关：

- **充值价格显示**：在「按平台充值汇率换算后的人民币价格」与「美元原价」之间切换
- **倍率**：显示当前选中分组的倍率（例如 `cc` 为 2.5x，`codex-sale` 为 0.8x）

::: tip
建议在创建令牌前，先按 **令牌分组** 筛选一遍，确认目标分组下确实存在你需要调用的模型名称，避免后续 CLI 工具配置时出现「模型不存在」的错误。
:::

## 分组倍率一览

当前生产环境共 **7 个分组**，倍率如下：

| 分组 | 倍率 | 主要用途 |
|------|------|---------|
| `default` | 1x | 默认分组，通用模型（DeepSeek、Mistral、Moonshot、智谱等），含部分免费模型 |
| `cc` | 2.0x | Claude Code 高质量专用（Anthropic 模型，智商在线，高效稳定） |
| `codex` | 0.6x | Codex CLI 专用分组（OpenAI 模型） |
| `codex-sale` | 低至 0.4x | GPT 特价分组，支持 Codex、CC 和工具调用 |
| `cc-sale` | 低至 0.8x | Claude CC 特价分组，性价比首选 |
| `doubao-seed` | 1x | 豆包视频生成（高清无水印，按次计费） |
| `vip` | 1x | 预留 |

详细分组说明见 [令牌分组介绍](./2-group)。
