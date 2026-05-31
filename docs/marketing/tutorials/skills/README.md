# 文章创作技能包

为《人人都能用 AI 写程序》系列教程沉淀的一套可复用技能，覆盖从写作、配图、动画到公众号发布的完整流程。

## 技能清单

| 技能 | 作用 | 关键文件 |
|------|------|---------|
| **article-writing-pipeline** | 文章创作流水线（总指挥）：5 阶段编排 + 8 段式骨架 + 内容深度标准 + 分层配图策略 | `SKILL.md`、`references/article-templates.md`、`scripts/generate_image.py` |
| **cloakbrowser-scraper** | 抓取 + 演示素材工厂：穿透反爬抓竞品、HTML 截图、录 GIF、4 个素材模板 | `SKILL.md`、`scripts/{scrape,screenshot,html_to_gif}.py`、`templates/*.html` |
| **wechat-publisher** | 公众号草稿发布：零依赖 Python，markdown→公众号内联HTML，传图+存草稿 | `SKILL.md`、`scripts/publish.py` |

## 配合流程

```
一句话主题
  → [article-writing-pipeline] 研究 / 大纲 / 写作（8段式 + 术语科普 + 方法论矩阵）
  → 配图分层：
      封面     → generate_image.py（gpt-image-2，专业科技风，每篇差异化）
      原理/矩阵 → cloakbrowser templates + screenshot.py（黑白手绘信息图，中文零乱码）
      对比/演示 → cloakbrowser html_to_gif.py（动态对比 GIF）
      真实成果 → cloakbrowser 截真页面
  → [wechat-publisher] 生成 publish.md → 发布到公众号草稿箱（人工审核后再推送）
```

## 核心经验（实测沉淀）

- **配图分层**：封面用 AI 出（专业科技/科幻/商务风，弃卡通萌系）；带中文的信息图/矩阵一律 HTML 精确绘制后截图（AI 渲染中文必乱）；成果用真实截图/GIF。
- **内容深度**：适度引入真术语（AI 幻觉、提示词、隐性知识→显性指令）+ 重类比；每篇沉淀一个方法论/选择矩阵；关键对比做动态 GIF。
- **发布避坑**：IP 白名单以微信报错里的 IP 为准、有几分钟生效延迟；GIF 公众号可用。
- **安全**：所有脚本凭证从环境变量读，无硬编码密钥。

## 使用前提

- Python 3（标准库即可）
- `cloakbrowser`（`python -m pip install cloakbrowser`，scraper 技能用）
- 公众号发布需环境变量 `WECHAT_APP_ID` / `WECHAT_APP_SECRET` + IP 白名单
- 配图生成需 LLM-Link 的 key（环境变量传入，勿硬编码）

详见各技能目录下的 `SKILL.md`。
