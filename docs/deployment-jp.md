# 日服部署文档（38.54.88.22）

本文档记录 new-api 在 **日服（38.54.88.22）** 的完整部署流程，与现有 `130.94.43.100` 部署相互独立。该服务器为 **全新初始化**，采用 `docker compose` 编排 new-api + PostgreSQL + Redis，二进制由本地 Docker 构建后上传替换。

> 现有 130.94.43.100 部署流程见 [`deployment.md`](./deployment.md)。

---

## 一、服务器信息

| 项目 | 值 |
| --- | --- |
| 服务器 IP | `38.54.88.22` |
| 别名 | 日服 |
| SSH 用户 | `root` |
| 登录方式 | **仅密钥登录**（密码登录已禁用） |
| SSH 密钥 | `~/.ssh/id_rsa`（复用本地默认密钥） |
| 系统 | Ubuntu 22.04.1 LTS (Jammy) |
| 内核 | 5.15.0-60-generic x86_64 |
| 磁盘 | 50G（可用约 46G） |
| 内存 | 1.9 GiB（无 swap） |
| 安装路径 | `/opt/new-api` |
| 对外端口 | `3000`（后续可加 Nginx + HTTPS） |
| 数据库 | PostgreSQL 16（容器内） |
| 缓存 | Redis 7（容器内） |

> 服务器内存仅 1.9 GiB，**不建议在服务器本地构建** Go/前端，构建工作必须在本地完成后上传二进制。

---

## 二、首次部署流程

### 2.1 配置 SSH 密钥登录

本机已有 `~/.ssh/id_rsa.pub`，需要将其注入服务器的 `authorized_keys`，并禁用密码登录。

#### 2.1.1 首次注入公钥（仅首次部署时执行）

**前提**：新机刚开通时，云厂商通常通过下列三种方式之一交付登录凭据，请优先使用：

- **A. 云厂商控制台注入 SSH 密钥**（最推荐）：开机前在控制台「自定义镜像 / SSH 密钥」中绑定公钥，开机即可直接 `ssh -i ~/.ssh/id_rsa root@<IP>` 登录，**无需密码环节**。
- **B. 一次性密码 / 救援密码**：从云厂商邮件或控制台获取，**仅用于注入公钥**，注入后立即禁用。
- **C. 控制台 VNC / 串口**：通过云厂商的 Web 控制台进入 shell 注入公钥。

如选择方式 B，执行（会提示一次性密码，输入后回车）：

```bash
ssh-copy-id -i ~/.ssh/id_rsa.pub root@38.54.88.22
```

或手动方式：

```bash
ssh root@38.54.88.22 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && \
  echo '$(cat ~/.ssh/id_rsa.pub)' >> ~/.ssh/authorized_keys && \
  chmod 600 ~/.ssh/authorized_keys && \
  sort -u ~/.ssh/authorized_keys -o ~/.ssh/authorized_keys && echo DONE"
```

#### 2.1.2 验证密钥登录可用

```bash
ssh -o BatchMode=yes -o PasswordAuthentication=no root@38.54.88.22 "echo KEY_OK && uname -a"
```

`BatchMode=yes` + `PasswordAuthentication=no` 强制只用密钥，**如果未注入成功会立即报错而不是 fallback 到密码**。

#### 2.1.3 禁用密码登录（强烈建议）

**前置条件**：必须先确认 2.1.2 通过，否则会把自己锁在外面。

```bash
ssh root@38.54.88.22 "sed -i \
    -e 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' \
    -e 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' \
    -e 's/^#*ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' \
    -e 's/^#*KbdInteractiveAuthentication.*/KbdInteractiveAuthentication no/' \
    /etc/ssh/sshd_config && \
  grep -E '^(PasswordAuthentication|PermitRootLogin|ChallengeResponseAuthentication|KbdInteractiveAuthentication)' /etc/ssh/sshd_config && \
  systemctl restart ssh"
```

#### 2.1.4 再次验证（确认密码登录已关闭）

