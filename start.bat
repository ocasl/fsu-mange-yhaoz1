@echo off
chcp 65001 >nul
title FSU设备上线管理系统

echo 🚀 启动FSU设备上线管理系统...
echo.

:: 检查Node.js版本
echo 📋 检查环境...
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ 未安装Node.js，请先安装Node.js 16+版本
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set node_version=%%i
echo ✅ Node.js版本: %node_version%

npm -v >nul 2>&1
if errorlevel 1 (
    echo ❌ npm未找到，请检查Node.js安装
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set npm_version=%%i
echo ✅ npm版本: %npm_version%
echo.

:: 安装依赖
echo 📦 检查并安装依赖...
if not exist node_modules (
    echo 📦 安装根目录依赖...
    npm install
)

if not exist backend\node_modules (
    echo 📦 安装后端依赖...
    cd backend
    npm install
    cd ..
)

if not exist frontend\node_modules (
    echo 📦 安装前端依赖...
    cd frontend
    npm install
    cd ..
)

:: 检查环境变量文件
echo 🔧 检查配置文件...
if not exist backend\.env (
    if exist backend\config.env (
        echo 📝 复制后端环境变量文件...
        copy backend\config.env backend\.env >nul
    ) else (
        echo ⚠️  后端环境变量文件不存在，将使用默认配置
    )
)

if not exist frontend\.env (
    if exist frontend\config.env (
        echo 📝 复制前端环境变量文件...
        copy frontend\config.env frontend\.env >nul
    ) else (
        echo ⚠️  前端环境变量文件不存在，将使用默认配置
    )
)

:: 创建日志目录
echo 📁 创建日志目录...
if not exist backend\logs mkdir backend\logs

:: 检查端口占用
echo 🔍 检查端口占用...
netstat -an | find "3001" | find "LISTENING" >nul
if not errorlevel 1 (
    echo ⚠️  端口 3001 已被占用，请关闭相关进程或修改配置
)

netstat -an | find "3000" | find "LISTENING" >nul
if not errorlevel 1 (
    echo ⚠️  端口 3000 已被占用，请关闭相关进程或修改配置
)

echo.
echo 🚀 启动服务...
echo 📡 启动后端服务 (端口: 3001)...

:: 启动后端服务
cd backend
start "FSU-Backend" npm run dev
cd ..

echo ⏳ 等待后端服务启动...
timeout /t 5 /nobreak >nul

echo ✅ 后端服务启动完成

echo.
echo 🌐 启动前端服务 (端口: 3000)...
echo.
echo 🎉 系统启动完成！
echo 📱 前端地址: http://localhost:3000
echo 🔧 后端地址: http://localhost:3001  
echo 💡 健康检查: http://localhost:3001/api/fsu/health
echo.
echo 按 Ctrl+C 停止前端服务，后端服务请手动关闭窗口
echo ==========================
echo.

cd frontend
npm start

echo.
echo 👋 前端服务已停止
pause
