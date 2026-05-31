# 文章创作技能包（自包含·可移植）

为《人人都能用 AI 写程序》系列教程沉淀的一套完整工作流。**换电脑、新会话，只看这个目录就能完美复现**——从写作、配图、动画到公众号发布全覆盖。

## 新环境从这里开始（按顺序读）

1. **[SETUP.md](SETUP.md)** — 环境依赖、凭证配置、IP白名单、最小验证。**先配好环境。**
2. **[WORKFLOW.md](WORKFLOW.md)** — 端到端 SOP，从主题到发布的每一步命令 + 实战避坑总表。**照着做就能产出文章。**
3. **skills/** 各 `SKILL.md` — 每个技能的详细规范（写作铁律、配图分层、叙事进阶等）。
4. **../articles/** — 三篇完整成品，是活样板，照抄结构即可。

## 技能清单

| 技能 | 作用 | 入口 |
|------|------|------|
| **article-writing-pipeline** | 文章创作流水线：5阶段编排 + 8段式骨架 + 内容深度标准 + 叙事进阶 + 分层配图策略 | `article-writing-pipeline/SKILL.md` |
| **cloakbrowser-scraper** | 抓取+演示素材工厂：穿透反爬抓竞品、HTML截图、录GIF、5个素材模板 | `cloakbrowser-scraper/SKILL.md` |
| **wechat-publisher** | 公众号草稿发布：零依赖Python，markdown→公众号内联HTML，传图+存草稿 | `wechat-publisher/SKILL.md` |

## 核心方法论速记

- **写作**：标题要狠、开篇场景化/数字背书、掺真实翻车细节、金句收尾；8段式骨架；术语+重类比；每篇沉淀一个方法论矩阵。
- **配图分层**：封面/信息图首选 gpt-image-2（PPT风、SVG图标、无Emoji，中文必核验）；要文字100%精确退回HTML截图；动态对比用GIF；真实成果截真页面。
- **高级≠刷黑底**：靠信息分层 + 结构表意 + 视觉引导 + 一图一核心。
- **发布**：只存草稿不群发；IP白名单以微信报错为准、有生效延迟。
- **安全**：凭证只进环境变量，不进git；第三方技能先审查再用。

## 依赖

```bash
python -m pip install cloakbrowser pillow
```
公众号发布需 `WECHAT_APP_ID`/`WECHAT_APP_SECRET` + IP白名单；配图需 LLM-Link key。详见 SETUP.md。
