# 公众号文章创作与发布——AI 全流程操作指南

> 本文档面向**在新会话中接手此任务的 AI**，读完即可独立完成从选题到发布草稿的完整流程。
> 人工只需在关键节点审核，其余全自动。

---

## 技能包概览

```
docs/marketing/tutorials/
└── wechat-makeup/                       ← 技能包根目录（本目录）
    ├── SKILL.md                         ← 技能总入口（安装/结构/系列管理）
    ├── GUIDE-FOR-AI.md                  ← 本文档：AI操作指南
    ├── SETUP.md / WORKFLOW.md           ← 环境配置 / 端到端SOP
    ├── article-writing-pipeline/SKILL.md
    ├── cloakbrowser-scraper/SKILL.md + scripts/
    ├── wechat-publisher/SKILL.md + scripts/publish.py
    ├── ai-programming/                  ← 《人人都能用AI写程序》✅ 已完结
    │   ├── 00-series-outline.md         ← ⭐ 系列大纲（每次接手必读）
    │   ├── samples/
    │   └── articles/
    └── parenting-with-ai/               ← 《教育是一场对自己的救赎》🚧 进行中
        ├── 00-series-outline.md         ← ⭐ 系列大纲
        ├── samples/
        └── articles/
```

**AI 接手任务时，用户会告知当前系列**（如 `wechat-makeup/parenting-with-ai/`），先读该系列的 `00-series-outline.md`，再按本文档流程执行。

---

## 前置：环境准备（每台新机器做一次）

### 1. 安装 Python 依赖

```bash
python -m pip install cloakbrowser pillow
```

cloakbrowser 首次调用会自动下载定制 Chromium（约 535MB），缓存在本地，后续无需重复下载。

### 2. 配置环境变量（三个凭证）

| 变量名 | 来源 | 用途 |
|--------|------|------|
| `WECHAT_APP_ID` | 微信公众平台 → 设置与开发 → 基本配置 | 发布草稿 |
| `WECHAT_APP_SECRET` | 同上（只显示一次，立即保存） | 发布草稿 |
| `LLM_LINK_API_KEY` | llm-link.top 个人中心 | AI生图（备用） |

**Windows PowerShell（当前会话）：**
```powershell
$env:WECHAT_APP_ID = "wx..."
$env:WECHAT_APP_SECRET = "..."
$env:LLM_LINK_API_KEY = "sk-..."
```

**Git Bash（当前会话）：**
```bash
export WECHAT_APP_ID="wx..."
export WECHAT_APP_SECRET="..."
export LLM_LINK_API_KEY="sk-..."
```

### 3. IP 白名单（每次换网络重做）

```bash
python -c "import urllib.request; print(urllib.request.urlopen('https://api64.ipify.org').read().decode())"
```

把打印的 IP 填入：微信公众平台 → 设置与开发 → 基本配置 → IP白名单。
等 3-5 分钟后生效。若发布报错 `40164`，看报错里的 IP 加白名单（以报错为准）。

---

## 全流程 SOP

```
选题 → ①研究爆款 → ②写作(8段式) → ③配图(HTML截图) → ④生成publish.md → ⑤发布草稿
```

---

## 第一步：研究同主题爆款（30分钟内）

目的：学叙事角度、标题风格、配图思路，不是照抄。

**方法一：抓取公众号文章**
```bash
cd docs/marketing/tutorials
python skills/cloakbrowser-scraper/scripts/scrape.py "<公众号文章URL>" --out-dir ref_01
# 正文在 ref_01/body.txt，元数据在 ref_01/meta.json
```

**方法二：AI 搜索（当无具体URL时）**

让 AI 用 WebSearch 搜索主题，搜索词示例（根据当前系列调整）：
- AI编程系列：`"零基础 AI 编程 公众号 爆款 前端后端"`
- 育儿系列：`"亲子沟通 育儿方法 公众号 爆款 幼儿"`

研究重点提炼：标题句式、开篇场景、核心类比、金句、图片类型。

---

## 第二步：写作——8 段式骨架（硬规范）

每篇**严格**按以下 8 段结构写，不可跳过：