```bash
# 应该成功（密钥登录）
ssh -o BatchMode=yes root@38.54.88.22 "echo KEY_OK"

# 应该失败（密码登录已禁用）
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no root@38.54.88.22 2>&1 | grep -i "permission denied\|no supported authentication"
```

> ⚠️ **如果不慎把自己锁在外面**：使用云厂商控制台 VNC / 串口登录，恢复 `/etc/ssh/sshd_config` 中 `PasswordAuthentication yes`，然后 `systemctl restart ssh` 即可。

### 2.2 安装 Docker

```bash
ssh root@38.54.88.22 "curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sh /tmp/get-docker.sh"
ssh root@38.54.88.22 "docker --version && docker compose version && systemctl is-active docker"
```

预期输出：

```
Docker version 29.5.2, build 79eb04c
Docker Compose version v5.1.4
active
```

### 2.3 创建项目目录

```bash
ssh root@38.54.88.22 "mkdir -p /opt/new-api/{data,logs,postgres,redis}"
```

| 目录 | 用途 |
| --- | --- |
| `/opt/new-api/data` | new-api 持久化数据（SQLite/上传文件等） |
| `/opt/new-api/logs` | 应用日志 |
| `/opt/new-api/postgres` | PostgreSQL 数据卷 |
| `/opt/new-api/redis` | Redis 持久化数据 |

### 2.4 编写 `docker-compose.yml`

部署在 `/opt/new-api/docker-compose.yml`：

```yaml
services:
  new-api:
    image: calciumion/new-api:latest
    container_name: new-api
    restart: always
    ports:
      - "3000:3000"
    environment:
      - SQL_DSN=postgres://newapi:<POSTGRES_PASSWORD>@postgres:5432/newapi?sslmode=disable
      - REDIS_CONN_STRING=redis://redis:6379
      - SESSION_SECRET=<SESSION_SECRET>
      - CRYPTO_SECRET=<CRYPTO_SECRET>
      - TZ=Asia/Shanghai
      - ERROR_LOG_ENABLED=true
      - STREAMING_TIMEOUT=120
    volumes:
      - ./data:/data
      - ./logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - newapi-net

  postgres:
    image: postgres:16-alpine
    container_name: newapi-postgres
    restart: always
    environment:
      - POSTGRES_USER=newapi
      - POSTGRES_PASSWORD=<POSTGRES_PASSWORD>
      - POSTGRES_DB=newapi
      - TZ=Asia/Shanghai
    volumes:
      - ./postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U newapi -d newapi"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - newapi-net

  redis:
    image: redis:7-alpine
    container_name: newapi-redis
    restart: always
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - ./redis:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
    networks:
      - newapi-net

networks:
  newapi-net:
    driver: bridge
```

#### 生成机密

在本地用 openssl 生成：

```bash
PG_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
SESSION=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
CRYPTO=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
echo "POSTGRES_PASSWORD=$PG_PASS"
echo "SESSION_SECRET=$SESSION"
echo "CRYPTO_SECRET=$CRYPTO"
```

将生成的值填入 `docker-compose.yml`，并写入服务器上的密钥备忘文件：

```bash
ssh root@38.54.88.22 "cat > /opt/new-api/SECRETS.txt << 'EOF'
# new-api 部署机密 (38.54.88.22)
Postgres User:     newapi
Postgres Password: <POSTGRES_PASSWORD>
SESSION_SECRET:    <SESSION_SECRET>
CRYPTO_SECRET:     <CRYPTO_SECRET>
访问地址: http://38.54.88.22:3000
EOF
chmod 600 /opt/new-api/SECRETS.txt"
```

> **不要将 SECRETS.txt 或填好的 docker-compose.yml 提交到 Git。**

### 2.5 本地构建 Go 二进制

在本地 Windows + Docker Desktop 环境构建：

