#!/bin/bash

# Akuzoi AI Web 前端启动脚本

echo "🚀 启动 Akuzoi AI Web 前端..."

# 检查Node.js版本
echo "📋 检查Node.js版本..."
node_version=$(node -v)
echo "当前Node.js版本: $node_version"

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
else
    echo "✅ 依赖包已安装"
fi

# 检查后端服务
echo "🔍 检查后端服务..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ 后端服务运行正常"
else
    echo "⚠️  后端服务未运行，请先启动后端服务"
    echo "   在项目根目录运行: npm run dev"
    echo ""
    read -p "是否继续启动前端服务? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 启动取消"
        exit 1
    fi
fi

# 启动开发服务器
echo "🚀 启动开发服务器..."
echo "前端地址: http://localhost:3001"
echo "API代理: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

npm run dev 