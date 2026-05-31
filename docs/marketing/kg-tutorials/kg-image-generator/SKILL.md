---
name: kg-image-generator
description: |
  MT图解百科·生图引擎技能（v2.0 · 羊皮纸博物图鉴风）。
  输入：outline.md（分镜大纲）
  输出：
  (1) prompts.md — 每张图的完整英文 Prompt（按 ## #01-cover 分节）
  (2) 调用 gpt-image-2（via LLM-Link images/generations）批量生成成图
  核心原则：中文主标题/副标题、中文标注、底部中文总结、系列页脚，
  全部由 gpt-image-2 直接渲染进图片，无需后期排版。
  全系列统一暖羊皮纸米色背景（#F0EDE6），自然博物图鉴美学，视觉风格强一致。
type: skill
version: 2.0.0
---

# kg-image-generator · 生图引擎技能（v2.0）

## 零、版本说明（v1 → v2 的核心变化）

| 维度 | v1（旧） | v2（新，本规范） |
|------|---------|-----------------|
| 背景 | 深色/纯黑/震撼摄影 | **暖羊皮纸米色 #F0EDE6**，亚麻布质感 |
| 风格 | National Geographic 震撼摄影 | **DK 百科全书 / 自然博物图鉴 写实3D CGI图解** |
| 文字 | 图中禁止任何文字，后期叠加 | **中英文标题、标注、总结、页脚全部由AI直接渲染进图** |
| 标注 | 无（后期加） | **细线 + 白色小圆点锚点**，navy blue 中文标签，不用气泡框 |
| 配色 | 高对比戏剧色 | 深海蓝 / 地质棕 / 自然绿 / 矿物灰 / 冰川蓝，**拒绝荧光色** |
| 接口 | （误记为 chat completions） | **images/generations（已验证可用，正确接口）** |

---

## 一、风格 DNA（每张必须包含，不可违反）

### 1.1 硬约束（违反即重做）

1. **背景统一**：warm parchment beige `#F0EDE6`（暖羊皮纸米色）+ matte linen surface texture。
   禁止纯白、纯黑、深色背景，禁止震撼摄影实景背景。
2. **风格统一**：photorealistic CGI render + museum-quality scientific illustration，
   DK encyclopedia aesthetic / natural history atlas style。是**写实3D科学图解**，不是实景摄影。
3. **标题系统（AI直接渲染）**：
   - 顶部：大号中文宋体粗体主标题
   - 主标题下：中文认知颠覆副标题
   - 再下：宽字距全大写英文副标题
4. **标注系统**：细线（annotation line）+ 末端**白色小圆点锚点**（white dot anchor marker），
   navy blue 中文标签文字 `#1A2E4A`，**不使用气泡框/对话框**。
5. **底部总结（AI直接渲染）**：居中一句中文科学总结（18–34 汉字）。
6. **系列页脚（AI直接渲染）**：底部 `— MT图解百科 · 第X页 / 共N页 —`，
   subtle designed series footer only，no external watermark / no logo / no UI chrome。
7. **配色**：deep ocean blue, geological brown, moss green, mineral gray, glacier blue 自然色板，拒绝荧光色。
8. **画质与一致性**：ultra-detailed 8K textures, dramatic natural lighting,
   consistent camera language, consistent lighting direction, same visual seed。
9. **比例**：3:4 竖版（生成尺寸 1024x1365）。

### 1.2 标准 STYLE DNA 文本块（粘贴到每张 Prompt 末尾）

> 注意：gpt-image-2 **不需要** Midjourney 参数（`--ar / --v / --q / --s / --seed`），写 Prompt 时一律删除。

```
STYLE DNA:
photorealistic CGI render, museum-quality scientific illustration,
warm parchment beige background (#F0EDE6), matte linen surface texture,
DK encyclopedia aesthetic, natural history atlas style,
Chinese educational poster format, 3:4 portrait ratio,
annotation lines with small white dot anchor markers,
navy blue Chinese label text (#1A2E4A),
large Chinese Song-style bold main title at top,
wide-spaced uppercase English subtitle below,
small centered Chinese summary sentence at bottom,
subtle designed series footer only, no external watermark, no logo, no UI chrome,
deep ocean blue, geological brown, moss green, mineral gray natural palette,
ultra-detailed 8K textures, dramatic natural lighting,
consistent camera language, consistent lighting direction, same visual seed
```

---

## 二、模块库（M00–M14 + M99）

每个模块 = 一种「认知视角」，对应一种 3D 图解构图与专属关键词。
为某主题排片时，从模块库挑选并排序（见各系列 outline.md）。