```bash
DOCKER="/c/Program Files/Docker/Docker/resources/bin/docker.exe"

# 1. 构建（耗时长，需构建 default + classic 两个前端 + Go 后端）
"$DOCKER" build -f Dockerfile.build -t new-api:local-build .

# 2. 提取二进制
TMP="tmp-extract-$$"
"$DOCKER" create --name "$TMP" new-api:local-build
"$DOCKER" cp "$TMP:/new-api" ./new-api-binary
"$DOCKER" rm "$TMP"

ls -lh ./new-api-binary
```

> 本地 Docker Desktop 资源建议 ≥ 4 核 / 6 GiB，否则构建过程中 `bun run build` 易被 OOM Kill（退出码 137）。
> 若资源不足，可：
> - 关闭 Docker Desktop 中无关容器；
> - 临时调高 Docker Desktop 资源；
> - 或退化使用官方镜像直接启动（见 5.1）。

### 2.6 启动 PostgreSQL + Redis + 官方 new-api 镜像

先用官方镜像拉起整套服务，初始化数据库结构：

```bash
ssh root@38.54.88.22 "cd /opt/new-api && docker compose pull && docker compose up -d"
ssh root@38.54.88.22 "cd /opt/new-api && docker compose ps"
```

等待约 30 秒后查看健康状态：

```bash
ssh root@38.54.88.22 "docker logs --tail 50 new-api"
```

确认 new-api 完成自动建表后再进入下一步。

### 2.7 上传本地二进制并替换

```bash
# 上传
scp ./new-api-binary root@38.54.88.22:/tmp/new-api

# 替换 + 重启
ssh root@38.54.88.22 "chmod +x /tmp/new-api && \
  docker cp /tmp/new-api new-api:/new-api && \
  docker restart new-api && \
  rm -f /tmp/new-api"

# 本地清理
rm -f ./new-api-binary
```

### 2.8 验证

```bash
# 容器状态
ssh root@38.54.88.22 "cd /opt/new-api && docker compose ps"

# 日志
ssh root@38.54.88.22 "docker logs --tail 100 new-api"

# 健康检查（本机回环）
ssh root@38.54.88.22 "curl -sS http://127.0.0.1:3000/api/status | head -200"

# 外网访问
curl -I http://38.54.88.22:3000
```

浏览器打开 `http://38.54.88.22:3000`，使用 new-api 默认管理员账号登录（参考 new-api 官方文档 README），**登录后立即修改密码**，并将新密码写入 `/opt/new-api/SECRETS.txt`。

---

## 三、日常更新流程

后续仅替换二进制即可（数据库、Redis、配置保持不变）：

```bash
# 1. 本地构建并提取
DOCKER="/c/Program Files/Docker/Docker/resources/bin/docker.exe"
"$DOCKER" build -f Dockerfile.build -t new-api:local-build .
TMP="tmp-extract-$$"
"$DOCKER" create --name "$TMP" new-api:local-build
"$DOCKER" cp "$TMP:/new-api" ./new-api-binary
"$DOCKER" rm "$TMP"

# 2. （可选）服务器上备份当前二进制
ssh root@38.54.88.22 "mkdir -p /opt/new-api/backup && \
  docker cp new-api:/new-api /opt/new-api/backup/new-api.$(date +%Y%m%d-%H%M%S)"

# 3. 上传并替换
scp ./new-api-binary root@38.54.88.22:/tmp/new-api
ssh root@38.54.88.22 "chmod +x /tmp/new-api && \
  docker cp /tmp/new-api new-api:/new-api && \
  docker restart new-api && \
  rm -f /tmp/new-api"

# 4. 本地清理
rm -f ./new-api-binary
```

---

## 四、运维常用命令

```bash
# 进入服务器
ssh root@38.54.88.22

# 进入项目目录
cd /opt/new-api

# 服务状态 / 启停
docker compose ps
docker compose stop new-api
docker compose start new-api
docker compose restart new-api

# 查看日志
docker logs --tail 200 -f new-api
docker logs --tail 200 newapi-postgres
docker logs --tail 200 newapi-redis

# 进入数据库
docker exec -it newapi-postgres psql -U newapi -d newapi

# 进入 Redis
docker exec -it newapi-redis redis-cli

# 资源占用
docker stats --no-stream
```

