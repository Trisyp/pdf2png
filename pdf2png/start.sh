#!/bin/bash

# PDF2PNG Docker 启动脚本

IMAGE_NAME="pdf2png"
CONTAINER_NAME="pdf2png-converter"
PORT=2603

echo "=== PDF2PNG Converter ==="

# 检查容器是否已存在
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "停止并删除旧容器..."
    docker rm -f ${CONTAINER_NAME}
fi

# 构建镜像
echo "构建Docker镜像..."
docker build -t ${IMAGE_NAME} .

if [ $? -ne 0 ]; then
    echo "构建失败!"
    exit 1
fi

# 运行容器
echo "启动容器..."
docker run -d \
    -p ${PORT}:${PORT} \
    -v $(pwd)/uploads:/app/uploads \
    -v $(pwd)/outputs:/app/outputs \
    --name ${CONTAINER_NAME} \
    --restart unless-stopped \
    ${IMAGE_NAME}

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 启动成功!"
    echo "📍 访问地址: http://localhost:${PORT}"
    echo ""
    echo "常用命令:"
    echo "  查看日志: docker logs -f ${CONTAINER_NAME}"
    echo "  停止服务: docker stop ${CONTAINER_NAME}"
    echo "  启动服务: docker start ${CONTAINER_NAME}"
else
    echo "❌ 启动失败!"
    exit 1
fi