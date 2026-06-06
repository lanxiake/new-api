# 🚀 START HERE — AI 接手任务的一站式入口

> 这是 kg-tutorials 技能包的**单文件入口**。读完这一份就能从零做完一个图解系列。
> 不需要跳读其他文档，除非遇到具体问题才查 `WORKFLOW.md` / `子技能 SKILL.md`。

---

## 0. 30 秒看懂技能包

**做什么**：把任意主体（自然现象/工程系统/科技产品）拆成 6 张「博物图鉴风」3D 科普图，发布到公众号草稿。

**怎么做**：
```
主体输入 → 🔍搜索 → 大纲 → 🔍搜索 → 英文 Prompt → 生图(gpt-image-2) → 🔍搜索 → 文案 → 公众号草稿
```

**三个子技能**（各管一段，必须按顺序调用）：
| 子技能 | 输入 | 输出 | 何时用 |
|--------|------|------|--------|
| `sub-skills/kg-outline-planner/` | 主体名称 | `brief.md` + `outline.md` | 第①步：大纲规划 |
| `sub-skills/kg-image-generator/` | `outline.md` | `prompts.md` + `images/raw/*.png` | 第②③步：Prompt 生成 + 生图 |
| `sub-skills/kg-publisher/` | `outline.md` + `images/raw/` | `publish/wechat.md` + 微信草稿 | 第④⑤步：文案 + 发布 |

**所有产出文件路径都在**：`data/<主题拼音>/`

---

## 1. 环境自检（首次或异常时跑一次）

```bash
cd kg-tutorials

# 一键自检：依赖 + 配置 + API 连通性
python doctor.py
```

`doctor.py` 会自动：
- 检查 Python 依赖（pillow）
- 检查 `.kg-config.json` 是否存在、各字段是否齐全
- 测试 LLM-Link API key 是否可用（发一个最便宜的探测请求）
- 测试微信公众平台 token 是否可获取

任一项失败会给出修复建议。**所有项 ✓ 才能进入正式流程。**

如果 `.kg-config.json` 不存在，先跑：
```bash
python setup_config.py
```

---

## 2. 五步流程（每一步都给出可复制的命令）

### Step ① 大纲规划（AI 推理，无脚本）

**🔍 必做：第一轮搜索**——核实主体的核心结构、数值数据、认知误区。结论写入 `brief.md` 的「科学参考」段落。

调用规范：`sub-skills/kg-outline-planner/SKILL.md`

产出三个文件（放到 `data/<主题>/`）：
- `00-series-outline.md` — 系列管理总览
- `brief.md` — 系列简介 + 科学参考（必含搜索引用源）
- `outline.md` — 6张分镜大纲（每张含：主标题、反直觉副标题、英文副题、视觉描述、6个标注、底部总结、100字科普说明）

**⚠️ 人工审核点 ①**：完成大纲后**主动暂停**，告诉用户"大纲已完成请审核"，等用户确认再继续。

---

### Step ② 生成英文 Prompt（AI 推理，无脚本）

**🔍 必做：第二轮搜索**——核实主体的视觉特征（颜色、形状、英文术语）。

调用规范：`sub-skills/kg-image-generator/SKILL.md`

按模板把每张图写成一段英文 Prompt（含 SCENE / TITLE SYSTEM / VISUAL CONTENT / ANNOTATION LABELS / SUMMARY / FOOTER / STYLE DNA），全部写入 `data/<主题>/prompts.md`。

**关键约束**（违反会导致 504 超时或乱码）：
- 中文标题、标注、总结**用引号直接写进 Prompt**，gpt-image-2 会渲染进图
- 每条标注 ≤ 6 字、主标题 ≤ 8 字、底部总结 18-34 字
- **单张 Prompt 总字符 ≤ 1500**（实测 2000+ 字符在 LLM-Link 上游 504 频发）
- **默认尺寸 `768x1024`** 3:4 竖版（缩小版，最稳）。1024x1365 超时率明显更高
- STYLE DNA 块**逐张粘贴**，确保风格统一
- 末尾**不要写** `--ar / --v / --q / --s / --seed`（那是 Midjourney 的，gpt-image-2 不认）

---

### Step ③ 批量生图（脚本自动）

```bash
# 强烈建议先单张测试封面
python sub-skills/kg-image-generator/scripts/generate_kg_image.py \
  --prompt-file data/<主题>/prompts.md \
  --section 01-cover \
  --output data/<主题>/images/raw/01-cover.png

# 封面通过后批量
python sub-skills/kg-image-generator/scripts/generate_kg_image.py \
  --prompt-file data/<主题>/prompts.md \
  --batch \
  --output-dir data/<主题>/images/raw/

# 如有失败（504 高峰期常见），等 30 秒后重试失败的
python sub-skills/kg-image-generator/scripts/generate_kg_image.py \
  --prompt-file data/<主题>/prompts.md \
  --retry-failed \
  --output-dir data/<主题>/images/raw/
```

