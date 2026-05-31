# MT图解百科 · 技能包

> 将任意自然科学主题拆解为「博物馆图鉴风」多张3D科普图解系列，支持公众号/小红书/视频号多平台发布。

---

## 安装 / 环境配置

详见 `SETUP.md`。核心依赖：

```bash
python -m pip install pillow python-docx requests
export LLM_LINK_API_KEY="sk-..."      # 生图必须
export WECHAT_APP_ID="wx..."          # 仅发布公众号时需要
export WECHAT_APP_SECRET="..."        # 仅发布公众号时需要
```

---

## 目录结构

```
kg-tutorials/                          ← 技能包根目录
├── SKILL.md                           ← 本文件：总入口
├── GUIDE-FOR-AI.md                    ← AI操作指南（接手任务必读）
├── SETUP.md                           ← 环境配置
├── WORKFLOW.md                        ← 端到端SOP（含三轮搜索节点）
│
├── kg-outline-planner/                ← 技能1：主题分析 + 大纲生成
│   └── SKILL.md
├── kg-image-generator/                ← 技能2：英文Prompt生成 + 批量生图
│   ├── SKILL.md
│   └── scripts/generate_kg_image.py
├── kg-publisher/                      ← 技能3：排版组装 + 多平台发布
│   ├── SKILL.md
│   └── scripts/
│       ├── compose_image.py           ← 排版叠字（备用，gpt-image-2已内嵌渲染）
│       └── publish_wechat.py          ← 公众号草稿发布
│
├── 参考图片/                           ← 港珠澳大桥系列视觉标杆（6张）
│
└── typhoon/                           ← 《台风图鉴》✅ 已完成
    ├── 00-series-outline.md           ← ⭐ 系列大纲（每次接手必读）
    ├── prompts.md
    ├── images/raw/                    ← 6张成图
    └── publish/                       ← 各平台文案
```

---

## 视觉风格标准

| 维度 | 规范 |
|------|------|
| 背景 | 暖羊皮纸米色 `#F0EDE6`，禁止纯白/纯黑/深色背景 |
| 标题 | 中文宋体粗体主标题 + 全大写英文副标题，**直接渲染进图片** |
| 标注 | 细线 + 白色小圆点锚点，禁止气泡框 |
| 配色 | 深海蓝、地质棕、自然绿、矿物灰，禁止荧光色 |
| 画风 | 写实3D CGI科学图解，禁止扁平卡通 |
| 页脚 | `— [主题]图鉴 · 第X页 / 共N页 —`，不写作者/品牌名 |
| 比例 | 3:4 竖版，尺寸 1024×1365 |

---

## 系列管理

| 主题 | 张数 | 状态 | 目录 |
|------|------|------|------|
| 港珠澳大桥（视觉标杆） | 6张 | ✅ 参考图 | `参考图片/` |
| 台风 | 6张 | ✅ 已完成 | `typhoon/` |
| （下一个主题） | — | 🔲 待制作 | — |

新增主题时，在根目录创建 `<主题拼音>/` 文件夹，首先创建 `00-series-outline.md`。

---

## 快速开始（新主题）

```bash
cd kg-tutorials

# 1. 创建主题目录
mkdir -p volcano && cd volcano

# 2. AI 执行：搜索 → 大纲 → prompts.md（见 GUIDE-FOR-AI.md）

# 3. 生图
LLM_LINK_API_KEY="sk-..." \
python ../kg-image-generator/scripts/generate_kg_image.py \
  --prompt-file prompts.md \
  --section 01-cover \
  --output images/raw/01-cover.png

# 4. 确认封面风格后批量
LLM_LINK_API_KEY="sk-..." \
python ../kg-image-generator/scripts/generate_kg_image.py \
  --prompt-file prompts.md \
  --batch \
  --output-dir images/raw/
```
