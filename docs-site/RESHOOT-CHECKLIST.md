# 本地重拍截图清单

> 本清单列出所有需要在本地工具中重拍替换的截图。重拍要点：
> - 在第三方工具中选择「自定义供应商」流程
> - 供应商名称统一填写为 `LLM-Link`
> - API 地址统一填写为 `https://www.llm-link.top`
> - 截图分辨率建议 ≥ 1600×1000，保持原文件名覆盖即可

## 1. CC-Switch（Windows / macOS GUI）

> CC-Switch **未预设 LLM-Link**，必须走「自定义供应商」流程：分组下拉选 Claude / Codex / Gemini → 供应商选「添加自定义」→ 名称填 `LLM-Link` → API 地址 `https://www.llm-link.top` → 粘贴 ApiKey → 添加 → 启用。

### Claude（`docs-site/cc-switch/2-claude.md`）

| 文件名 | 拍摄场景 |
|--------|---------|
| `CC-Switch-003.webp` | CC-Switch 启动界面（空状态） |
| `CC-Switch-004.webp` | 分组下拉菜单展开，选中 **Claude** |
| `CC-Switch-005.png` | 供应商选择列表，**自定义供应商**项命名为 LLM-Link |
| `CC-Switch-006.png` | API Key 输入框已填，点击「添加」前的状态 |
| `CC-Switch-007.webp` | 启用后状态显示「使用中」，供应商名称为 LLM-Link |
| `CC-Switch-017.webp` | 设置 → 通用 → 「跳过 Claude Code 初次安装确认」勾选 |

### Codex（`docs-site/cc-switch/3-codex.md`）

| 文件名 | 拍摄场景 |
|--------|---------|
| `CC-Switch-008.webp` | 分组下拉选 **Codex** |
| `CC-Switch-009.webp` | 选择自定义供应商 LLM-Link |
| `CC-Switch-010.webp` | API Key 已填的弹窗 |
| `CC-Switch-011.webp` | 启用后「使用中」，主界面 |

### Gemini（`docs-site/cc-switch/4-gemini.md`）

> 重拍前请打开该文件确认引用的图片文件名，规则同上。

### CC-Switch-CLI（`docs-site/cc-switch/5-ccs_cli.md`）

> 终端命令行截图，重拍时确保示例供应商名为 `LLM-Link`，URL 为 `https://www.llm-link.top`。

## 2. 绘图工具

### Banana2 Pro（`docs-site/paint/Banana.md`）

通过 Cherry Studio 配置：供应商名 `LLM-Link`、API 地址 `https://www.llm-link.top`、密钥来自 LLM-Link 控制台。

### GPT-Image-2（`docs-site/paint/GPTImage.md`）

::: danger 内容也需修正
该文件提到「`gpt-image-2` 模型属于 **Sora 分组**」，但当前生产环境 **没有 sora 分组**（只有 cc / cc-sale / codex / codex-sale / default / doubao-seed / vip）。重拍前请先确认生产是否上架该模型与分组。
:::

## 3. 高级集成

### OpenCode（`docs-site/advanced/OpenCode.md`）
### OpenClaw（`docs-site/advanced/OpenClaw.md`）
### Claude Desktop（`docs-site/advanced/ClaudeDesktop.md`）
### AionUi（`docs-site/advanced/AionUI.md`）
### DS 接入 CC（`docs-site/advanced/DeepSeekClaudeCode.md`）

以上各章节中所有展示「供应商名称」「API 地址」字段的截图均需重拍，保证：
- 供应商名 = `LLM-Link`
- API 地址 = `https://www.llm-link.top`

## 重拍后处理

1. 直接覆盖 `docs-site/public/images/` 下同名文件
2. 本地预览：`cd docs-site && bun run dev`
3. 构建：`bun run build`
4. 部署：参考 CLAUDE.md「前端部署（docs-site）」章节

## 不需要重拍的部分

- `docs-site/public/images/models/marketplace-*.png` — 已从生产 LLM-Link 平台直接抓取，品牌正确
- `docs-site/public/images/guide/*` — 平台自身截图，已用真实 LLM-Link 界面
- `docs-site/public/images/cli-config/*` — 来自 LLM-Link 控制台的密钥复制截图，品牌正确
