---
name: kg-tutorials
description: |
  MT图解百科——将任意自然科学主题拆解为「博物馆图鉴风」多张3D科普图解系列，支持公众号/小红书/视频号多平台发布。
  从一句话主题出发，自动完成：搜索核实 → 分镜大纲 → Prompt生成 → 批量生图 → 文案撰写 → 多平台发布。
  支持多主题系列并行，每个系列只需维护自己的 00-series-outline.md，通用工具完全复用。
  触发词：做一套图解 / MT图解百科 / 科普图解 / 帮我做图解 / 自然科普系列 / 继续做第X张
metadata:
  emoji: "🔬"
---

# MT图解百科 · 技能包

> 将任意自然科学主题拆解为「博物馆图鉴风」多张3D科普图解系列，支持公众号/小红书/视频号多平台发布。
>
> **绝不自动发布，只存草稿，由人工审核后推送。**

---

## 🚀 新会话接手任务的 AI，请先读：[`START-HERE.md`](./START-HERE.md)

**一份文档涵盖完整流程**——不需要在多个文件间跳读。`START-HERE.md` 是单文件 AI 入口。

其他文档：
- `SETUP.md` — 首次配置环境
- `WORKFLOW.md` — 完整命令参考（备查）
- `sub-skills/*/SKILL.md` — 单个子技能的详细规范（按需查）

---

## 安装 / 环境配置

```bash
cd kg-tutorials

# 1. 安装依赖
python -m pip install pillow

# 2. 初始化配置（首次）
python setup_config.py

# 3. 验证配置可用性（推荐）
python doctor.py
```

`doctor.py` 会自动检查依赖、配置、LLM-Link API、微信凭证连通性，并给出修复建议。

---

## 目录结构

```
kg-tutorials/                          ← 技能包根目录
├── SKILL.md                           ← 本文件：技能总入口
├── START-HERE.md                      ← ⭐ AI 一站式操作入口（接手任务必读）
├── GUIDE-FOR-AI.md                    ← AI全流程操作指南（详细版）
├── SETUP.md                           ← 环境配置：依赖/凭证/初始化向导
├── WORKFLOW.md                        ← 端到端SOP（含三轮强制搜索节点）
├── setup_config.py                    ← 初始化配置向导脚本
├── doctor.py                          ← ⚙️ 环境自检（依赖+配置+API连通性）
├── status.py                          ← 📊 系列进度查看 + 下一步建议
├── .kg-config.json                    ← 生成的配置文件（已 .gitignore）
│
├── sub-skills/                        ← 可复用子技能（工具代码，与系列数据分离）
│   ├── kg-outline-planner/            ← 技能1：主题分析 + 大纲生成
│   │   └── SKILL.md                   ← 规范文档（AI 推理用）
│   ├── kg-image-generator/            ← 技能2：英文Prompt生成 + 批量生图
│   │   ├── SKILL.md
│   │   └── scripts/generate_kg_image.py
│   └── kg-publisher/                  ← 技能3：文案撰写 + 多平台发布
│       ├── SKILL.md
│       └── scripts/
│           ├── compose_image.py       ← 排版叠字（备用）
│           └── publish_wechat.py      ← 公众号草稿发布
│
└── data/                              ← 系列内容数据（大纲/图片/文案，与子技能分离）
    ├── 参考图片/                       ← 港珠澳大桥系列视觉标杆（6张，接手必看）
    ├── typhoon/                       ← 《台风图鉴》✅ 已完成示范项目
    │   ├── 00-series-outline.md       ← ⭐ 系列大纲（接手时第一个读）
    │   ├── prompts.md                 ← 6张图的完整英文 Prompt
    │   ├── images/raw/                ← 6张成图（标题/标注/页脚已渲染在图内）
    │   └── publish/                   ← 各平台文案
    │       ├── wechat.md
    │       └── caption.md
    └── <新主题>/                      ← 新系列按此结构创建
```

新增系列时，在 `data/` 下创建 `<主题拼音>/` 文件夹，先创建 `00-series-outline.md`，再按 WORKFLOW.md 流程执行。

---

## 视觉风格标准（硬约束，不可违反）