脚本特性：
- 自动跳过已存在文件（中断可续跑）
- 自动质检文件大小（< 200KB 视为异常）
- 结束输出汇总：`success / failed / skipped / QC warnings`
- 失败列表存到 `data/<主题>/.last-failed.json`，可用 `--retry-failed` 一键重试

**⚠️ 人工审核点 ②**：每张图检查 6 项（见 `sub-skills/kg-image-generator/SKILL.md` § 质检规范）。

---

### Step ④ 文案撰写（AI 推理，无脚本）

**🔍 必做：第三轮搜索**——验证文案中的数字、研究、表述权威性。

调用规范：`sub-skills/kg-publisher/SKILL.md`

产出两个文件（放到 `data/<主题>/publish/`）：
- `wechat.md` — 公众号长文，含 frontmatter（title/author/summary/cover）
- `caption.md` — 各平台文案（公众号摘要/小红书/视频号口播稿）

**frontmatter 模板**（`cover` 用绝对路径或相对 wechat.md 的路径都可以）：
```yaml
---
title: 【MT图解百科】{主体}——{副标题}
author: {留空则用配置中的 mp_name}
summary: {≤120字摘要}
cover: ../images/raw/01-cover.png
---
```

文案要求：
- 每张图对应 100-200 字口语化说明
- 数据必须与 brief.md「科学参考」一致（不要凭记忆）
- 公众号摘要 ≤ 120 字
- 小红书文案含 ≥ 5 个话题标签

---

### Step ⑤ 发布到公众号草稿

```bash
python sub-skills/kg-publisher/scripts/publish_wechat.py \
  data/<主题>/publish/wechat.md
```

**成功标志**：`[OK] 草稿已保存! media_id=...`

脚本自动：
- 读取 `.kg-config.json` 中的微信凭证
- 上传封面与正文图片
- 把 Markdown 转 HTML
- 提交到公众号草稿箱（**不群发**）

**常见问题**：
- `40164 invalid ip`：把报错里的 IP 加到公众号 IP 白名单，等 3-5 分钟
- 找不到配置：在 `kg-tutorials/` 根目录执行命令（不是子目录）
- 图片找不到：`cover` 路径要相对 `wechat.md` 文件位置

---

## 3. 一图看懂数据目录

```
kg-tutorials/data/<主题>/
├── 00-series-outline.md   ← 系列管理总览（接手时第一个读）
├── brief.md               ← Step① 产出（科学参考必含搜索源）
├── outline.md             ← Step① 产出（6张分镜大纲）
├── prompts.md             ← Step② 产出（英文 Prompt）
├── .last-failed.json      ← 生图脚本自动维护，--retry-failed 读它
├── images/raw/            ← Step③ 产出（6张成图，标题已内嵌渲染）
│   ├── 01-xxx.png
│   └── ...
└── publish/               ← Step④ 产出
    ├── wechat.md          ← Step⑤ 输入
    └── caption.md
```

---

## 4. 接手已有系列时的快速诊断

```bash
# 查看当前进度（哪些图已生成、哪些失败、文案是否就绪）
python status.py data/<主题>/
```

会输出类似：
```
[data/j20/] J-20 隐身战斗机
  ✓ brief.md (1.2KB)
  ✓ outline.md (8.5KB)
  ✓ prompts.md (12.3KB, 6 sections)
  ✓ images/raw/: 4/6 done
    ✓ 01-overview.png (2494KB)
    ✓ 02-s-duct.png (2464KB)
    ✗ 03-stealth.png (missing)
    ✗ 04-canard.png (missing)
    ✓ 05-material.png (2855KB)
    ✓ 06-compare.png (2293KB)
  ✗ publish/wechat.md (missing)
下一步：python sub-skills/kg-image-generator/scripts/generate_kg_image.py --prompt-file data/j20/prompts.md --retry-failed --output-dir data/j20/images/raw/
```

---

## 5. 触发词速查（AI 自动判断在哪一步）

| 用户说 | 你应该 |
|--------|--------|
| "做一套关于X的图解" | 从 Step① 开始 |
| "继续" / "继续生图" | 跑 status.py 看进度，从断点继续 |
| "重试失败的" | `--retry-failed` |
| "再生成一张X" | `--section <slug>` 单张模式 |
| "发布到公众号" | Step⑤ |
| "查看进度" | `python status.py data/<主题>/` |

---

## 6. 安全红线

- ✅ 只存草稿，**绝不自动群发**
- ✅ 凭证只在 `.kg-config.json`（已 .gitignore）
- ✅ 三轮搜索是底线，**不可跳过**任何一轮，否则会出现"凭记忆编造"的科学错误
- ✅ Step① 大纲完成后**必须暂停等用户确认**

---

**遇到本文档没覆盖的问题？** 按需查：
- 完整 SOP 命令参考：`WORKFLOW.md`
- 子技能详细规范：`sub-skills/*/SKILL.md`
- 环境配置：`SETUP.md`
- 已完成样板：`data/typhoon/`、`data/参考图片/`