---

## 五、备份与回滚

### 5.1 PostgreSQL 备份

```bash
ssh root@38.54.88.22 "docker exec newapi-postgres \
  pg_dump -U newapi -d newapi -Fc -f /tmp/newapi.$(date +%Y%m%d).dump && \
  docker cp newapi-postgres:/tmp/newapi.$(date +%Y%m%d).dump /opt/new-api/backup/"
```

下载到本地：

```bash
scp root@38.54.88.22:/opt/new-api/backup/newapi.YYYYMMDD.dump ./
```

### 5.2 二进制回滚

```bash
ssh root@38.54.88.22 "ls /opt/new-api/backup/"

ssh root@38.54.88.22 "docker cp /opt/new-api/backup/new-api.<TIMESTAMP> new-api:/new-api && \
  docker restart new-api"
```

### 5.3 完整重置（谨慎）

会清空所有数据：

```bash
ssh root@38.54.88.22 "cd /opt/new-api && docker compose down && \
  rm -rf data logs postgres redis && \
  mkdir -p data logs postgres redis && \
  docker compose up -d"
```

---

## 六、全局静态出口代理（ShellCrash + mihomo）

为了让 new-api 访问 OpenAI / Claude / Gemini 等上游 API 时使用**固定的美国出口 IP**（绕过供应商的地区风控、保证 IP 信誉），日服部署了 **ShellCrash + mihomo（Clash Meta）** 作为全局透明代理。

### 6.1 架构说明

```
        Docker 容器 new-api
              │
              │ 任何出站请求（OpenAI / Claude / ...）
              ▼
       mihomo TUN 接口（Meta 198.18.0.1）
              │
              │ 按 rules 匹配
              ▼
       static-out 节点（HTTP 代理）
              │
              │ HTTP CONNECT
              ▼
       70.39.242.6:443（美国纽约）
              │
              ▼
         OpenAI / Claude / ...
```

| 项目 | 值 |
| --- | --- |
| 代理内核 | mihomo (Clash Meta) v1.19.17 |
| 管理框架 | ShellCrash (juewuy/ShellCrash@dev) |
| 静态出口节点 | `70.39.242.6:443`（HTTP 明文代理，**非 HTTPS** 即使端口是 443） |
| 节点 ISP | AS3257 GTT Communications Inc. |
| 节点地理位置 | 美国纽约（New York City, NY, US） |
| 接管模式 | TUN（透明代理，无需容器配置 `HTTPS_PROXY`） |
| 本地代理端口 | `7890`（mixed http+socks） |
| 控制器端口 | `127.0.0.1:9090`（仅本机 RESTful API） |
| 部署目录 | `/etc/ShellCrash/run/` |
| 系统服务 | `systemctl start/stop/restart shellcrash` |
| 开机自启 | 已启用（`systemctl is-enabled shellcrash` → enabled） |

### 6.2 首次部署流程（已完成，仅作记录）

#### 步骤 1：安装 ShellCrash 框架

```bash
ssh root@38.54.88.22
cd /opt
# 下载 ShellCrash 安装脚本（如果已有 install.sh 跳过）
curl -fsSL https://gh-proxy.com/raw.githubusercontent.com/juewuy/ShellCrash/dev/install.sh -o install.sh
bash install.sh
```

交互菜单选择：
- 内核：**mihomo**（Clash Meta）
- 架构：**amd64**
- 运行模式：**Tun**
- 防火墙：**nftables**
- DNS 模式：**redir_host**
- 命令别名：**crash**

完成后会生成：
- `/etc/ShellCrash/`（管理脚本）
- `/tmp/ShellCrash/CrashCore`（下载的 mihomo 二进制）
- shell alias `crash`（指向 `bash /etc/ShellCrash/menu.sh`）

> 注意：`crash` 是 **shell 别名**，不在 PATH 中。`ssh root@host "crash"` 这样的非交互调用**不会工作**，必须先 `source /etc/ShellCrash/init.sh`。

