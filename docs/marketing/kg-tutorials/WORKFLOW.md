# MT图解百科 · 端到端工作流 SOP

> 从「一句话主体」到「多平台发布就绪的系列科普图」的完整可复现流程。
> 每步给出实际命令，新环境照做即可。配合 `SETUP.md`（环境）和各 `SKILL.md`（技能规范）使用。

---

## 全景流程

```
主体输入 → 🔍搜索核实 → ①大纲规划 → 🔍搜索核实 → ②Prompt生成 → ③批量生图 → 🔍搜索核实 → ④文案撰写 → ⑤平台发布
```

> **搜索核实（🔍）是强制步骤，不可跳过。** 科普内容的准确性是底线，三个阶段的搜索目标各不相同（见下文）。

---

## 目录约定

每个主体建立一个工作目录：`series/YYYYMMDD-主体-slug/`

```
series/20260531-volcano/
├── brief.md          # 系列简介：主体分类、张数、风格、反直觉金句清单
├── outline.md        # 分镜大纲：每张图的标题/副标题/标注/总结/科普说明
├── prompts.md        # 每张图的英文生图 Prompt（按 ## #01-cover 分节）
├── images/
│   ├── raw/          # AI 生成的原始底图（无文字）
│   ├── 01-cover.png  # 排版完成的最终图
│   ├── 02-xxx.png
│   └── ...
└── publish/
    ├── wechat.md     # 公众号发布用 markdown（含 frontmatter）
    ├── xhs.md        # 小红书文案 + 话题标签
    └── caption.md    # 各平台文案汇总
```

---

## ① 大纲规划

### 🔍 第一轮搜索（大纲前）

在规划大纲前，先搜索以下内容并将结论记录在 `brief.md` 的「科学参考」段落：

```
搜索目标：
- [主体] 核心结构组成（中英文术语）
- [主体] 数值数据（温度/尺度/频率/比例等关键数字）
- [主体] 常见认知误区（为反直觉金句提供依据）
- [主体] 与人类/环境的关系（最新研究结论）
```

调用 `skills/kg-outline-planner/SKILL.md` 规范。

**产出命令**（AI 执行，无需脚本）：
1. 判断主体类型 → 选择分镜模块组合（4-7张）
2. 为每张图写反直觉金句（必须有搜索依据，不凭记忆编造）
3. 产出 `brief.md`（含「科学参考」段落）+ `outline.md`

**人工确认后再进行生图**（避免方向错误浪费配额）。

---

## ② 生成英文 Prompt

### 🔍 第二轮搜索（Prompt前）

写英文 Prompt 前，搜索主体的视觉特征，确保描述准确：

```
搜索目标：
- [主体] 外观/颜色/形态（权威图鉴或科学图库中的描述）
- [主体] 各结构的英文学术名称（避免用俗称导致AI误解）
- [主体] 典型场景的参照（卫星图、剖面图、显微图等）
```

调用 `skills/kg-image-generator/SKILL.md` 中的 Prompt 模板规范。

**产出文件**：`series/<slug>/prompts.md`，格式示例：

```markdown
## #01-cover（封面/总览图）
- 模块：M-OV
- 尺寸：1024x1365
- 完整Prompt：
  Photorealistic 3D scientific illustration...（英文，100-200词）
```

---

## ③ 批量生图

```bash
cd kg-tutorials

# 单张测试（先确认封面风格）
LLM_LINK_API_KEY="sk-..." \
python skills/kg-image-generator/scripts/generate_kg_image.py \
  --prompt-file series/<slug>/prompts.md \
  --section 01-cover \
  --output series/<slug>/images/raw/01-cover.png

# 封面通过后，批量生成所有图
LLM_LINK_API_KEY="sk-..." \
python skills/kg-image-generator/scripts/generate_kg_image.py \
  --prompt-file series/<slug>/prompts.md \
  --batch \
  --output-dir series/<slug>/images/raw/
```

生成后逐张检查（详见 `skills/kg-image-generator/SKILL.md` § 质检规范）。

---

## ④ 文案撰写

### 🔍 第三轮搜索（文案前）

写公众号正文和小红书文案前，搜索验证：

```
搜索目标：
- 文章中将引用的具体数字/事件/研究是否准确
- 是否有近期（近1-2年）重要研究修订了已有结论
- 权威表述方式（避免科学上不严谨的民间说法）
```

根据 `outline.md` 中各张图的科普说明，撰写：
- `publish/wechat.md` — 公众号长文（含 frontmatter）
- `publish/caption.md` — 各平台文案汇总（公众号摘要/小红书/视频号口播）

---

## ⑤ 平台发布

### 公众号草稿发布

```bash
cd kg-tutorials

WECHAT_APP_ID="wx..." WECHAT_APP_SECRET="..." \
  python skills/kg-publisher/scripts/publish_wechat.py \
  series/<slug>/publish/wechat.md

# 成功：[OK] 草稿已保存! media_id=...
# 登录 mp.weixin.qq.com → 内容管理 → 草稿箱 人工审核后推送
```

### 小红书（手动发布）

文案在 `series/<slug>/publish/xhs.md`，图片从 `images/` 目录上传。

---

## 实战避坑总表

| 现象 | 原因 / 解法 |
|------|-----------|
| 生图 504 超时 | chat completions 接口偶发，内置4次重试，通常第2-3次成功 |
| 生图包含乱码文字 | Prompt 末尾加 "No text, no labels"，仍出现则重试 |
| Cloudflare 403/1010 | 脚本已内置浏览器 UA，若仍出现检查 API Base URL |
| 图片不是竖版 | size 参数必须用 `1024x1365`（3:4），不用正方形 |
| 封面顶部留白不足 | Prompt 中封面图必须含 "leave top 22% as clear sky for title" |
| 公众号 40164 invalid ip | 以报错中的 IP 加白名单，等3-5分钟 |
| 批量生图中途失败 | 脚本已跳过已存在文件，直接重跑即可继续 |

---

## 已有样板

`参考图片/` 目录下 6 张港珠澳大桥系列图是本套流程的视觉标杆，`series/` 下的完整成品是产出流程的活样板。新制作主体时，照着任一成品的 `brief.md + outline.md + prompts.md` 结构复制即可。
