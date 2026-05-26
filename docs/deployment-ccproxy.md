# CCProxy API 部署文档

本文档描述 **ccproxy-api**（Claude Code / Anthropic 兼容 API 代理）的安装、配置与运维流程。适用于与 new-api 同机或独立服务器部署。

> 日服（`38.54.88.22`）完整环境说明见 [`deployment-jp.md`](./deployment-jp.md)。  
> 主站 new-api 部署见 [`deployment.md`](./deployment.md)。

---

## 一、项目说明

### 1.1 功能

CCProxy 是基于 Python + FastAPI 的 API 网关，主要能力：

- 对外提供 **Anthropic / OpenAI 兼容** 的 HTTP 接口（如 `/claude/v1/messages`）
- 通过 **Claude SDK** 插件复用本机 `~/.claude/.credentials.json` 中的 OAuth 凭据（Claude Max 等订阅账号）
- 支持 `auth_token` 鉴权、访问日志、指标、模型列表覆盖等插件

### 1.2 部署架构（参考）

```
客户端 (Claude Code / curl)
        │
        │  Authorization: Bearer <auth_token>
        ▼
  ccproxy serve (:8000)
        │
        ├── 读取 /root/.config/ccproxy/config.toml
        ├── 读取 /root/.claude/.credentials.json（Claude OAuth）
        └── 转发至 Anthropic API（或经本机透明代理）
```

### 1.3 环境与路径约定

| 项目 | 主站参考（已运行） | 日服示例 |
| --- | --- | --- |
| 服务器 IP | `130.94.43.100` | `38.54.88.22` |
| 安装目录 | `/opt/ccproxy-api` | `/opt/ccproxy-api` |
| Git 远程 | `git@gitee.com:lankun_1/ccproxy-api.git` | 同左（私有仓，需密钥或打包同步） |
| 监听端口 | `8000` | `8000` |
| 运行方式 | systemd `ccproxy.service` | 同左 |
| 进程启动 | `uv run ccproxy serve` | 同左 |

> **禁止**将 A 服务器的 `~/.claude/.credentials.json` 复制到 B 服务器：各环境应使用**各自已登录的 Claude 账号**。

---

## 二、前置条件

### 2.1 系统要求

- Linux（Ubuntu 22.04 已验证）
- `git`（构建时 hatch-vcs 需要，须在 `PATH` 中含 `/usr/bin`）
- 内存：建议可用内存 ≥ 500MB（仅 ccproxy）；与 new-api + PostgreSQL + Redis 同机时建议整机 ≥ 2GiB
- **不要在低配 VPS 上执行** `docker build` 构建 ccproxy 镜像（可选；推荐源码 + uv 部署）

### 2.2 网络与端口

- 对外暴露 `8000/tcp`（或通过 Nginx 反代 + HTTPS）
- 若服务器启用全局透明代理（如 ShellCrash/mihomo），ccproxy 出站会随系统路由走代理，**无需**在 ccproxy 内单独配置 `HTTPS_PROXY`

### 2.3 SSH

```bash
# 日服示例（密钥已配置时）
ssh root@38.54.88.22

# 主站示例
ssh -i ~/.ssh/id_rsa root@130.94.43.100
```

---

## 三、首次部署流程

以下以**新服务器**（目录 `/opt/ccproxy-api` 不存在）为例。代码来源三选一：

| 方式 | 适用场景 |
| --- | --- |
| **A. 从已有服务器打包** | Gitee 私有仓、目标机无 Deploy Key |
| **B. Git clone（SSH）** | 目标机已配置 Gitee SSH 密钥 |
| **C. Git clone（HTTPS + Token）** | 临时拉取，不推荐生产 |

### 3.1 安装 uv

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="/root/.local/bin:$PATH"
uv --version
```

建议将 `PATH` 写入 root 的 `~/.bashrc`：

```bash
echo 'export PATH="/root/.local/bin:$PATH"' >> ~/.bashrc
```

### 3.2 获取源码

#### 方式 A：从主站打包传输（推荐，私有仓）

**在主站（130.94.43.100）打包：**

```bash
ssh -i ~/.ssh/id_rsa root@130.94.43.100 \
  "cd /opt && tar czf /tmp/ccproxy-api.tar.gz \
    --exclude='.venv' \
    --exclude='__pycache__' \
    --exclude='.pytest_cache' \
    ccproxy-api/"
```

**在本地中转（Windows PowerShell 示例）：**

```powershell
scp -i $env:USERPROFILE\.ssh\id_rsa root@130.94.43.100:/tmp/ccproxy-api.tar.gz $env:TEMP\ccproxy-api.tar.gz
scp $env:TEMP\ccproxy-api.tar.gz root@38.54.88.22:/tmp/ccproxy-api.tar.gz
```

**在目标服务器解压：**

```bash
ssh root@38.54.88.22 "
  cd /opt && \
  tar xzf /tmp/ccproxy-api.tar.gz && \
  rm -f /tmp/ccproxy-api.tar.gz && \
  ls -la /opt/ccproxy-api/