#### 步骤 2：导入订阅（绕过菜单直接写文件）

```bash
# 1. 写入订阅元信息（格式: 名字 URL 间隔1 间隔2 UA）
cat > /etc/ShellCrash/configs/providers.cfg << 'EOF'
mysub https://b.bbydy.org/api/bby/client/subscribe?token=<YOUR_TOKEN> 3 12 clash.meta
EOF

# 2. 下载订阅 yaml
mkdir -p /etc/ShellCrash/yamls
curl -sSL --max-time 30 \
  -A "clash.meta" \
  -H "User-Agent: clash.meta" \
  -o /etc/ShellCrash/yamls/mysub.yaml \
  "https://b.bbydy.org/api/bby/client/subscribe?token=<YOUR_TOKEN>"
```

#### 步骤 3：修改配置（追加静态出口节点 + SSH 保护规则）

在 `/etc/ShellCrash/yamls/mysub.yaml` 中：

**(a)** `proxies:` 段末尾追加静态节点：
```yaml
    - { name: static-out, type: http, server: 70.39.242.6, port: 443, username: <USER>, password: <PASS> }
```
> ⚠️ 关键：即使端口是 443，**也不要加 `tls: true`** —— 该供应商在 443 端口提供的是 **HTTP 明文 CONNECT 代理**，加 `tls: true` 会导致连接失败。

**(b)** `proxy-groups:` 段开头插入策略组：
```yaml
    - { name: STATIC-OUT, type: select, proxies: [static-out, DIRECT] }
```

**(c)** `rules:` 段开头插入规则（**SSH 直连保护** + 全局走 STATIC-OUT）：
```yaml
rules:
    - 'IP-CIDR,<SSH_SOURCE_IP>/32,DIRECT,no-resolve'  # SSH 来源 IP 直连
    - 'DST-PORT,22,DIRECT'                            # 22 端口出站直连
    - 'IP-CIDR,70.39.242.6/32,DIRECT,no-resolve'      # 静态节点本身直连（避免回环）
    - 'GEOIP,LAN,DIRECT,no-resolve'                   # 内网直连
    - 'DOMAIN-SUFFIX,bbydy.org,DIRECT'                # 订阅站直连
    - 'MATCH,STATIC-OUT'                              # 其他全部走静态出口
    # ... 订阅自带的其他规则保留
```

**(d)** 修改 `external-controller` 为 `127.0.0.1:9090`（避免控制器暴露公网）

**(e)** 文件末尾追加 TUN 配置：
```yaml
tun:
  enable: true
  stack: system
  dns-hijack:
    - any:53
  auto-route: true
  auto-detect-interface: true
```

#### 步骤 4：安装内核到正式位置

```bash
cp /tmp/ShellCrash/CrashCore /etc/ShellCrash/CrashCore
chmod +x /etc/ShellCrash/CrashCore
/etc/ShellCrash/CrashCore -v   # 验证版本
```

#### 步骤 5：固化运行目录

```bash
mkdir -p /etc/ShellCrash/run
cp /etc/ShellCrash/yamls/mysub.yaml /etc/ShellCrash/run/config.yaml
# 首次启动时 mihomo 会自动下载 GeoIP/GeoSite 数据
```

#### 步骤 6：配置语法校验

```bash
/etc/ShellCrash/CrashCore -d /etc/ShellCrash/run -t
# 应输出：configuration file ... test is successful
```

#### 步骤 7：写 systemd 单元

```bash
cat > /etc/systemd/system/shellcrash.service << 'EOF'
[Unit]
Description=ShellCrash (mihomo) Global Proxy
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
LimitNPROC=500
LimitNOFILE=1000000
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_BIND_SERVICE CAP_NET_RAW CAP_SYS_TIME CAP_SYS_PTRACE CAP_DAC_READ_SEARCH CAP_DAC_OVERRIDE
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE CAP_NET_RAW CAP_SYS_TIME CAP_SYS_PTRACE CAP_DAC_READ_SEARCH CAP_DAC_OVERRIDE
Restart=always
RestartSec=5
ExecStartPre=/sbin/sysctl -w net.ipv4.ip_forward=1
ExecStart=/etc/ShellCrash/CrashCore -d /etc/ShellCrash/run
ExecStopPost=/bin/sh -c "ip link delete Meta 2>/dev/null; true"

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now shellcrash.service
```