| 代号 | 模块名 | 适用视角 | 专属 SCENE 关键词 |
|------|--------|----------|------------------|
| **M00** | 核心总览图 | 一图看懂主体全貌与核心结构 | `hero overview composition, the subject rendered as a centered 3D specimen, full structure visible at a glance, establishing master diagram` |
| **M01** | 结构剖面图 | 切开看内部分层 | `dramatic diagonal cutaway cross-section, sliced open exposing internal layers and zones, multiple depth levels visible simultaneously, anatomical scientific diagram` |
| **M02** | 微观放大图 | 放大到肉眼看不见的尺度 | `extreme macro magnification, electron-microscope-inspired CGI detail, micro-scale ultrastructure revealed, magnified inset detail circle` |
| **M03** | 内部机制图 | 看不见的力/能量如何运作 | `mechanism flow visualization, invisible forces and energy pathways made visible as clean directional arrows and flow lines, cause-and-effect diagram` |
| **M04** | 尺度对比图 | 与熟悉事物比大小 | `scale comparison layout, human silhouette and familiar reference objects beside the subject, relative size dramatically emphasized` |
| **M05** | 分类谱系图 | 同类有哪些种类/分支 | `taxonomic chart layout, multiple specimen variants arranged in a clean comparative grid, categorical family tree` |
| **M06** | 阶段演化图 | 分步骤/分阶段长成 | `sequential stage progression arranged vertically or in an arc, multiple chronological phases in one composition, numbered evolution steps` |
| **M07** | 数据记录图 | 极值/纪录/排行 | `record-breaking comparison, ranked specimens at consistent scale, data-atlas layout conveying extremes` |
| **M08** | 人类关系图 | 与人类/社会的关系 | `subject-and-human-relationship scene, how it affects people and society, contextual human-scale diagram` |
| **M09** | 时间线图 | 历史演变长河 | `historical timeline visualization, multiple eras along a horizontal/vertical timeline ribbon, before-and-after transformation` |
| **M10** | 空间分布图 | 在哪里/分布范围 | `distribution map visualization, geographic spread on a stylized relief surface, range zones and hotspots marked` |
| **M11** | 对比分析图 | A vs B 两两对照 | `side-by-side comparison, two subjects at matched scale, paired contrast diagram with aligned reference lines` |
| **M12** | 极端动态图 | 最剧烈/最危险的瞬间 | `dynamic extreme-moment visualization, the most violent or critical instant captured as a controlled scientific cutaway, force vectors annotated` |
| **M13** | 系统循环图 | 在更大系统中的循环角色 | `system cycle diagram, the subject as one node in a larger circular flow, inputs and outputs as looping arrows across the whole system` |
| **M14** | 误区澄清图 | 破除常见错误认知 | `myth-vs-truth split composition, common misconception on one side and the corrected science on the other, correction diagram` |
| **M99** | 系列收尾图 | 总结升华/呼应封面 | `closing summary composition, key takeaways condensed into one elegant recap specimen, echoes the cover layout` |

> 排片建议（大气/天气类）：`M00 → M03(机制) → M01(剖面) → M06(阶段演化) → M12(极端动态) → M08(人类关系)`。

---

## 三、单张 Prompt 结构模板

每张严格按以下结构填写，英文词汇量 150–300 词。
中文主标题/副标题/标注/总结/页脚**用引号直接写进 Prompt**，AI 会渲染进图片。

```
[Image X/N] [中文模块名] — [主体名]

SCENE:
[3D visual perspective] of [主体英文名],
photorealistic CGI scientific visualization,
[isometric / diagonal cutaway / aerial view / cross-section / ...],
designed as a premium natural science infographic poster.

TITLE SYSTEM:
- Main title (Chinese): "[中文主标题]"
- Subtitle (Chinese): "[认知颠覆副标题]"
- English label: "[UPPERCASE ENGLISH TITLE]"

VISUAL CONTENT:
- [Core visual element 1, 20-40 English words]
- [Core visual element 2, 20-40 English words]
- [Core visual element 3, 20-40 English words]
- [Core visual element 4, 20-40 English words]

ANNOTATION LABELS (Chinese, thin lines with small white dot anchors):
[中文标注1], [中文标注2], [中文标注3], [中文标注4], [中文标注5], [中文标注6]

SPECIAL EFFECTS:
[Subject-specific effects]

LIGHTING:
[Lighting direction and mood, consistent with the whole series.]

SUMMARY (Chinese, centered at bottom):
"[核心科学结论，18-34汉字]"

FOOTER:
"— [主体名称]图鉴 · 第X页 / 共N页 —"

STYLE DNA:
（粘贴 1.2 的标准 STYLE DNA 文本块）
```

### 3.1 关于「文字直接渲染」的注意事项

