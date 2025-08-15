#!/bin/bash

# Akuzoi AI LLM Integration 启动脚本

echo "🚀 启动 Akuzoi AI LLM Integration 服务..."

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

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  警告: 未找到.env文件"
    echo "请复制env.example为.env并配置必要的环境变量"
    echo "cp env.example .env"
    echo ""
    echo "需要配置的环境变量:"
    echo "- OAUTH_CLIENT_ID: OAuth客户端ID"
    echo "- OAUTH_CLIENT_SECRET: OAuth客户端密钥"
    echo "- OPENAI_API_KEY: OpenAI API密钥"
    echo "- DB_PASSWORD: MySQL数据库密码"
    echo "- JWT_SECRET: JWT密钥"
    echo ""
    read -p "是否继续启动服务? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 启动取消"
        exit 1
    fi
else
    echo "✅ 环境变量文件已配置"
fi

# 检查数据库连接
echo "🔍 检查数据库连接..."
if command -v mysql &> /dev/null; then
    echo "✅ MySQL客户端已安装"
else
    echo "⚠️  MySQL客户端未安装，请确保MySQL服务正在运行"
fi

# 检查Redis连接
echo "🔍 检查Redis连接..."
if command -v redis-cli &> /dev/null; then
    echo "✅ Redis客户端已安装"
else
    echo "⚠️  Redis客户端未安装，请确保Redis服务正在运行"
fi

# 创建日志目录
if [ ! -d "logs" ]; then
    echo "📁 创建日志目录..."
    mkdir -p logs
fi

# 启动服务
echo "🚀 启动服务..."
if [ "$1" = "dev" ]; then
    echo "开发模式启动..."
    npm run dev
else
    echo "生产模式启动..."
    npm start
fi