#!/usr/bin/env bash
# 部署 VitePress 文档到服务器
# 用法: ./deploy-docs.sh <server_user>@<server_host>
#
# 示例:
#   ./deploy-docs.sh root@1.2.3.4

set -e

REMOTE="${1:?用法: $0 <user@host>}"
DOCS_DIR="/var/www/docs.llm-link.top"

echo "==> [1/3] 构建 VitePress 文档 ..."
npm run build

echo "==> [2/3] 上传到服务器 $REMOTE:$DOCS_DIR ..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  .vitepress/dist/ \
  "$REMOTE:$DOCS_DIR/"

echo "==> [3/3] 设置权限 ..."
ssh "$REMOTE" "chown -R www-data:www-data $DOCS_DIR && chmod -R 755 $DOCS_DIR"

echo ""
echo "✓ 文档部署完成"
echo "  访问: https://docs.llm-link.top"