"
```

#### 方式 B：Gitee SSH clone

```bash
mkdir -p /opt && cd /opt
git clone git@gitee.com:lankun_1/ccproxy-api.git ccproxy-api
cd ccproxy-api
git checkout main   # 或所需分支
```

### 3.3 安装 Python 依赖

构建时 **必须** 让 `git` 在 PATH 中（hatch-vcs 读取版本号）：

```bash
export PATH="/root/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
cd /opt/ccproxy-api
uv sync --locked --no-dev
```

成功后会生成 `.venv/`，并安装 `ccproxy-api` 可编辑包。

验证：

```bash
/opt/ccproxy-api/.venv/bin/ccproxy --help
```

### 3.4 配置 Claude 认证（本机账号）

CCProxy 的 `claude_sdk` 插件使用 **`/root/.claude/.credentials.json`**，不由 ccproxy 生成。

**若该文件已存在**（例如已在服务器上执行过 `claude login`）：跳过本节，仅确认权限：

```bash
ls -la /root/.claude/.credentials.json
# 应为 -rw------- root root
```

**若不存在**：在目标服务器上交互登录 Claude Code：

```bash
# 需已安装 Claude CLI（可选；也可用其他方式生成 credentials）
claude login
```

登录成功后应出现 OAuth 字段（示例结构，勿提交真实 token）：

```json
{
  "claudeAiOauth": {
    "accessToken": "sk-ant-oat01-...",
    "refreshToken": "sk-ant-ort01-...",
    "expiresAt": 1779837992230,
    "scopes": ["user:inference", "..."]
  }
}
```

> 日服与主站为**不同 Claude 账号**时，各自维护各自的 `~/.claude/`，互不复制的原则不变。

### 3.5 生成 API 鉴权令牌

```bash
AUTH_TOKEN=$(openssl rand -base64 32 | tr -d '/+=' | head -c 44)
echo "AUTH_TOKEN=$AUTH_TOKEN"
```

将输出保存到服务器备忘（勿提交 Git），例如：

```bash
mkdir -p /opt/ccproxy-api
cat > /opt/ccproxy-api/SECRETS.txt << EOF
# CCProxy 机密 - 勿提交 Git
AUTH_TOKEN=<上一步生成的值>
访问地址: http://<SERVER_IP>:8000
配置文件: /root/.config/ccproxy/config.toml
EOF
chmod 600 /opt/ccproxy-api/SECRETS.txt
```

### 3.6 编写 config.toml

创建配置目录并写入（将 `<AUTH_TOKEN>` 替换为 3.5 生成的值）：

```bash
mkdir -p /root/.config/ccproxy
```

`/root/.config/ccproxy/config.toml` 参考内容：

```toml
# CCProxy - 生产配置示例

[server]
host = "0.0.0.0"
port = 8000
log_level = "INFO"

[security]
auth_token = "<AUTH_TOKEN>"

[cors]
allow_origins = ["*"]
allow_credentials = true
allow_methods = ["*"]
allow_headers = ["*"]

[claude]
cli_path = "auto"
builtin_permissions = true
include_system_messages_in_stream = true

[logging]
level = "INFO"
format = "auto"
plugin_log_base_dir = "/tmp/ccproxy"

enable_plugins = true

[plugins.access_log]
enabled = true
client_enabled = true
client_format = "structured"
client_log_file = "/tmp/ccproxy/access.log"
provider_enabled = false

[plugins.claude_sdk]
enabled = true

[[plugins.claude_sdk.models_endpoint]]
id = "claude-opus-4-7"
object = "model"
created = 1748476800
owned_by = "anthropic"
root = "claude-opus-4-7"

[[plugins.claude_sdk.models_endpoint]]
id = "claude-opus-4-6"
object = "model"
created = 1722816000
owned_by = "anthropic"
root = "claude-opus-4-6"

[[plugins.claude_sdk.models_endpoint]]
id = "claude-sonnet-4-6"
object = "model"
created = 1722816000
owned_by = "anthropic"
root = "claude-sonnet-4-6"

[[plugins.claude_sdk.models_endpoint]]
id = "claude-haiku-4-5-20251001"
object = "model"
created = 1722816000
owned_by = "anthropic"
root = "claude-haiku-4-5-20251001"
```

**从本地上传配置文件（避免 shell 转义问题）：**

```powershell
# 本地先编辑好 config.toml，再 scp
scp .\config.toml root@38.54.88.22:/root/.config/ccproxy/config.toml
```

```bash
chmod 600 /root/.config/ccproxy/config.toml
mkdir -p /tmp/ccproxy
```

### 3.7 配置 systemd 服务

`/etc/systemd/system/ccproxy.service`：

```ini
[Unit]
Description=CCProxy API Server
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/ccproxy-api
ExecStart=/root/.local/bin/uv run ccproxy serve
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ccproxy
Environment="PATH=/root/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="HOME=/root"
Environment="UV_PROJECT=/opt/ccproxy-api"

