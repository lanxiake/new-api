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

### 2.1 需要配置的变量一览

| 变量名 | 用途 | 影响哪个流程 |
|--------|------|-------------|
| `WECHAT_APP_ID` | 微信公众号 AppID | 公众号自动发布 |
| `WECHAT_APP_SECRET` | 微信公众号 AppSecret | 公众号自动发布 |
| `LLM_LINK_API_KEY` | LLM-Link 平台 key | gpt-image-2 生图 |

> **三个流程对应关系**：
> - 网络素材抓取 → 只需安装 cloakbrowser，无需凭证
> - 生图 → 需要 `LLM_LINK_API_KEY`
> - 公众号自动发布 → 需要 `WECHAT_APP_ID` + `WECHAT_APP_SECRET`

---

### 2.2 如何设置环境变量

#### ✅ 方式一：当前终端会话（推荐首次测试）

**macOS / Linux / Git Bash（Windows）：**
```bash
export WECHAT_APP_ID="wx你的AppID"
export WECHAT_APP_SECRET="你的AppSecret"
export LLM_LINK_API_KEY="你的LLM-Link-key"
```

**Windows CMD：**
```cmd
set WECHAT_APP_ID=wx你的AppID
set WECHAT_APP_SECRET=你的AppSecret
set LLM_LINK_API_KEY=你的LLM-Link-key
```

**Windows PowerShell：**
```powershell
$env:WECHAT_APP_ID = "wx你的AppID"
$env:WECHAT_APP_SECRET = "你的AppSecret"
$env:LLM_LINK_API_KEY = "你的LLM-Link-key"
```

> 注意：方式一关闭终端后即失效，下次打开需重新设置。

---

#### ✅ 方式二：写入 Shell 配置（长期生效，macOS/Linux）

```bash
# 编辑 ~/.bashrc 或 ~/.zshrc（看你用哪个 shell）
echo 'export WECHAT_APP_ID="wx你的AppID"' >> ~/.bashrc
echo 'export WECHAT_APP_SECRET="你的AppSecret"' >> ~/.bashrc
echo 'export LLM_LINK_API_KEY="你的LLM-Link-key"' >> ~/.bashrc

# 立即生效
source ~/.bashrc
```

---

#### ✅ 方式三：Windows 系统环境变量（长期生效，Windows）

1. 右键「此电脑」→「属性」→「高级系统设置」→「环境变量」
2. 在「用户变量」区域点「新建」
3. 依次添加三个变量（变量名/变量值填入对应内容）
4. 点「确定」保存，**重启终端**后生效

---

#### ✅ 方式四：`.env` 文件（本地开发推荐，勿提交 git）

在项目根目录创建 `.env` 文件：
```
WECHAT_APP_ID=wx你的AppID
WECHAT_APP_SECRET=你的AppSecret
LLM_LINK_API_KEY=你的LLM-Link-key
```

运行脚本前加载：
```bash
# macOS/Linux
export $(grep -v '^#' .env | xargs)

# 或直接在命令前加
env $(cat .env | xargs) python skills/xxx/scripts/xxx.py
```

> `.env` 已在 `.gitignore` 中排除，安全。

---

### 2.3 各凭证获取方式

**WECHAT_APP_ID / WECHAT_APP_SECRET：**
1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 左侧菜单 → 设置与开发 → 基本配置
3. 找到「开发者 ID（AppID）」和「开发者密码（AppSecret）」
4. AppSecret 只在重置时显示一次，**立即保存到本地安全位置**

**LLM_LINK_API_KEY：**
1. 登录 [LLM-Link 平台](https://www.llm-link.top)
2. 在「API 密钥」或「个人中心」页面创建/复制 key

---

### 2.4 配图生成的 LLM-Link 接入说明

- 接口：`https://www.llm-link.top/v1/chat/completions`（注意是 **chat completions** 接口，不是 images 接口）
- 模型：`gpt-image-2`
- 必带浏览器 `User-Agent` 头（否则被 Cloudflare 拦）
- 响应在 `choices[0].message.content` 里，含 markdown 图片链接，正则提取 URL 再下载
- 504 超时常见，**重试 3-5 次**

---

### 2.5 公众号发布前置配置

1. 拿到 AppID + AppSecret，按 2.2 节方式设为环境变量
2. 查询当前出口公网 IP（见下方脚本），加入公众号后台 IP 白名单
3. 白名单保存后等 **3-5 分钟**再发布，动态宽带每次都可能需要重加

#### 检测当前出口公网 IP

```python
# 查询出口 IP（多源交叉验证，结果一致则可信）
python -c "
import urllib.request, json

sources = [
    ('api64.ipify.org',    'https://api64.ipify.org?format=json',          lambda d: d['ip']),
    ('ipinfo.io',          'https://ipinfo.io/json',                        lambda d: d['ip']),
    ('ifconfig.me',        'https://ifconfig.me/ip',                        lambda d: d.strip()),
]

ua = {'User-Agent': 'Mozilla/5.0'}
results = []
for name, url, extract in sources:
    try:
        req = urllib.request.Request(url, headers=ua)
        raw = urllib.request.urlopen(req, timeout=8).read().decode()
        ip  = extract(json.loads(raw) if raw.strip().startswith('{') else raw)
        print(f'  {name:<20} → {ip}')
        results.append(ip)
    except Exception as e:
        print(f'  {name:<20} → 查询失败: {e}')

if results:
    unique = set(results)
    if len(unique) == 1:
        print(f'\n✅ 出口 IP（一致）: {results[0]}')
        print(f'   → 将此 IP 填入微信公众号后台 IP 白名单')
    else:
        print(f'\n⚠️  各源返回不同，以微信报错中的 IP 为准: {unique}')
"
```

或使用一行快速版：
```bash
python -c "import urllib.request; print(urllib.request.urlopen('https://api64.ipify.org').read().decode())"
```

> **注意**：若上述结果与微信报错 `errcode 40164 invalid ip X.X.X.X` 中的 IP 不同，**以微信报错里的 IP 为准**——出口线路可能经过代理/NAT，本地探测不可靠。

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
