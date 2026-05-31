# 图片提示词记录

> 文章：第01篇 不会写代码,也能做出自己的程序吗?
> 视觉风格：彩色卡通漫画风(对标公众号《风声的AI编程》),手绘质感、Q萌小人、温暖幽默

---

## #cover：封面图

- 类型：AI生成（gpt-image-2）
- 用途：公众号封面 + 文章顶图
- 尺寸：1536x1024
- 标题文字：右侧留白区后期叠加,不让 AI 写中文
- 完整提示词：

```
彩色卡通漫画插画风格,横版构图,手绘质感,温暖友好,像绘本/漫画。

主题：一个普通人轻松地用 AI 做出自己的程序,氛围愉快幽默。

画面构成：
- 左侧：一个 Q 萌的卡通小人,坐在笔记本电脑前,表情轻松开心,身体放松地靠着椅背,手捧一杯咖啡
- 中间：一个憨态可掬的卡通 AI 机器人(圆润可爱,不要冷硬),正热心地帮小人敲键盘/指着屏幕,屏幕上是抽象的代码符号和一个小火箭
- 周围飘着手绘感的小装饰:对话气泡、灯泡、齿轮、星星
- 右侧 1/4 区域：留白或浅暖色背景,用于后期叠加文字标题

视觉焦点：卡通小人 + AI 机器人的互动,要有"搭档协作"的温暖感和幽默感

配色方案：
- 暖色调为主,明快活泼
- 橙色 #ff6b35 作为强调色(机器人配件、火箭、装饰)
- 深蓝 #1a3a5c 作为辅助
- 柔和不刺眼

风格要求：
- 手绘卡通漫画质感,线条有手绘味(不要硬边矢量图标)
- 人物和机器人都 Q 萌、有表情、有动作
- 温暖、有人情味、略带幽默,像一幅有故事的漫画

不要出现：
- 任何中文或英文文字
- 真实照片级人脸
- 冷硬的扁平矢量图标风
- 3D 渲染、赛博朋克、霓虹光效

输出：PNG,高清。
```

---

## #concept：AI 边界说明图（概念图）

- 类型：AI生成（gpt-image-2）
- 用途：插在"AI 的边界"那节,直观对比 AI 擅长 vs 会犯错
- 尺寸：1024x1024
- 完整提示词：

```
彩色卡通漫画信息图,手绘质感,像老师在白纸上画图讲解,左右对比布局。

要表达的核心观点：给 AI 清晰的指令它就干得又快又好;给模糊指令它就会乱来出错。

画面布局：中间一条手绘虚线分隔,分成左右两半。

左半边(标一个手绘的绿色对勾):
- 一个卡通小人开心地递出一张写满整齐清单的纸(清单用线条示意,不写字)
- 旁边憨萌的 AI 机器人接过清单,身后是一个整整齐齐、闪着光的成品(像搭好的积木房子)
- 机器人表情自信满意

右半边(标一个手绘的红色叉):
- 一个卡通小人一脸茫然,头顶冒出乱糟糟的问号泡泡,递出的纸上全是乱涂乱画
- 旁边 AI 机器人一脸懵,身后是一堆歪歪扭扭、塌掉的成品(积木倒了)
- 机器人头顶冒汗

风格要求：
- 手绘卡通漫画质感,温暖活泼,有幽默感
- 人物和机器人都有夸张可爱的表情
- 用手绘箭头、对话气泡点缀

配色：
- 暖色调为主
- 成功侧点缀绿色,失败侧点缀橙红 #ff6b35
- 深蓝 #1a3a5c 辅助

不要：
- 任何中文或英文文字
- 冷硬扁平矢量、3D 效果
- 真实照片人脸

输出：PNG,高清。
```

---

## 生成命令

```bash
export LLM_LINK_API_KEY="sk-..."
cd /d/my-project/new-api/docs/marketing/tutorials/articles/20260529-what-is-ai-coding

LLM_LINK_BASE_URL="https://www.llm-link.top" LLM_LINK_MODEL="gpt-image-2" \
python /c/Users/Administrator/.openclaw/workspace/skills/article-writing-pipeline/scripts/generate_image.py \
  --prompt-file images/prompts.md --section cover --output images/01-cover.png --size 1536x1024

LLM_LINK_BASE_URL="https://www.llm-link.top" LLM_LINK_MODEL="gpt-image-2" \
python /c/Users/Administrator/.openclaw/workspace/skills/article-writing-pipeline/scripts/generate_image.py \
  --prompt-file images/prompts.md --section concept --output images/03-concept.png --size 1024x1024
```

## 审核 checklist

- [ ] 是卡通漫画风,不是冷硬扁平矢量
- [ ] 人物/机器人有表情有动作,生动有趣
- [ ] 配色暖、和谐,橙色点缀到位
- [ ] 没有中英文乱码
- [ ] 封面右侧留出标题区
