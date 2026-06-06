# MT图解百科——AI 全流程操作指南

> 本文档面向**在新会话中接手此任务的 AI**，读完即可独立完成从主题到发布的完整流程。
> 人工只需在两个关键节点审核，其余全自动。

---

## 技能包概览

```
kg-tutorials/
├── SKILL.md                     ← 总入口（系列管理、风格标准）
├── SETUP.md                     ← 环境配置（凭证/依赖/初始化向导）
├── GUIDE-FOR-AI.md              ← 本文件：AI操作手册
├── WORKFLOW.md                  ← 端到端 SOP（含三轮强制搜索节点）
├── setup_config.py              ← 初始化配置向导
│
├── sub-skills/                  ← 可复用子技能（工具代码）
│   ├── kg-outline-planner/      ← 技能1：主体分类 + 大纲 + 反直觉金句
│   ├── kg-image-generator/      ← 技能2：英文Prompt生成 + 批量生图
│   └── kg-publisher/            ← 技能3：文案撰写 + 多平台发布
│
└── data/                        ← 系列内容数据（与子技能分离）
    ├── 参考图片/                  ← 视觉标杆（港珠澳大桥6张，接手必看）
    └── typhoon/                  ← 《台风图鉴》✅ 完成示范（照着学）
        ├── 00-series-outline.md
        ├── prompts.md
        ├── images/raw/
        └── publish/
```

---

## 前置：环境准备（每台新机器做一次）

```bash
cd kg-tutorials

# 1. 安装依赖
python -m pip install pillow

# 2. 运行初始化向导（填写公众号信息、生图 API Key）
python setup_config.py
```

配置保存到 `.kg-config.json`，后续脚本自动读取，无需再设环境变量。

详见 SETUP.md。

---

## AI 接手任务时的标准动作

收到"做一套关于X的MT图解百科"指令时，按顺序执行：

1. **读 `SKILL.md`** — 确认风格标准和技能清单
2. **看 `data/参考图片/` 中的6张标杆图** — 建立视觉基准
3. **参考 `data/typhoon/` 示范项目** — 了解完整产出结构
4. **执行第一步：大纲规划** — 产出 brief.md + outline.md，**等用户确认大纲**
5. **执行第二步：生成 prompts.md**
6. **执行第三步：生图** — 先单张封面确认风格，再批量
7. **执行第四步：文案撰写** — 产出 publish/wechat.md + publish/caption.md
8. **执行第五步：发布** — 运行 publish_wechat.py，确认 `[OK] 草稿已保存`
9. **报告结果** — 告知 media_id，提示登录草稿箱查看

---

## 全流程 SOP

```
用户输入主体 → 🔍搜索 → ①大纲规划 → 🔍搜索 → ②Prompt生成 → ③批量生图 → 🔍搜索 → ④文案撰写 → ⑤平台发布
```

> **搜索核实（🔍）是强制步骤，不可跳过。** 科普内容的准确性是底线。

---

## 第一步：大纲规划（kg-outline-planner）

**输入**：用户提供主体名称（如"火山"）+ 可选张数/风格偏好

**AI 执行动作**：

0. **【必须】网络搜索**：在规划大纲前，先搜索该主体的核心科学事实，重点核实：
   - 结构名称、数值数据（温度、尺度、比例等）
   - 认知颠覆点是否有科学依据
   - 标注元素的中文学术名称
   - 最新研究进展或修订结论

   将搜索结论写入 `brief.md` 的「科学参考」段落，后续阶段引用而非凭记忆创作。

1. 判断主体类型（地貌/海洋/大气/生态/天文/微观等，可多选）
2. 为每张图提炼**反直觉金句**（格式：原来X不是…，而是…）
3. 选择 4-7 个分镜模块（从 `sub-skills/kg-outline-planner/SKILL.md` 模块库中选）
4. 产出每张图的：大标题、反直觉副标题、英文副题、核心视觉描述、标注元素清单、底部总结、100字科普说明

**新主题目录约定**：在 `data/` 下创建 `<主题拼音>/`，产出文件放到该目录：

```
data/<主题>/
├── 00-series-outline.md   ← 系列大纲（接手必读）
├── brief.md               ← 系列简介与科学参考
├── outline.md             ← 分镜大纲
├── prompts.md             ← 生图 Prompt（下一步产出）
├── images/raw/            ← AI 生成的成图
└── publish/               ← 各平台文案
    ├── wechat.md
    └── caption.md
```

**人工审核点 ①**：大纲确认后再进行生图，避免方向错误浪费生图配额。

详细规范见：`sub-skills/kg-outline-planner/SKILL.md`

---

## 第二步：生成英文 Prompt（kg-image-generator）

**AI 执行动作**：

0. **【必须】网络搜索**：写 Prompt 前，搜索主体的视觉特征（颜色、形态、典型场景），确保英文描述准确且可被 AI 正确可视化。重点核查容易出错的细节，如颜色准确性、结构名称英文术语。

