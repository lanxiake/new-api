---
name: kg-publisher
description: |
  MT图解百科·多平台发布技能（v2.0）。
  输入：gpt-image-2 生成的系列图片（标题/标注/总结/页脚已内嵌渲染）+ outline.md（文案来源）
  输出：
  (1) publish/wechat.md — 公众号发布用 markdown（含 frontmatter）
  (2) publish/caption.md — 各平台文案汇总（公众号摘要/小红书/视频号口播稿）
  并通过 scripts/publish_wechat.py 将草稿推送到公众号草稿箱。
type: skill
version: 2.0.0
---

# kg-publisher · 多平台发布技能（v2.0）

## 一、图片说明（v2.0 变化）

v2.0 起，gpt-image-2 已**直接将中文标题、中文标注、底部总结、系列页脚全部渲染进图片**，无需后期叠加文字层。

`images/raw/` 中的图即为最终成品图，可直接用于发布。

`compose_image.py` 仅作为备用手动排版工具，正常流程不需要调用。

---

## 二、发布文件格式

### 2.1 wechat.md（公众号版）

```markdown
---
title: 【MT图解百科】{主体名称}——{系列副标题}
author: MT图解百科
summary: {≤120字摘要，含本系列N张图覆盖的核心知识点，让读者决定是否点开}
cover: images/01-cover.png
series: MT图解百科
---

{科普正文，每张图对应一段100-200字说明，口语化语气}

![{第1张标题}](images/01-cover.png)

{第1张科普说明，来自 outline.md 的"科普说明"字段}

![{第2张标题}](images/02-xxx.png)

{第2张科普说明}

...（以此类推）

---

💡 **本期MT图解百科，你学到了什么？评论告诉我👇**

> 下期预告：{下一个主体预告}
```

### 2.2 xhs.md（小红书版）

```markdown
{emoji} 原来{主体}这么厉害！

{本期最强反直觉金句，1句话}

📌 【MT图解百科 · {主体}】
共{N}张图，带你看懂：
✅ {要点1}
✅ {要点2}
✅ {要点3}

💡 {核心结论，1句话}

你之前了解过{主体}吗？评论告诉我👇

#{主体名}知识 #{主体分类}科普 #MT图解百科 #自然科学 #博物馆风格 #科普图解 #长知识了
```

### 2.3 caption.md（文案汇总）

```markdown
# 发布文案汇总 · {主体名称}

## 公众号标题
【MT图解百科】{主体}——{副标题}

## 公众号摘要（≤120字）
{摘要}

## 小红书文案
{完整文案}

## 视频号字幕（15-30秒口播稿）
【0-3s】{主体名}，你真的了解吗？
【3-10s】原来{反直觉金句}！
【10-25s】今天{N}张图，带你彻底看懂：{要点1}，{要点2}，{要点3}。
【25-30s】关注MT图解百科，每期一个自然奥秘。
```

---

## 三、公众号发布脚本

```bash
cd kg-tutorials

# Git Bash / macOS / Linux（脚本自动读取 .kg-config.json）
python sub-skills/kg-publisher/scripts/publish_wechat.py \
  "data/<主题>/publish/wechat.md 的绝对路径"

# Windows PowerShell
python sub-skills/kg-publisher/scripts/publish_wechat.py \
  "E:\...\data\<主题>\publish\wechat.md"
```

> 脚本自动读取 `.kg-config.json` 中的 WECHAT_APP_ID / WECHAT_APP_SECRET，无需手动 export。
> 需要临时覆盖：`WECHAT_APP_ID="wx..." WECHAT_APP_SECRET="..." python sub-skills/kg-publisher/scripts/...`

**成功标志**：
```
[OK] 草稿已保存! media_id=dGPp3Khw-...
登录 mp.weixin.qq.com → 内容管理 → 草稿箱 人工审核后推送
```

脚本只存草稿，**不自动群发**，人工在后台审核后再推送。

---

## 四、小红书发布（手动）

1. 打开 `publish/caption.md`，复制小红书文案
2. 打开小红书创作者中心
3. 上传图片：封面图（1张）+ 正文图（N-1张），按顺序
4. 粘贴文案，调整话题标签
5. 设置发布时间（建议早8-9点或晚8-10点）

---

## 五、质量自检（发布前）

- [ ] 每张图已质检（标题/标注/总结/页脚清晰无乱码，风格统一）
- [ ] 文案数据与 brief.md「科学参考」段落一致
- [ ] 公众号文案摘要 ≤120字
- [ ] caption.md 小红书文案含5个以上话题标签
- [ ] 封面图为第1张（01-cover.png），尺寸适合公众号
