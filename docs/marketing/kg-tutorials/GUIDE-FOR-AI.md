# MT图解百科——AI 全流程操作指南

> 本文档面向**在新会话中接手此任务的 AI**，读完即可独立完成从主题到发布的完整流程。
> 人工只需在两个关键节点审核，其余全自动。

---

## 技能包概览

```
kg-tutorials/
├── README.md                    ← 技能包入口
├── SETUP.md                     ← 环境配置（凭证/依赖）
├── GUIDE-FOR-AI.md              ← 本文件：AI操作手册
├── skills/
│   ├── WORKFLOW.md              ← 端到端 SOP
│   ├── kg-outline-planner/      ← 技能1：主体分类+大纲+反直觉金句
│   ├── kg-image-generator/      ← 技能2：英文Prompt生成+批量生图
│   └── kg-publisher/            ← 技能3：排版组装+多平台发布
└── series/                      ← 成品样板（照抄结构）
```

---

## 前置：环境准备（每台新机器做一次）

```bash
# 安装依赖
python -m pip install pillow

# 设置凭证（Git Bash）
export LLM_LINK_API_KEY="sk-你的key"
export WECHAT_APP_ID="wx..."          # 仅发布时需要
export WECHAT_APP_SECRET="..."        # 仅发布时需要
```

详见 SETUP.md。

---

## 全流程 SOP

```
用户输入主体 → ①大纲规划 → ②Prompt生成 → ③批量生图 → ④排版组装 → ⑤平台发布
```

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
3. 选择 4-7 个分镜模块（从 M-OV/M-CS/M-PR/M-ME/M-SC/M-RC/M-EV/M-MI/M-TL/M-CM 中选）
4. 产出每张图的：大标题、反直觉副标题、英文副题、核心视觉描述、标注元素清单、底部总结、100字科普说明

**产出文件**：
- `series/<YYYYMMDD-slug>/brief.md` — 系列简介与决策
- `series/<YYYYMMDD-slug>/outline.md` — 分镜大纲（中文）

**人工审核点 ①**：大纲确认后再进行生图，避免方向错误浪费生图配额。

详细规范见：`skills/kg-outline-planner/SKILL.md`

---

## 第二步：生成英文 Prompt（kg-image-generator）

**AI 执行动作**：
0. **【必须】网络搜索**：写 Prompt 前，搜索主体的视觉特征（颜色、形态、典型场景），确保英文描述准确且可被 AI 正确可视化。重点核查容易出错的细节，如颜色准确性、结构名称英文术语。
1. 按 outline.md 中每张图的模块类型，套用对应 Prompt 模板
2. 每张 Prompt 包含：TITLE SYSTEM（中英文标题）、ANNOTATION LABELS（中文标注）、SUMMARY（中文底部总结）、FOOTER（[主体名]图鉴·第X页/共N页）
3. 将所有 Prompt 写入 `series/<slug>/prompts.md`，按 `## #01-cover` 格式分节

**产出文件**：`series/<YYYYMMDD-slug>/prompts.md`

详细规范见：`skills/kg-image-generator/SKILL.md`

---

## 第三步：批量生图（kg-image-generator）

```bash
cd kg-tutorials

# 单张测试（先确认封面风格对标参考图）
LLM_LINK_API_KEY="sk-..." \
python skills/kg-image-generator/scripts/generate_kg_image.py \
  --prompt-file series/<slug>/prompts.md \
  --section 01-cover \
  --output series/<slug>/images/01-cover.png

# 风格确认后，批量生成剩余图片
LLM_LINK_API_KEY="sk-..." \
python skills/kg-image-generator/scripts/generate_kg_image.py \
  --prompt-file series/<slug>/prompts.md \
  --batch \
  --output-dir series/<slug>/images/
```

**人工审核点 ②**：每张图生成后检查 4 项：
- [ ] 无乱码文字
- [ ] 顶部留白区清晰（尤其封面图）
- [ ] 主体清晰可辨
- [ ] 光影质感达到"博物馆图鉴"水准

不通过则修改 Prompt 重试，最多 3 轮。

---

## 第四步：排版组装（kg-publisher）

AI 生成的图片已由 gpt-image-2 **直接渲染中文标题、标注、总结和页脚**，无需再叠加文字。

若需生成文章文案（wechat.md / caption.md），执行前**必须网络搜索**以下内容：
- 最新科学数据和权威来源
- 是否有近期重要研究修订了已有结论
- 适合目标平台读者的科普表述方式

**工具选择**：
- 图片已含文字：直接使用 `images/raw/` 中的成图发布
- 需要额外排版调整：`skills/kg-publisher/scripts/compose_image.py`

详细规范见：`skills/kg-publisher/SKILL.md`

---

## 第五步：多平台发布（kg-publisher）

### 公众号发布

```bash
cd kg-tutorials/skills/kg-publisher/scripts

WECHAT_APP_ID="wx..." WECHAT_APP_SECRET="..." \
  python publish_wechat.py "<series/<slug>/publish/wechat.md 的绝对路径>"

# 成功标志：[OK] 草稿已保存! media_id=...
# 登录 mp.weixin.qq.com → 内容管理 → 草稿箱 人工审核后再推送
```

### 小红书发布（手动）

1. 打开 `series/<slug>/publish/caption.md`，复制小红书版文案
2. 将排版好的图片（1张封面 + N张正文图）上传到小红书创作者工具
3. 粘贴文案，调整话题标签，发布

---

## 实战避坑速查表

| 现象 | 原因 | 解法 |
|------|------|------|
| 生图 504 超时 | LLM-Link 上游高峰 | 内置重试4次，等待即可；多数第2-3次成功 |
| 生图包含乱码文字 | AI 渲染文字不稳定 | 修改 Prompt 强化 "No text" 约束，重试 |
| Cloudflare 拦截（403/1010） | 默认 Python UA 被拦 | 脚本已内置浏览器 UA，无需手动处理 |
| 图片比例不是竖版 | size 参数问题 | 确认使用 `1024x1365`（3:4） |
| 封面顶部留白被占满 | Prompt 未说明留白需求 | 封面 Prompt 必须包含 "leave top 22% clear sky" |
| 公众号 `40164 invalid ip` | IP 白名单未更新 | 以报错中的 IP 为准，加白名单等3-5分钟 |
| 标注叠加遮挡主体 | 排版位置不当 | 标注线引向图片边缘空白区，不在核心区叠字 |

---

## AI 接手任务时的标准动作

收到"做一套关于X的MT图解百科"指令时，按顺序执行：

1. **读 `README.md`** — 确认风格标准和技能清单
2. **读 `参考图片/` 中的6张标杆图** — 建立视觉基准
3. **执行第一步：大纲规划** — 产出 brief.md + outline.md，**等用户确认大纲**
4. **执行第二步：生成 prompts.md**
5. **执行第三步：生图** — 先单张封面确认风格，再批量
6. **执行第四步：排版组装** — 叠加文字层
7. **执行第五步：发布** — 运行 publish_wechat.py，确认 `[OK] 草稿已保存`
8. **报告结果** — 告知 media_id，提示登录草稿箱查看

---

## 系列进度追踪

| 主体 | 张数 | 状态 | 目录 |
|------|------|------|------|
| 港珠澳大桥（参考样板） | 6张 | ✅ 参考图 | `参考图片/` |
| （待填入） | — | 待制作 | — |
