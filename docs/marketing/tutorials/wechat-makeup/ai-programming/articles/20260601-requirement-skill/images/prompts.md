# 图片提示词记录

> 文章：第02篇 你的想法值多少钱——需求描述才是核心能力
> 视觉风格：彩色卡通漫画风(对标《风声的AI编程》),手绘质感、Q萌小人、温暖幽默

---

## #cover：封面图

- 类型：AI生成（gpt-image-2）
- 用途：公众号封面 + 文章顶图
- 尺寸：1536x1024
- 完整提示词：

```
彩色卡通漫画插画风格,横版构图,手绘质感,温暖友好,像绘本/漫画。

主题：一个模糊的想法经过"翻译"变成清晰指令,表达"把想法说清楚"。

画面构成：
- 左侧：一个 Q 萌卡通小人,挠着头,脑袋上方冒出一个乱糟糟的思绪云朵(里面是缠成一团的线、问号),一脸"我也说不清"的表情
- 中间：一个憨态可掬的卡通 AI 机器人,手里拿着一个漏斗,把乱糟糟的想法接住、过滤
- 右侧偏中：漏斗下方流出一张整整齐齐的清单卡片(用线条示意条目,不写字),旁边小人和机器人都露出"懂了!"的开心表情
- 最右侧 1/4：留白浅暖色背景,用于叠加文字标题

视觉焦点：从"混乱想法"到"清晰清单"的转换过程,要有恍然大悟的幽默感

配色方案：
- 暖色调为主,明快活泼
- 橙色 #ff6b35 作强调色(漏斗、清单高亮)
- 深蓝 #1a3a5c 辅助

风格要求：
- 手绘卡通漫画质感,线条有手绘味(不要硬边矢量)
- 人物和机器人 Q 萌、有表情、有动作
- 温暖、有人情味、略带幽默

不要出现：
- 任何中文或英文文字
- 真实照片级人脸
- 冷硬扁平矢量图标风
- 3D 渲染、霓虹光效

输出：PNG,高清。
```

---

## 生成命令

```bash
export LLM_LINK_API_KEY="sk-..."
cd /d/my-project/new-api/docs/marketing/tutorials/articles/20260601-requirement-skill

LLM_LINK_BASE_URL="https://www.llm-link.top" LLM_LINK_MODEL="gpt-image-2" \
python /c/Users/Administrator/.openclaw/workspace/skills/article-writing-pipeline/scripts/generate_image.py \
  --prompt-file images/prompts.md --section cover \
  --output images/01-cover.png --size 1536x1024
```

## 其他图

- IMAGE:02 四步框架 Mermaid 流程图,直接嵌入,公众号发布前用 mermaid.live 转 PNG
- 03-demo-bookkeeping.png 记账工具运行成果图,已用 CloakBrowser 截取终端样式页面生成