| 段落 | 内容要求 |
|------|---------|
| ①开篇·共鸣 | 用读者熟悉的困境切入，"说的就是我"的感受 |
| ②本篇你能学到 | 3-4 条具体收获，设定预期 |
| ③理论·够用就好 | 必要原理，全用生活类比，篇幅 ≤ 全文 1/3 |
| ④实操·跟着做 | 可操作步骤；**必须给可直接复制的提示词** |
| ⑤成果·看得见 | 5-30 分钟能跑出可见成果，立刻给成就感 |
| ⑥避坑·真实经验 | 最易踩的坑 + 解决思路；把报错正常化 |
| ⑦本篇小结 | 3 条核心要点，可截图保存 |
| ⑧下一篇预告+互动 | 悬念引导 + 一个能引发评论的具体问题 |

**写作铁律（必须遵守）：**
- 不用"在当今这个X时代"开头，用具体数字或反常识陈述
- 每段不超过 3 句话
- 类比必须落地（"AI 像副驾"比"AI 像智能助手"好）
- 反模式优先：先展示❌错误，再给✅正确
- 删掉所有"非常""极其""十分"
- 结尾不写总结，写能引发评论的问题

**系列类比库（从当前系列的 `00-series-outline.md` 读取，保持全系列一致）：**

> 每个系列有自己的类比库，AI 接手时必须先读 `00-series-outline.md` 获取该系列的专属类比。

**产出文件：** `series/<系列名>/articles/<YYYYMMDD-slug>/final.md`

图片位置用占位注释标记（实际图片后续步骤生成）：
```markdown
<!-- IMAGE:01 type=cover -->
<!-- IMAGE:02 type=infographic path=images/02-xxx.png -->
```

**文章命名规范：**
- 文件夹：`articles/<YYYYMMDD-主题英文slug>/`
- 标题前缀：`【序号】标题`（如 `【06】看懂技术地图——...`）
- 作者：`不懂技术的技术号`

---

## 第三步：配图——HTML 截图法（主力方案）

### 为什么用 HTML 截图而不是 AI 生图？

AI 生图（gpt-image-2）通过 LLM-Link 调用，但 SSL 连接不稳定，经常报错。
带中文文字的图（信息图/架构图/对话图）也必须用 HTML 截图，AI 生成中文必乱码。

**结论：所有含文字的配图用 HTML 模板 + cloakbrowser 截图，AI 生图只用于纯插画封面（可选）。**

### HTML 模板截图命令

```bash
python docs/marketing/tutorials/wechat-makeup/cloakbrowser-scraper/scripts/screenshot.py \
  "<HTML文件路径>" \
  "<输出PNG路径>" \
  "body"           # CSS选择器，截 body 元素
  2000             # 等待渲染毫秒
  900              # 视口宽度
  500              # 视口高度
```

完整示例（文章06的封面图）：
```bash
cd docs/marketing/tutorials/skills/cloakbrowser-scraper/scripts
python screenshot.py \
  "E:/...articles/20260611-frontend-backend-db/images/cover.html" \
  "E:/...articles/20260611-frontend-backend-db/images/01-cover.png" \
  "body" 2000 900 500
```

### 每篇标准配图清单（4张）

| 编号 | 类型 | 内容 | 文件名 |
|------|------|------|--------|
| 01 | 封面 | 标题+核心要点卡片，深蓝背景，紫色强调色 | `01-cover.png` |
| 02 | 信息图 | 本篇核心原理/架构/流程，白底或深色背景 | `02-xxx.png` |
| 03 | 信息图 | 选择理由/对比/方法论，配色与02区分 | `03-xxx.png` |
| 04 | 演示图 | AI对话/实操结果/效果展示，对话或终端风格 | `04-xxx.png` |

### HTML 模板设计要点

- **封面**：`width:900px; height:500px`，深蓝渐变背景，左侧主文案，右侧卡片
- **信息图（深色）**：`width:900px`，深蓝黑背景 `#0a1628`，彩色分节
- **信息图（浅色）**：`width:900px`，浅灰背景 `#f4f6fa`，适合对比类图
- **演示图**：模拟真实界面，包含标题栏/对话气泡/结果展示

参考已有模板：`series/ai-programming/articles/20260611-*/images/*.html`

---

## 第四步：生成 publish.md（发布用文件）

publish.md 是从 final.md 派生的发布版本：
- 去掉 mermaid 代码块
- 去掉 `<!-- IMAGE:xx -->` 注释
- 把图片占位替换为实际 Markdown 图片语法
- 添加 frontmatter（标题/作者/摘要/封面）

