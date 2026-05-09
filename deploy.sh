#!/usr/bin/env bash
# 本地构建 new-api 二进制，scp 上传到服务器并热替换
# 用法: ./deploy.sh <server_user>@<server_host> [remote_container_name]
#
# 示例:
#   ./deploy.sh root@1.2.3.4
#   ./deploy.sh root@1.2.3.4 new-api

set -e

REMOTE="${1:?用法: $0 <user@host> [container_name]}"
CONTAINER="${2:-new-api}"
IMAGE="new-api:local-build"
BINARY_NAME="new-api"
TMP_CONTAINER="tmp-extract-$$"

echo "==> [1/5] 使用 Dockerfile.build 构建镜像 $IMAGE ..."
docker build -f Dockerfile.build -t "$IMAGE" .

echo "==> [2/5] 从镜像中提取二进制 ..."
docker create --name "$TMP_CONTAINER" "$IMAGE" > /dev/null
docker cp "$TMP_CONTAINER:/$BINARY_NAME" "./$BINARY_NAME"
docker rm "$TMP_CONTAINER" > /dev/null

echo "==> [3/5] scp 上传二进制到服务器 $REMOTE ..."
scp -i ~/.ssh/id_rsa "./$BINARY_NAME" "$REMOTE:/tmp/$BINARY_NAME"

echo "==> [4/5] 远程替换容器内二进制并重启 ..."
ssh -i ~/.ssh/id_rsa "$REMOTE" bash <<EOF
set -e
docker cp /tmp/$BINARY_NAME $CONTAINER:/$BINARY_NAME
docker restart $CONTAINER
rm -f /tmp/$BINARY_NAME
EOF

echo "==> [5/5] 清理本地临时文件 ..."
rm -f "./$BINARY_NAME"

echo ""
echo "✓ 部署完成。容器 [$CONTAINER] 已重启。"
echo "  验证: ssh $REMOTE 'docker logs --tail 20 $CONTAINER'"