1. 按 outline.md 中每张图的模块类型，套用 `sub-skills/kg-image-generator/SKILL.md` 中的 Prompt 模板
2. 每张 Prompt 包含：TITLE SYSTEM（中英文标题）、ANNOTATION LABELS（中文标注）、SUMMARY（中文底部总结）、FOOTER（MT图解百科·第X页/共N页）
3. 将所有 Prompt 写入 `data/<主题>/prompts.md`，按 `## #01-cover` 格式分节

**产出文件**：`data/<主题>/prompts.md`

详细规范见：`sub-skills/kg-image-generator/SKILL.md`

---

## 第三步：批量生图（kg-image-generator）

```bash
cd kg-tutorials

# 单张测试（先确认封面风格对标参考图）
python sub-skills/kg-image-generator/scripts/generate_kg_image.py \
  --prompt-file data/<主题>/prompts.md \
  --section 01-cover \
  --output data/<主题>/images/raw/01-cover.png

# 风格确认后，批量生成剩余图片
python sub-skills/kg-image-generator/scripts/generate_kg_image.py \
  --prompt-file data/<主题>/prompts.md \
  --batch \
  --output-dir data/<主题>/images/raw/
```

> 脚本自动读取 `.kg-config.json` 中的 LLM-Link API Key，无需手动设置环境变量。
> 若需临时覆盖：`LLM_LINK_API_KEY="sk-..." python sub-skills/kg-image-generator/scripts/...`

**人工审核点 ②**：每张图生成后检查 6 项（见 `sub-skills/kg-image-generator/SKILL.md` § 质检规范）：

- [ ] 背景正确（暖羊皮纸 `#F0EDE6` + 亚麻质感）
- [ ] 中文标题/副标题清晰无乱码
- [ ] 英文副标题全大写、拼写正确
- [ ] 标注规范（细线 + 白点锚点，无气泡框）
- [ ] 底部总结 + 页脚已渲染
- [ ] 风格一致、8K质感

不通过则修改 Prompt 重试，最多 3 轮。

---

## 第四步：文案撰写（kg-publisher）

AI 生成的图片已由 gpt-image-2 **直接渲染中文标题、标注、总结和页脚**，无需再叠加文字。

撰写文案前**必须网络搜索**以下内容：
- 文章中将引用的具体数字/事件/研究是否准确
- 是否有近期重要研究修订了已有结论
- 适合目标平台读者的科普表述方式

根据 `outline.md` 中各张图的科普说明，撰写：
- `data/<主题>/publish/wechat.md` — 公众号长文（含 frontmatter）
- `data/<主题>/publish/caption.md` — 各平台文案汇总（公众号摘要/小红书/视频号口播）

详细规范见：`sub-skills/kg-publisher/SKILL.md`

---

## 第五步：多平台发布（kg-publisher）

### 公众号发布

```bash
cd kg-tutorials

python sub-skills/kg-publisher/scripts/publish_wechat.py \
  "data/<主题>/publish/wechat.md 的绝对路径"

# 成功标志：[OK] 草稿已保存! media_id=...
# 登录 mp.weixin.qq.com → 内容管理 → 草稿箱 人工审核后再推送
```

> 脚本自动读取 `.kg-config.json` 中的 WECHAT_APP_ID / WECHAT_APP_SECRET。

### 小红书发布（手动）

1. 打开 `data/<主题>/publish/caption.md`，复制小红书版文案
2. 将图片（1张封面 + N张正文图）上传到小红书创作者中心
3. 粘贴文案，调整话题标签，发布

---

## 实战避坑速查表

| 现象 | 原因 | 解法 |
|------|------|------|
| 生图 504 超时 | LLM-Link 上游高峰 | 内置重试4次，等待即可；多数第2-3次成功 |
| 生图包含乱码文字 | AI 渲染文字不稳定 | 主标题≤8字、标注≤6字，生僻字换常用字，重试 |
| 生图文字渲染成英文/拼音 | Prompt 中文引号不生效 | 用英文引号包裹中文原文，加 `render exact Chinese characters` |
| 出现气泡框/对话框标注 | 约束不够明确 | 加 `no speech bubbles, no callout boxes`，重试 |
| 背景偏白/偏深 | 背景约束未写双处 | 在 SCENE 与 STYLE DNA 同时强调 `warm parchment beige #F0EDE6` |
| 图片比例不是竖版 | size 参数问题 | 确认使用 `1024x1365`（3:4） |
| 封面顶部留白被占满 | Prompt 未说明留白需求 | 封面 Prompt 必须包含 `leave top 22% as clear sky for title` |
| 公众号 `40164 invalid ip` | IP 白名单未更新 | 以报错中的 IP 为准，加白名单等3-5分钟 |
| 批量生图中途失败 | 网络波动 | 脚本跳过已存在文件，直接重跑即可继续 |
| `.kg-config.json` 不存在 | 未运行初始化向导 | `python setup_config.py` |

---

## 系列进度追踪

| 主体 | 张数 | 状态 | 目录 |
|------|------|------|------|
| 港珠澳大桥（视觉标杆） | 6张 | ✅ 参考图 | `data/参考图片/` |
| 台风 | 6张 | ✅ 已完成 | `data/typhoon/` |
| （下一个主题） | — | 🔲 待制作 | — |

新增主题后，在此表更新进度。
