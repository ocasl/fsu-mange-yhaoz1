#!/bin/bash

# FSU设备上线系统启动脚本
echo "🚀 启动FSU设备上线管理系统..."

# 检查Node.js版本
echo "📋 检查环境..."
node_version=$(node -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js版本: $node_version"
else
    echo "❌ 未安装Node.js，请先安装Node.js 16+版本"
    exit 1
fi

# 检查npm版本
npm_version=$(npm -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ npm版本: $npm_version"
else
    echo "❌ npm未找到，请检查Node.js安装"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
if [ ! -d "node_modules" ]; then
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend && npm install && cd ..
fi

# 检查环境变量文件
echo "🔧 检查配置文件..."
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/config.env" ]; then
        echo "📝 复制后端环境变量文件..."
        cp backend/config.env backend/.env
    else
        echo "⚠️  后端环境变量文件不存在，将使用默认配置"
    fi
fi

if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/config.env" ]; then
        echo "📝 复制前端环境变量文件..."
        cp frontend/config.env frontend/.env
    else
        echo "⚠️  前端环境变量文件不存在，将使用默认配置"
    fi
fi

# 创建日志目录
echo "📁 创建日志目录..."
mkdir -p backend/logs

# 检查端口占用
echo "🔍 检查端口占用..."
backend_port=3001
frontend_port=3000

if lsof -Pi :$backend_port -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 $backend_port 已被占用，请关闭相关进程或修改配置"
fi

if lsof -Pi :$frontend_port -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 $frontend_port 已被占用，请关闭相关进程或修改配置"
fi

# 启动服务
echo "🚀 启动服务..."
echo "📡 启动后端服务 (端口: $backend_port)..."

# 在后台启动后端服务
cd backend
npm run dev &
backend_pid=$!
cd ..

# 等待后端服务启动
echo "⏳ 等待后端服务启动..."
sleep 5

# 检查后端服务是否启动成功
if kill -0 $backend_pid 2>/dev/null; then
    echo "✅ 后端服务启动成功 (PID: $backend_pid)"
    
    # 测试后端健康检查
    echo "🔍 测试后端服务..."
    health_check=$(curl -s http://localhost:$backend_port/api/fsu/health 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "✅ 后端服务健康检查通过"
    else
        echo "⚠️  后端服务健康检查失败，但服务可能仍在启动中"
    fi
else
    echo "❌ 后端服务启动失败"
    exit 1
fi

echo "🌐 启动前端服务 (端口: $frontend_port)..."
cd frontend

# 启动前端服务（前台运行）
echo ""
echo "🎉 系统启动完成！"
echo "📱 前端地址: http://localhost:$frontend_port"
echo "🔧 后端地址: http://localhost:$backend_port"
echo "💡 健康检查: http://localhost:$backend_port/api/fsu/health"
echo ""
echo "按 Ctrl+C 停止服务"
echo "=========================="

npm start

# 清理后台进程
echo "🛑 停止后端服务..."
kill $backend_pid 2>/dev/null
echo "👋 服务已停止"
