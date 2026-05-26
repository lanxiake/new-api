# 生产部署文档

本文档描述 new-api 项目的生产环境部署流程，包括后端 Go 二进制部署、前端 docs-site 部署及验证流程。

## 一、生产环境信息

| 项目 | 值 |
| --- | --- |
| 服务器 IP | `130.94.43.100` |
| SSH 用户 | `root` |
| SSH 密钥 | `~/.ssh/id_rsa` |
| 后端运行方式 | Docker 容器 |
| 容器名 | `new-api` |
| 镜像 | `calciumion/new-api:latest` |
| 文档站点域名 | `docs.llm-link.top` |
| 文档站点托管方式 | Nginx 静态托管 |

> **重要约束**：服务器资源不足，**禁止在服务器上构建**。所有构建必须在本地完成后上传产物替换。

---

## 二、后端部署（Go 二进制）

后端以 Docker 容器形式运行，部署方式是**本地构建二进制 → 上传服务器 → 用 `docker cp` 替换容器内二进制 → 重启容器**，不重新拉取镜像。

### 2.1 本地 Docker 构建

使用 `Dockerfile.build`（基于 Docker Hub 官方镜像）：

```bash
"/c/Program Files/Docker/Docker/resources/bin/docker.exe" \
  build -f Dockerfile.build -t new-api:local-build .
```

> 本地 docker.exe 不在 PATH 中，需使用完整路径：
> `/c/Program Files/Docker/Docker/resources/bin/docker.exe`

### 2.2 从镜像中提取二进制

```bash
TMP="tmp-extract-$$"
"/c/Program Files/Docker/Docker/resources/bin/docker.exe" \
  create --name "$TMP" new-api:local-build
"/c/Program Files/Docker/Docker/resources/bin/docker.exe" \
  cp "$TMP:/new-api" ./new-api-binary
"/c/Program Files/Docker/Docker/resources/bin/docker.exe" \
  rm "$TMP"
```

### 2.3 上传到服务器

```bash
scp -i ~/.ssh/id_rsa ./new-api-binary root@130.94.43.100:/tmp/new-api
```

### 2.4 替换容器二进制并重启

```bash
ssh -i ~/.ssh/id_rsa root@130.94.43.100 \
  "chmod +x /tmp/new-api && \
   docker cp /tmp/new-api new-api:/new-api && \
   docker restart new-api && \
   rm -f /tmp/new-api"
```

### 2.5 清理本地临时文件

```bash
rm -f ./new-api-binary
```

### 2.6 一键脚本（合并版本）

```bash
#!/usr/bin/env bash
set -euo pipefail

DOCKER="/c/Program Files/Docker/Docker/resources/bin/docker.exe"
SERVER="root@130.94.43.100"
KEY="$HOME/.ssh/id_rsa"

# 1. 构建
"$DOCKER" build -f Dockerfile.build -t new-api:local-build .

# 2. 提取
TMP="tmp-extract-$$"
"$DOCKER" create --name "$TMP" new-api:local-build
"$DOCKER" cp "$TMP:/new-api" ./new-api-binary
"$DOCKER" rm "$TMP"

# 3. 上传 + 替换 + 重启
scp -i "$KEY" ./new-api-binary "$SERVER:/tmp/new-api"
ssh -i "$KEY" "$SERVER" \
  "chmod +x /tmp/new-api && docker cp /tmp/new-api new-api:/new-api && docker restart new-api && rm -f /tmp/new-api"

# 4. 清理
rm -f ./new-api-binary
echo "Deploy completed."
```

---

## 三、前端 docs-site 部署

docs-site 是独立的 VitePress 站点（`docs.llm-link.top`），由 Nginx 静态托管，**与后端 Docker 容器无关**。

### 3.1 本地构建

```bash
cd docs-site
bun run build      # 或 npm run build
```

构建产物在 `docs-site/.vitepress/dist/`。

### 3.2 打包并上传

```bash
tar -czf docs-dist.tar.gz -C docs-site/.vitepress/dist .
scp -i ~/.ssh/id_rsa docs-dist.tar.gz root@130.94.43.100:/tmp/
```

### 3.3 服务器解压部署

```bash
ssh -i ~/.ssh/id_rsa root@130.94.43.100 \
  "rm -rf /opt/new-api/docs-site/.vitepress/dist/* && \
   tar -xzf /tmp/docs-dist.tar.gz -C /opt/new-api/docs-site/.vitepress/dist && \
   nginx -s reload && \
   rm -f /tmp/docs-dist.tar.gz"
```

### 3.4 清理本地

```bash
rm -f docs-dist.tar.gz
```

---

## 四、生产验证

部署完成后使用 Playwright 脚本验证生产功能：

```bash
node e2e-prod-verify/verify.mjs
```

脚本位于 `e2e-prod-verify/` 目录，覆盖关键用户流程。

### 健康检查（手动）

```bash
# 容器状态
ssh -i ~/.ssh/id_rsa root@130.94.43.100 "docker ps | grep new-api"

# 容器日志
ssh -i ~/.ssh/id_rsa root@130.94.43.100 "docker logs --tail 100 new-api"

# 文档站点状态
curl -I https://docs.llm-link.top
```

---

## 五、部署清单（Checklist）

部署前：

- [ ] 本地代码已提交并通过 `go build` 编译
- [ ] 数据库迁移已在本地/测试环境验证（SQLite / MySQL / PostgreSQL）
- [ ] 不存在硬编码密钥或敏感信息
- [ ] 已通过 `go test ./...` 单元测试

部署中：

- [ ] 本地 Docker 构建成功
- [ ] 二进制提取无误（文件大小、权限正常）
- [ ] `scp` 上传成功
- [ ] `docker cp` 替换并重启成功
- [ ] 容器状态为 `Up`，日志无 panic

部署后：

- [ ] Playwright 生产验证脚本通过
- [ ] 关键 API 接口返回正常
- [ ] 前端 docs 站点可访问
- [ ] 清理本地临时文件（`new-api-binary`、`docs-dist.tar.gz`）

---

## 六、回滚策略

若部署后发现严重问题：

1. **保留前一版本二进制**：每次部署前在服务器上备份当前容器二进制：

   ```bash
   ssh -i ~/.ssh/id_rsa root@130.94.43.100 \
     "docker cp new-api:/new-api /opt/backup/new-api.$(date +%Y%m%d-%H%M%S)"
   ```

2. **回滚执行**：

   ```bash
   ssh -i ~/.ssh/id_rsa root@130.94.43.100 \
     "docker cp /opt/backup/new-api.<TIMESTAMP> new-api:/new-api && docker restart new-api"
   ```

3. **docs-site 回滚**：保留上一版本 `dist.tar.gz`，重新解压即可。

---

## 七、注意事项

- 所有路径中含空格的命令（如 docker.exe 完整路径）必须用双引号包裹。
- 不要使用 `docker pull` 拉取新镜像方式部署，会丢失本地构建优化。
- `docker restart` 会清空容器内非持久化目录，但 `/new-api` 二进制本身在容器文件系统中，重启后仍生效。
- 服务器磁盘空间有限，定期清理 `/tmp/` 和 `/opt/backup/` 中的旧文件。
- 部署涉及生产数据，操作前确认 SSH 目标服务器无误。