[Install]
WantedBy=multi-user.target
```

启用并启动：

```bash
systemctl daemon-reload
systemctl enable ccproxy
systemctl start ccproxy
```

### 3.8 首次启动说明

首次启动可能较慢（约 30–90 秒），原因包括：

- 插件初始化（DuckDB、定价缓存等）
- **Codex 插件**会尝试 `npm exec @openai/codex`；未安装 Node/npm 时会失败并超时，**属正常**，之后仍会监听 `8000`

日志中常见**非致命**警告：

- `AnalyticsIngestService not registered`
- `codex_version_detection_failed` / `Codex CLI not found`
- `credential_balancer_no_providers_configured`

### 3.9 验证

```bash
# 等待端口就绪
sleep 30
curl -sS http://127.0.0.1:8000/health | head -c 200
echo

# 需带 auth_token
source /opt/ccproxy-api/SECRETS.txt   # 若已写入 AUTH_TOKEN=...
curl -sS -H "Authorization: Bearer ${AUTH_TOKEN}" \
  http://127.0.0.1:8000/claude/v1/models | head -c 500
echo

systemctl status ccproxy
ss -tlnp | grep 8000
```

预期：

- `/health` 返回 `"status":"pass"`
- `/claude/v1/models` 返回模型列表 JSON
- `ss` 显示 `0.0.0.0:8000` 由 `ccproxy` 监听

---

## 四、客户端配置

### 4.1 环境变量（Claude Code / SDK）

```bash
export ANTHROPIC_API_KEY="<AUTH_TOKEN>"
export ANTHROPIC_BASE_URL="http://<SERVER_IP>:8000/claude"
```

### 4.2 curl 示例

```bash
curl -H "Authorization: Bearer <AUTH_TOKEN>" \
  "http://<SERVER_IP>:8000/claude/v1/messages" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-sonnet-4-6","max_tokens":1024,"messages":[{"role":"user","content":"hi"}]}'
```

### 4.3 防火墙与安全

- 生产建议：**Nginx 反代 + HTTPS**，并限制 `8000` 仅内网或 VPN 访问
- `auth_token` 等同于 API 密钥，泄露后应立即轮换并 `systemctl restart ccproxy`

---

## 五、日常运维

### 5.1 常用命令

```bash
systemctl status ccproxy
systemctl restart ccproxy
systemctl stop ccproxy
systemctl start ccproxy

journalctl -u ccproxy -f
journalctl -u ccproxy --since "30 min ago" --no-pager
```

### 5.2 修改配置

1. 编辑 `/root/.config/ccproxy/config.toml`
2. `systemctl restart ccproxy`
3. 再次 `curl` `/health` 与 `/claude/v1/models`

### 5.3 查看访问日志

若启用了 `plugins.access_log`：

```bash
tail -f /tmp/ccproxy/access.log
```

---

## 六、代码更新

### 6.1 打包同步（私有仓 / 无 Gitee 密钥）

与首次部署 **3.2 方式 A** 相同，在目标机增加备份与依赖重装：

```bash
# 目标机：备份旧目录
ssh root@<TARGET_IP> "
  cd /opt && \
  mv ccproxy-api ccproxy-api.bak.\$(date +%Y%m%d-%H%M%S)
"

# 传输新包并解压（见 3.2）
# 然后：
ssh root@<TARGET_IP> "
  export PATH=/root/.local/bin:/usr/local/bin:/usr/bin:/bin:\$PATH && \
  cd /opt/ccproxy-api && \
  uv sync --locked --no-dev && \
  systemctl restart ccproxy && \
  sleep 20 && \
  curl -sS http://127.0.0.1:8000/health