| 维度 | 规范 |
|------|------|
| 背景 | 暖羊皮纸米色 `#F0EDE6` + 亚麻质感，禁止纯白/纯黑/深色背景 |
| 标题 | 中文宋体粗体主标题 + 全大写英文副标题，**直接渲染进图片** |
| 标注 | 细线 + 白色小圆点锚点，禁止气泡框/对话框 |
| 配色 | 深海蓝、地质棕、自然绿、矿物灰、冰川蓝，禁止荧光色 |
| 画风 | 写实3D CGI科学图解（DK百科/博物图鉴美学），禁止扁平卡通/实景摄影 |
| 页脚 | `— MT图解百科 · 第X页 / 共N页 —`，无品牌水印/logo |
| 比例 | 3:4 竖版，尺寸 1024×1365 |

---

## 系列管理

| 主题 | 张数 | 状态 | 目录 |
|------|------|------|------|
| 港珠澳大桥（视觉标杆） | 6张 | ✅ 参考图 | `data/参考图片/` |
| 台风 | 6张 | ✅ 已完成 | `data/typhoon/` |
| （下一个主题） | — | 🔲 待制作 | — |

---

## 子技能编排（严格按顺序调用）

```
┌─────────────────────────────────────────────────────────────────┐
│ Step ①  kg-outline-planner                                      │
│   输入：主体名称 + 第一轮搜索（核心事实）                          │
│   输出：data/<主题>/{brief.md, outline.md, 00-series-outline.md}│
│   ⚠️ 完成后必须暂停等用户确认大纲                                  │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step ②③  kg-image-generator                                     │
│   输入：outline.md + 第二轮搜索（视觉特征）                       │
│   输出：data/<主题>/prompts.md → images/raw/*.png               │
│   关键：中文标题/标注/总结 用引号直接写进 Prompt（gpt-image-2 渲染）│
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step ④⑤  kg-publisher                                          │
│   输入：outline.md + images/raw/ + 第三轮搜索（最新数据）         │
│   输出：data/<主题>/publish/{wechat.md, caption.md} → 公众号草稿 │
│   安全：只存草稿，从不群发                                        │
└─────────────────────────────────────────────────────────────────┘
```

| 子技能 | 调用方式 | 何时用 |
|--------|---------|--------|
| **kg-outline-planner** | AI 推理（读 SKILL.md 规范） | Step ① 大纲规划 |
| **kg-image-generator** | AI 写 Prompt + 脚本批量生图 | Step ②③ Prompt + 生图 |
| **kg-publisher** | AI 写文案 + 脚本上传草稿 | Step ④⑤ 文案 + 发布 |

详细编排流程见 `START-HERE.md`。

---

## 全流程一览

```
一句话主题输入
 │
 ├─① 🔍 搜索核实（大纲前）
 │   核实结构名称、数值数据、认知误区依据
 │
 ├─② 大纲规划（kg-outline-planner）
 │   产出：data/<主题>/brief.md + data/<主题>/outline.md
 │   ⚠️ 等用户确认大纲后再进行生图
 │
 ├─③ 🔍 搜索核实（Prompt前）
 │   核实视觉特征、英文学术术语
 │
 ├─④ 生成 prompts.md（kg-image-generator）
 │
 ├─⑤ 批量生图
 │   python sub-skills/kg-image-generator/scripts/generate_kg_image.py \
 │     --prompt-file data/<主题>/prompts.md \
 │     --section 01-cover --output data/<主题>/images/raw/01-cover.png
 │   （先单张确认风格，再批量）
 │
 ├─⑥ 🔍 搜索核实（文案前）
 │   验证引用数字、最新研究结论
 │
 ├─⑦ 撰写文案（kg-publisher）
 │   产出：data/<主题>/publish/wechat.md + data/<主题>/publish/caption.md
 │
 └─⑧ 发布草稿
     python sub-skills/kg-publisher/scripts/publish_wechat.py \
       data/<主题>/publish/wechat.md
     → [OK] 草稿已保存! media_id=...
```

详细每步规范见 `GUIDE-FOR-AI.md`，完整命令参考见 `WORKFLOW.md`。

---

## 安全边界

- **只存草稿，绝不群发**（publish_wechat.py 调用 `draft/add`，无群发接口调用）
- 凭证只进 `.kg-config.json`（已被 `.gitignore` 忽略），不进 git
- AppSecret 若泄露，立即到微信公众平台后台**重置**