#### 步骤 8：验证

```bash
# 服务状态
systemctl status shellcrash.service

# 进程
ps -ef | grep CrashCore | grep -v grep

# 监听端口
ss -tlnp | grep -E '7890|9090'

# TUN 接口
ip link show Meta

# 出口 IP（应返回 70.39.242.6）
curl -s https://api.ipify.org && echo
curl -s https://ipinfo.io/json
```

预期输出：
```json
{
  "ip": "70.39.242.6",
  "city": "New York City",
  "region": "New York",
  "country": "US",
  "loc": "40.7143,-74.0060",
  "org": "AS3257 GTT Communications Inc.",
  "postal": "10001",
  "timezone": "America/New_York"
}
```

### 6.3 日常运维

```bash
# 启停 / 重启
systemctl start shellcrash
systemctl stop shellcrash
systemctl restart shellcrash

# 查看运行日志
journalctl -u shellcrash -f
journalctl -u shellcrash --since "10 min ago"

# 验证出口 IP
curl -s https://api.ipify.org

# 临时通过本机 7890 走代理（测试用）
curl -x http://127.0.0.1:7890 https://api.openai.com

# 通过 mihomo RESTful API 热重载配置（无需重启服务）
curl -X PUT "http://127.0.0.1:9090/configs?force=true" \
  -H "Content-Type: application/json" \
  -d '{"path":"/etc/ShellCrash/run/config.yaml"}'

# 查看代理策略组当前选中节点
curl -s http://127.0.0.1:9090/proxies/STATIC-OUT | jq .

# 切换 STATIC-OUT 策略组到 DIRECT（应急临时不走代理）
curl -X PUT http://127.0.0.1:9090/proxies/STATIC-OUT \
  -H "Content-Type: application/json" \
  -d '{"name":"DIRECT"}'

# 切回 static-out
curl -X PUT http://127.0.0.1:9090/proxies/STATIC-OUT \
  -H "Content-Type: application/json" \
  -d '{"name":"static-out"}'
```

### 6.4 故障排查

#### 出口 IP 不是 70.39.242.6？

```bash
# 1. 检查 Clash 进程是否运行
ps -ef | grep CrashCore

# 2. 检查 TUN 接口
ip link show Meta
ip route | grep Meta

# 3. 检查 static-out 节点是否健康
curl -s http://127.0.0.1:9090/proxies/static-out

# 4. 检查最近 50 行日志
journalctl -u shellcrash -n 50 --no-pager
```

#### SSH 连接卡住 / 断开？

正常情况下 SSH **不会**被 TUN 代理（TUN 只接管出站；SSH 是入站连接）。如果断开，通常是 mihomo 在切换 TUN 接口的瞬间路由表抖动。配置文件中已加入两条保护规则：
- `IP-CIDR,<SSH_SOURCE_IP>/32,DIRECT,no-resolve`
- `DST-PORT,22,DIRECT`

万一仍然有问题，可以通过云厂商控制台（VNC / 串口）执行：
```bash
systemctl stop shellcrash
ip link delete Meta 2>/dev/null
```
立刻恢复直连。

#### Clash 启动后端口冲突 (`bind: address already in use`)？

通常是上次的 `nohup` 启动残留没清理：
```bash
systemctl stop shellcrash
# 强杀所有残留
for pid in $(pgrep CrashCore); do kill -9 $pid; done
sleep 2
ip link delete Meta 2>/dev/null
systemctl start shellcrash
```

#### 想临时关闭代理（不卸载）？

```bash
systemctl stop shellcrash    # 立即恢复直连
systemctl start shellcrash   # 重新启用代理
```