- gpt-image-2 支持在图内渲染中文，但**字数越少越准**：
  主标题 ≤ 8 字、副标题一句、英文副标题全大写、标注每条 ≤ 6 字、总结 18–34 字。
- 引号内文字要**逐字写对**，AI 基本按字面渲染；含生僻字时优先换常用同义词。
- 标注用「细线 + 白点锚点」描述，明确 `no speech bubbles, no callout boxes`。

---

## 四、prompts.md 输出格式

脚本按 `## #<slug>` 分节、读取 `- 尺寸：` 与缩进在 `- 完整Prompt：` 下的正文，
因此格式必须严格如下（Prompt 正文整体缩进 2 空格）：

```markdown
# 图像Prompt记录 · {主体名称}（共N张）

## #01-cover（{大标题} · 核心总览图）
- 模块：M00
- 尺寸：1024x1365（3:4）
- 完整Prompt：
  [Image 1/N] 核心总览图 — {主体名}

  SCENE:
  ...

  STYLE DNA:
  ...

## #02-{slug}（{大标题} · {模块名}）
- 模块：{模块代号}
- 尺寸：1024x1365
- 完整Prompt：
  ...
```

---

## 五、批量生图执行

### 5.1 调用接口（已验证：images/generations 正确，chat/completions 不对）

通过 LLM-Link **images/generations** 接口调用 gpt-image-2：

```python
# 核心调用（详见 scripts/generate_kg_image.py）
POST {base}/v1/images/generations
payload = {
    "model": "gpt-image-2",
    "prompt": prompt,
    "n": 1,
    "size": "1024x1365",
    "response_format": "url",
}
# 返回：data[0].url —— 解析后立即下载（临时URL会过期）
```

### 5.2 脚本用法

```bash
# 单张（先测封面，确认羊皮纸风格与文字渲染再批量）
LLM_LINK_API_KEY="sk-..." \
python skills/kg-image-generator/scripts/generate_kg_image.py \
  --prompt-file series/<slug>/prompts.md \
  --section 01-cover \
  --output series/<slug>/images/01-cover.png

# 批量（自动跳过已存在文件，可中断续跑）
LLM_LINK_API_KEY="sk-..." \
python skills/kg-image-generator/scripts/generate_kg_image.py \
  --prompt-file series/<slug>/prompts.md \
  --batch \
  --output-dir series/<slug>/images/
```

环境变量：`LLM_LINK_BASE_URL`（默认 `https://www.llm-link.top`）、`LLM_LINK_MODEL`（默认 `gpt-image-2`）。

### 5.3 质检规范（每张必检 6 项）

- [ ] **背景正确**：暖羊皮纸米色 `#F0EDE6` + 亚麻质感，无纯白/纯黑/实景背景
- [ ] **中文标题正确渲染**：主标题/副标题文字清晰、无错字、无乱码
- [ ] **英文副标题**：全大写、宽字距、拼写正确
- [ ] **标注规范**：细线 + 白色小圆点锚点，navy 中文标签，无气泡框
- [ ] **底部总结 + 页脚**：中文总结句与 `— MT图解百科 · 第X页 / 共N页 —` 均已渲染且正确
- [ ] **风格一致 + 画质**：写实3D CGI图解、自然色板、8K质感，与同系列其他图风格统一

不通过则修改 Prompt 重试，最多 3 轮；3 轮仍不通过则记录原因，留待手动补救。

---

## 六、踩坑记录

| 坑 | 解法（已在脚本中处理） |
|----|---------------------|
| **接口选型**：images/generations 是**正确**接口；chat/completions 路径不对/不返回图 | 固定用 `/v1/images/generations` |
| 中文标题渲染出错字/乱码 | 控制字数（主标题≤8字、标注≤6字），生僻字换常用字，重试 |
| 文字被渲染成英文/拼音 | Prompt 中用引号包裹中文原文，并显式声明 `render exact Chinese characters` |
| 出现气泡框/对话框标注 | 显式加 `no speech bubbles, no callout boxes`，强调 thin line + white dot anchor |
| 背景偏白/偏深 | 在 SCENE 与 STYLE DNA 同时强调 `warm parchment beige #F0EDE6` |
| Python 默认 UA 被 Cloudflare 拦 | 脚本内置浏览器 UA |
| 系统代理导致 RemoteDisconnected | 脚本用空 ProxyHandler 直连 |
| 临时 URL 短时间失效 | 生成后立即下载到本地 |
| 偶发 5xx/超时 | 内置 4 次重试，间隔 6 秒，timeout 180s |
| 图片比例偏差 | size 固定 `1024x1365`（3:4） |
| 误写 Midjourney 参数 | gpt-image-2 删除 `--ar/--v/--q/--s/--seed` |