**frontmatter 格式：**
```yaml
---
title: 【序号】完整标题
author: 不懂技术的技术号
summary: ≤120字的摘要，含主要收获，让读者决定是否值得点开
cover: images/01-cover.png
---
```

**图片引用格式（publish.md 中）：**
```markdown
![图片描述](images/02-architecture.png)
```

---

## 第五步：发布到微信草稿箱

```bash
cd docs/marketing/tutorials/skills/wechat-publisher/scripts

# Git Bash / macOS / Linux
WECHAT_APP_ID="wx..." WECHAT_APP_SECRET="..." \
  python publish.py "<publish.md 的绝对路径>"

# Windows PowerShell（先 set 环境变量，再运行）
python publish.py "E:\...\articles\20260611-...\publish.md"
```

**发布成功标志：**
```
[OK] 草稿已保存! media_id=dGPp3Khw-...
登录 mp.weixin.qq.com -> 内容管理 -> 草稿箱 查看
```

脚本自动完成：获取 access_token → 上传封面（永久素材）→ 上传正文图片 → 创建草稿。
**只存草稿，不群发**，人工在后台审核后再推送。

---

## 实战避坑速查表

| 现象 | 原因 | 解法 |
|------|------|------|
| `40164 invalid ip` | 当前 IP 不在白名单 | 用报错里的 IP 去后台加白名单，等3-5分钟 |
| cloakbrowser 截图失败/超时 | Chromium 未下载完成 | 首次运行等待自动下载完（535MB） |
| AI 生图 504 | LLM-Link 上游超时 | 重试3-5次；仍失败改用 HTML 截图 |
| AI 生图中文乱码 | gpt-image-2 中文渲染差 | 改用 HTML 模板截图，这是硬结论 |
| Windows 控制台中文乱码 | GBK 编码问题 | 脚本 stdout 只用 ASCII，文件用 utf-8 |
| publish.py 找不到图片 | 路径问题 | publish.md 和 images/ 需在同一目录；脚本从 md 文件所在目录解析图片相对路径 |
| LLM-Link 403/1010 | Cloudflare 拦截 | 请求头必须带浏览器 User-Agent |

---

## 完整示例：从零到发布（文章07的完整过程）

```
1. 建目录
   mkdir articles/20260614-claude-md/images

2. 写 final.md
   按 8 段式骨架写完整内容
   图片位置用 <!-- IMAGE:xx --> 标记

3. 制作 4 张 HTML 模板
   images/cover.html          → 封面
   images/context-memory.html → 对比图（有无CLAUDE.md）
   images/claudemd-structure.html → 结构图（写什么）
   images/claudemd-result.html    → 效果演示

4. 截图生成 PNG
   python screenshot.py cover.html          images/01-cover.png         body 2000 900 500
   python screenshot.py context-memory.html images/02-context-memory.png body 2000 900 600
   python screenshot.py claudemd-structure.html images/03-claudemd-structure.png body 2000 900 500
   python screenshot.py claudemd-result.html    images/04-claudemd-result.png    body 2000 900 500

5. 写 publish.md
   加 frontmatter（title/author/summary/cover）
   把 IMAGE 注释改成 ![描述](images/xx.png)

6. 发布
   python publish.py "E:/.../20260614-claude-md/publish.md"
   → [OK] 草稿已保存! media_id=...
```

---

## 系列进度追踪

> 进度追踪在各系列的 `00-series-outline.md` 里维护，不在本文档。
> 接手任务时读该系列的大纲确认当前篇号和状态。

---

## AI 接手任务时的标准动作

收到"继续写第X篇"或"写新文章"指令时，按顺序执行：

1. **读当前系列的 `00-series-outline.md`** — 确认该篇定位、内容方向、类比库、语言风格
2. **读当前系列的 `samples/`** — 找1篇成品照抄结构
3. **用 WebSearch 搜索同主题爆款** — 2-3个搜索词，提炼叙事角度
4. **写 final.md** — 严格 8 段式，图片用占位注释
5. **写所有 HTML 模板**（3-4个）— 参考现有模板风格保持一致
6. **批量截图** — 全部用 cloakbrowser screenshot.py
7. **写 publish.md** — frontmatter + 正文（图片注释替换为实际路径）
8. **发布** — 运行 publish.py，确认返回 `[OK] 草稿已保存`
9. **更新系列大纲进度** — 在 `00-series-outline.md` 把该篇状态改为 ✅ 已发布