服务器重启后会**自动启用**（`enabled`）。如要禁用开机自启：
```bash
systemctl disable shellcrash
```

### 6.5 修改配置后如何应用

**方案 A：热重载（不中断流量，推荐）**
```bash
# 编辑配置
vi /etc/ShellCrash/run/config.yaml

# 语法校验
/etc/ShellCrash/CrashCore -d /etc/ShellCrash/run -t

# 热重载
curl -X PUT "http://127.0.0.1:9090/configs?force=true" \
  -H "Content-Type: application/json" \
  -d '{"path":"/etc/ShellCrash/run/config.yaml"}'
```

**方案 B：重启服务（有 ~2 秒空窗期）**
```bash
systemctl restart shellcrash
```

### 6.6 添加新的 AI 上游域名走静态出口

`rules:` 段中已有 `MATCH,STATIC-OUT` 兜底，所以**任何**新域名默认都会走静态出口。如果只想让特定域名走，把 `MATCH,STATIC-OUT` 改成 `MATCH,DIRECT`，然后在它之前添加：
```yaml
- 'DOMAIN-SUFFIX,新上游域名.com,STATIC-OUT'
```

### 6.7 安全加固（可选）

**当前 `7890` 端口监听 `*:*`（公网可达）**，任何人扫到都能白嫖你的美国代理流量。建议加防火墙限制：

```bash
# 仅允许本机访问 7890
nft add table inet filter 2>/dev/null
nft add chain inet filter input '{ type filter hook input priority 0; }' 2>/dev/null
nft insert rule inet filter input iifname != lo tcp dport 7890 drop
nft list ruleset | grep 7890
```

或者直接在 `config.yaml` 改 mixed-port 只监听本机：
```yaml
mixed-port: 7890
bind-address: 127.0.0.1
```

> 改完后通过 SSH 隧道 `ssh -L 7890:127.0.0.1:7890 root@38.54.88.22` 在本机使用代理。

### 6.8 配置文件位置速查

| 路径 | 用途 |
| --- | --- |
| `/etc/ShellCrash/CrashCore` | mihomo 二进制（31MB） |
| `/etc/ShellCrash/run/config.yaml` | **正式运行配置**（systemd 加载） |
| `/etc/ShellCrash/run/geoip.metadb` | GeoIP 数据库 |
| `/etc/ShellCrash/run/GeoSite.dat` | GeoSite 数据库 |
| `/etc/ShellCrash/yamls/mysub.yaml` | 订阅原始副本（用于回滚参考） |
| `/etc/ShellCrash/yamls/mysub.yaml.bak.*` | 历史备份 |
| `/etc/ShellCrash/configs/providers.cfg` | 订阅元信息 |
| `/etc/ShellCrash/configs/ShellCrash.cfg` | ShellCrash 框架配置 |
| `/etc/systemd/system/shellcrash.service` | systemd 单元 |

---

## 七、CCProxy API 部署（Claude Code 代理）

日服已部署 **ccproxy-api**（`systemd` 服务 `ccproxy`，端口 `8000`），与主站 `130.94.43.100:/opt/ccproxy-api` 同源，但使用**日服自有 Claude 账号**与独立 `auth_token`。

**完整安装、配置、更新与排障说明见：[`deployment-ccproxy.md`](./deployment-ccproxy.md)**

| 项目 | 日服值 |
| --- | --- |
| 项目路径 | `/opt/ccproxy-api` |
| 监听端口 | `8000` |
| 配置文件 | `/root/.config/ccproxy/config.toml` |
| 机密备忘 | `/opt/ccproxy-api/SECRETS.txt`（`chmod 600`） |
| Claude 认证 | `/root/.claude/.credentials.json` |
| 日志 | `journalctl -u ccproxy` |

```bash
# 快速健康检查
curl -sS http://127.0.0.1:8000/health
systemctl status ccproxy
```

---

## 八、注意事项

