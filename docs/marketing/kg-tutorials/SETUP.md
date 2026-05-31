# 环境配置（换电脑/新会话必读）

> 首次使用请运行初始化向导，后续所有脚本自动读取配置，无需手动设环境变量。

---

## 一、快速开始（首次使用）

```bash
cd kg-tutorials

# 1. 安装依赖
python -m pip install pillow

# 2. 运行初始化向导（引导填写作者、公众号、生图配置）
python setup_config.py
```

向导完成后，配置保存到 `.kg-config.json`（已加入 .gitignore，不会提交到代码库）。

---

## 二、初始化向导说明

运行 `python setup_config.py` 后，按提示依次填写：

| 步骤 | 配置项 | 说明 |
|------|--------|------|
| 1/3 | 公众号名称 | 显示在公众号内容页，如"不懂技术的技术号" |
| 1/3 | 作者名称 | 文章署名；**留空则自动使用公众号名称** |
| 2/3 | AppID | 微信公众号 AppID（wx...） |
| 2/3 | AppSecret | 微信公众号 AppSecret |
| 3/3 | LLM-Link API Key | gpt-image-2 生图密钥（sk-...） |
| 3/3 | API Base URL | 默认 `https://www.llm-link.top`，直接回车即可 |
| 3/3 | 模型名称 | 默认 `gpt-image-2`，直接回车即可 |

配置优先级：**环境变量 > .kg-config.json**（临时覆盖仍可用环境变量）。

---

## 三、各凭证获取方式

**LLM-Link API Key：**
1. 登录 [LLM-Link 平台](https://www.llm-link.top)
2. 在「API 密钥」或「个人中心」页面创建/复制 key

**微信 AppID / AppSecret：**
1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 左侧 → 设置与开发 → 基本配置
3. AppSecret 只在重置时显示一次，**立即保存到安全位置**

---

## 四、公众号发布 IP 白名单

首次发布需把本机出口 IP 加入微信公众平台白名单：

```bash
# 查询出口 IP
python -c "import urllib.request; print(urllib.request.urlopen('https://api64.ipify.org').read().decode())"
```

将打印的 IP 填入：微信公众平台 → 设置与开发 → 基本配置 → **IP白名单**，等 3-5 分钟生效。

> 若报错 `40164 invalid ip X.X.X.X`，以**报错里的 IP 为准**（出口可能经过代理/NAT）。

---

## 五、生图接口说明

- **接口**：`POST /v1/images/generations`
- **模型**：`gpt-image-2`
- **尺寸**：`1024x1365`（3:4 竖版）
- **响应**：`data[0].url` — 临时图片 URL，**立即下载**，不要保存 URL
- **504 超时**：偶发，脚本内置重试，通常第 2-3 次成功

---

## 六、目录结构

```
kg-tutorials/
├── SKILL.md                 ← 总入口（系列管理）
├── GUIDE-FOR-AI.md          ← AI操作指南
├── SETUP.md                 ← 本文件：环境配置
├── WORKFLOW.md              ← 端到端 SOP
├── setup_config.py          ← 初始化配置向导 ⭐
├── .kg-config.json          ← 生成的配置文件（不进 git）
├── kg-outline-planner/      ← 技能1：大纲规划
├── kg-image-generator/      ← 技能2：生图引擎
├── kg-publisher/            ← 技能3：多平台发布
├── 参考图片/                 ← 视觉标杆（港珠澳大桥）
└── typhoon/                 ← 《台风图鉴》✅ 已完成
```

---

## 七、安全红线

- `.kg-config.json` 已加入 `.gitignore`，**不会提交到仓库**
- AppSecret 若泄露，立即到微信公众平台后台**重置**
- 生图脚本日志只打印 API Key 前 8 位