"
```

> 更新**不会**覆盖 `/root/.config/ccproxy/config.toml` 与 `/root/.claude/`，无需重新登录 Claude。

### 6.2 Git pull（已配置 Deploy Key 时）

```bash
cd /opt/ccproxy-api
git pull
export PATH="/root/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
uv sync --locked --no-dev
systemctl restart ccproxy
```

### 6.3 使用项目自带重启脚本（可选）

```bash
cd /opt/ccproxy-api
./scripts/restart-ccproxy.sh --port 8000
```

脚本会释放端口并以 `nohup` 方式启动；**生产环境建议仍以 systemd 为准**。

---

## 七、Docker 部署（可选）

仓库内含 `docker-compose.yml`，默认映射 `8000:8000` 并挂载 `~/.claude`。

```bash
cd /opt/ccproxy-api
docker compose build
docker compose up -d
```

日服等资源紧张时，**更推荐 systemd + uv**（与主站 130.94.43.100 一致），避免再占用 Docker 构建内存。

---

## 八、故障排查

| 现象 | 可能原因 | 处理 |
| --- | --- | --- |
| `Connection refused` :8000 | 仍在插件初始化 / Codex 检测超时 | 等待 60s，`journalctl -u ccproxy -f` |
| `uv sync` 构建失败 `git not found` | PATH 无 `/usr/bin` | `export PATH=...:/usr/bin:...` 后重试 |
| `uv sync` 构建失败 `unable to detect version` | 非 git 目录或 `.git` 缺失 | 用完整 git clone 或打包时保留 `.git` |
| 外网 503 / 超时 | 防火墙、代理规则、仅监听本机 | 检查 `ss -tlnp`、nftables、ShellCrash 规则 |
| 401 / 鉴权失败 | `auth_token` 与客户端不一致 | 核对 `config.toml` 与 `Authorization: Bearer` |
| Claude 上游 401 | `~/.claude/.credentials.json` 过期 | 在**本机**重新 `claude login` |
| 内存飙升后 SSH 断开 | 1.9G 机器同时跑多服务 OOM | `free -h`；必要时 `systemctl stop ccproxy` 错峰启动 |

**调试命令：**

```bash
ps aux | grep ccproxy
ss -tlnp | grep 8000
journalctl -u ccproxy -n 80 --no-pager

# 前台运行（先 stop systemd）
systemctl stop ccproxy
cd /opt/ccproxy-api
/root/.local/bin/uv run ccproxy serve
```

---

## 九、与主站配置差异对照

| 配置项 | 主站 130.94.43.100 | 日服 38.54.88.22 |
| --- | --- | --- |
| Claude 账号 | 主站 `~/.claude/` | 日服自有 Max 账号 |
| `auth_token` | 独立生成 | 独立生成（见 `SECRETS.txt`） |
| 源码更新 | 可直接 `git pull`（有 Gitee SSH） | 建议打包同步 |
| 共存服务 | new-api Docker + PG + Redis | 同左 + ShellCrash 透明代理 |
| 对外 URL 示例 | `http://130.94.43.100:8000` | `http://38.54.88.22:8000` |

---

## 十、部署 Checklist

### 部署前

- [ ] 目标机 SSH 可登录
- [ ] `git`、`curl` 可用
- [ ] 已规划 `8000` 端口与防火墙
- [ ] 确认 Claude 使用**本服务器**账号（不复制他机 credentials）

### 首次部署

- [ ] `uv` 已安装（`/root/.local/bin/uv`）
- [ ] `/opt/ccproxy-api` 源码就位（含 `.git`）
- [ ] `uv sync --locked --no-dev` 成功
- [ ] `/root/.claude/.credentials.json` 存在且有效
- [ ] `/root/.config/ccproxy/config.toml` 已配置 `auth_token`
- [ ] `/opt/ccproxy-api/SECRETS.txt` 已创建且 `chmod 600`
- [ ] `ccproxy.service` 已 `enable --now`
- [ ] `/health` 返回 pass
- [ ] `/claude/v1/models` 带 Bearer 可访问
- [ ] 临时打包文件已清理（`/tmp/ccproxy-api.tar.gz`）

### 例行更新

- [ ] 备份 `/opt/ccproxy-api` 或打 tag
- [ ] 同步代码 + `uv sync`
- [ ] `systemctl restart ccproxy`
- [ ] 验证 `/health`

---

## 十一、相关文件速查

| 路径 | 说明 |
| --- | --- |
| `/opt/ccproxy-api/` | 项目根目录 |
| `/opt/ccproxy-api/.venv/` | Python 虚拟环境 |
| `/opt/ccproxy-api/SECRETS.txt` | 本地机密备忘（勿提交 Git） |
| `/root/.config/ccproxy/config.toml` | 运行时主配置 |
| `/root/.claude/.credentials.json` | Claude OAuth（按机器独立） |
| `/etc/systemd/system/ccproxy.service` | systemd 单元 |
| `/tmp/ccproxy/access.log` | 访问日志（启用 access_log 时） |
| `/opt/ccproxy-api/config.example.toml` | 上游完整配置示例 |
| `/opt/ccproxy-api/systemd/ccproxy.service.template` | systemd 模板 |

---

## 十二、参考：主站 systemd 实际配置

主站 `130.94.43.100` 当前使用与上文 **3.7** 等价的单元文件，`WorkingDirectory=/opt/ccproxy-api`，`ExecStart=/root/.local/bin/uv run ccproxy serve`，`Restart=always`。

查看线上配置：

```bash
ssh -i ~/.ssh/id_rsa root@130.94.43.100 "systemctl cat ccproxy"
```