- 服务器内存仅 1.9 GiB，**严禁在服务器上执行 `docker build`、`go build`、`bun build`**。所有构建必须在本地完成。CCProxy 启动后内存占用约 400MB，与 new-api + PG + Redis 共存时注意观察 `free -h`。
- 本地 Docker Desktop 路径含空格：`"/c/Program Files/Docker/Docker/resources/bin/docker.exe"`，命令中必须用双引号包裹。
- `docker-compose.yml` 中含明文密码，**不要提交到 Git**。可使用 `.env` 文件 + `${VAR}` 引用方式管理，并将 `.env` 加入 `.gitignore`。
- 端口 `3000` 当前直接对外暴露，**生产环境建议配 Nginx 反向代理 + HTTPS（Let's Encrypt）**。
- PostgreSQL/Redis 容器**未对宿主机暴露端口**，仅内部网络访问，安全性较高。
- 数据卷 `./postgres` 直接挂载到宿主机目录，迁移服务器时打包此目录即可。
- 关闭密码登录前务必先验证密钥登录可用；万一锁住自己，通过云厂商控制台 VNC / 串口登录恢复 `/etc/ssh/sshd_config`。
- 服务器登录**仅允许 SSH 密钥**（`PasswordAuthentication no`、`PermitRootLogin prohibit-password`），不再保留任何密码。如需新增运维人员，将其公钥追加到 `/root/.ssh/authorized_keys`。

---

## 八、部署 Checklist

部署前：

- [ ] 本地 `git pull` 拉到最新代码
- [ ] 本地 `go test ./...` 通过
- [ ] 本地 Docker Desktop 资源 ≥ 4 核 / 6 GiB

首次部署：

- [ ] SSH 密钥登录配置完成（公钥已注入服务器）
- [ ] **`PasswordAuthentication no` 已生效**（密码登录已禁用）
- [ ] `ssh -o BatchMode=yes root@38.54.88.22` 可直接登录
- [ ] Docker / docker compose 安装完成
- [ ] `/opt/new-api/{data,logs,postgres,redis}` 已创建
- [ ] `docker-compose.yml` 已上传，敏感信息已填充
- [ ] `SECRETS.txt` 已写入并设置 `chmod 600`
- [ ] `docker compose up -d` 启动成功
- [ ] 本地构建并上传二进制
- [ ] `docker cp` 替换 + `docker restart` 成功
- [ ] `curl http://38.54.88.22:3000` 返回 200
- [ ] 浏览器登录默认管理员账号 → 立即改密码
- [ ] 本地清理 `new-api-binary`

例行更新：

- [ ] 服务器备份当前二进制到 `/opt/new-api/backup/`
- [ ] 本地构建 + 提取 + scp 上传
- [ ] `docker cp` + `docker restart`
- [ ] 验证 `/api/status` 接口
- [ ] 本地清理临时文件

CCProxy 部署（详见 [`deployment-ccproxy.md`](./deployment-ccproxy.md) 第十节 Checklist）：

- [ ] `/opt/ccproxy-api` 已部署且 `ccproxy.service` 运行中
- [ ] `SECRETS.txt` / `config.toml` / 日服自有 `~/.claude` 已配置
- [ ] `curl http://127.0.0.1:8000/health` 与 `/claude/v1/models` 验证通过

代理配置（如需新机部署）：

- [ ] ShellCrash + mihomo 内核安装完成
- [ ] 订阅 yaml 已下载到 `/etc/ShellCrash/yamls/`
- [ ] static-out 节点已追加（`type: http`，**不带 tls**）
- [ ] STATIC-OUT 策略组已建
- [ ] SSH 直连保护规则已加（`IP-CIDR,<SSH_IP>` + `DST-PORT,22`）
- [ ] `tun` 段已追加
- [ ] systemd 单元 `shellcrash.service` 已 `enable --now`
- [ ] `curl https://api.ipify.org` 返回 `70.39.242.6`
- [ ] `curl https://ipinfo.io/json` 显示美国纽约
- [ ] `systemctl restart shellcrash` 后服务能恢复并保持出口 IP
