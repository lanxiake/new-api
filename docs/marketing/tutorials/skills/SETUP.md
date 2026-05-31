# 环境配置与依赖（换电脑/新会话必读）

> 本文件让你在**任何一台新电脑或新会话**上，从零配好环境、跑通整套文章创作与发布流程。

---

## 一、依赖清单

| 依赖 | 用途 | 安装 |
|------|------|------|
| Python 3.x | 跑所有脚本（标准库为主） | 系统自带或官网装 |
| cloakbrowser | 抓取/截图/录GIF（穿透微信等反爬） | `python -m pip install cloakbrowser` |
| Pillow | 合成 GIF | `python -m pip install pillow` |

> 注意：若本机 `pip` 被 uv 等接管，统一用 `python -m pip install`。
> cloakbrowser 首次 `launch()` 会自动下载定制 Chromium（约 200MB，缓存本地）。

无需 Node/bun（已弃用第三方 baoyu 技能，发布用纯 Python 的 wechat-publisher）。

---

## 二、凭证与环境变量

**所有密钥只通过环境变量传入，绝不写进代码或提交到仓库。**

| 变量 | 用途 | 哪来 |
|------|------|------|
| `WECHAT_APP_ID` | 公众号发布 | 公众号后台 → 设置与开发 → 基本配置 |
| `WECHAT_APP_SECRET` | 公众号发布 | 同上（重置后只存本地，勿外发） |
| LLM-Link key | gpt-image-2 生图 | LLM-Link 平台的 key（脚本里通过参数/环境传入） |

**配图生成的 LLM-Link 接入**（关键）：
- 接口：`https://www.llm-link.top/v1/chat/completions`（注意是 **chat completions** 接口，不是 images 接口）
- 模型：`gpt-image-2`
- 必带浏览器 `User-Agent` 头（否则被 Cloudflare 拦）
- 响应在 `choices[0].message.content` 里，含 markdown 图片链接，正则提取 URL 再下载
- 504 超时常见，**重试 3-5 次**

**公众号发布前置**：
1. 拿到 AppID + AppSecret，设为环境变量
2. 公众号后台「IP 白名单」加入**你当前的出口公网 IP**
   - **以微信报错里的 IP 为准**（`errcode 40164 invalid ip X.X.X.X`），不要信本地 ipify 探测（出口线路可能不同）
   - 白名单保存后有**几分钟生效延迟**，加完等 3-5 分钟再试
   - 动态宽带 IP 会变，每次发文可能要重加

---

## 三、技能放哪、怎么被识别

本目录的 `skills/` 是**自包含副本**。在新环境用法二选一：

1. **直接按文档手动跑**：照 `WORKFLOW.md` 的步骤，用 `python skills/<技能>/scripts/xxx.py` 调用即可，不依赖任何技能加载机制。
2. **接入 Claude Code 技能系统**：把 `skills/` 下的三个目录复制到你的技能目录（如 `~/.claude/skills/` 或 `~/.openclaw/workspace/skills/`），Claude 会自动识别 SKILL.md。

> 脚本里的路径示例写的是作者机器的绝对路径，新环境请改成你本地 `skills/` 的实际路径。

---

## 四、最小验证（配好后自测）

```bash
# 1. 验证 cloakbrowser 能抓取
python skills/cloakbrowser-scraper/scripts/scrape.py "https://example.com" --out-dir _test

# 2. 验证截图
python skills/cloakbrowser-scraper/scripts/screenshot.py skills/cloakbrowser-scraper/templates/terminal.html _test/shot.png .term

# 3. 验证公众号 token（换上你的凭证）
WECHAT_APP_ID=xx WECHAT_APP_SECRET=xx python -c "import os,json,urllib.request as u; ua={'User-Agent':'Mozilla/5.0'}; print(json.load(u.urlopen(u.Request(f'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={os.environ[chr(34)+chr(87)+chr(69)+chr(67)+chr(72)+chr(65)+chr(84)+chr(95)+chr(65)+chr(80)+chr(80)+chr(95)+chr(73)+chr(68)+chr(34)]}&secret={os.environ[chr(34)+chr(87)+chr(69)+chr(67)+chr(72)+chr(65)+chr(84)+chr(95)+chr(65)+chr(80)+chr(80)+chr(95)+chr(83)+chr(69)+chr(67)+chr(82)+chr(69)+chr(84)+chr(34)]}',headers=ua),timeout=30)))"
```
（token 验证若返回 access_token 即成功；返回 40164 则去加 IP 白名单。）

---

## 五、安全红线

- 凭证只进环境变量，**不进 git**（仓库 .gitignore 已排除 `.baoyu-skills/`、`*.env`、`wechat_profile/`）
- AppSecret 若曾在不可控渠道出现过，到后台**重置**
- 第三方技能下载后**必须审查**（扫外联域名、密钥流向）再用
