@echo off
chcp 65001 >nul
title Windows Server 2012 R2 - FSU系统部署脚本

echo ========================================
echo 🚀 FSU设备上线系统 - Windows Server部署
echo ========================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 请以管理员身份运行此脚本！
    echo 右键点击脚本选择"以管理员身份运行"
    pause
    exit /b 1
)

echo ✅ 管理员权限验证通过
echo.

:: 设置部署目录
set DEPLOY_DIR=C:\FSU-System
set CURRENT_DIR=%~dp0

echo 📁 部署目录: %DEPLOY_DIR%
echo 📁 当前目录: %CURRENT_DIR%
echo.

:: 第一步：检查Node.js环境
echo ========================================
echo 第一步：检查Node.js环境
echo ========================================

node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ 未安装Node.js，开始下载安装...
    echo.
    echo 🔗 请手动下载并安装Node.js LTS版本：
    echo    https://nodejs.org/
    echo.
    echo 安装完成后请重新运行此脚本
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node -v') do set node_version=%%i
    echo ✅ Node.js已安装: %node_version%
)

npm -v >nul 2>&1
if errorlevel 1 (
    echo ❌ npm未找到，请检查Node.js安装
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm -v') do set npm_version=%%i
    echo ✅ npm已安装: %npm_version%
)

echo.

:: 第二步：创建部署目录
echo ========================================
echo 第二步：创建部署目录
echo ========================================

if exist "%DEPLOY_DIR%" (
    echo ⚠️  部署目录已存在，是否覆盖？
    set /p choice="输入 Y 继续，N 退出: "
    if /i "%choice%" neq "Y" (
        echo 部署已取消
        pause
        exit /b 0
    )
    echo 🗑️  删除旧部署目录...
    rd /s /q "%DEPLOY_DIR%"
)

echo 📁 创建部署目录: %DEPLOY_DIR%
mkdir "%DEPLOY_DIR%"

echo 📋 复制项目文件...
xcopy "%CURRENT_DIR%*" "%DEPLOY_DIR%\" /E /H /Y

echo ✅ 项目文件复制完成
echo.

:: 第三步：安装依赖
echo ========================================
echo 第三步：安装项目依赖
echo ========================================

cd /d "%DEPLOY_DIR%"

echo 📦 安装根目录依赖...
call npm install
if errorlevel 1 (
    echo ❌ 根目录依赖安装失败
    pause
    exit /b 1
)

echo 📦 安装后端依赖...
cd backend
call npm install
if errorlevel 1 (
    echo ❌ 后端依赖安装失败
    pause
    exit /b 1
)

echo 📦 安装前端依赖...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo ❌ 前端依赖安装失败
    pause
    exit /b 1
)

cd ..
echo ✅ 所有依赖安装完成
echo.

:: 第四步：配置环境变量
echo ========================================
echo 第四步：配置环境变量
echo ========================================

if exist "backend\config.env" (
    echo 📝 复制后端环境变量文件...
    copy "backend\config.env" "backend\.env" >nul
    echo ✅ 后端环境变量配置完成
) else (
    echo ⚠️  后端环境变量模板文件不存在，创建默认配置...
    echo PORT=3001> "backend\.env"
    echo SC_HOST=sn-r.toweraiot.cn>> "backend\.env"
    echo SC_PORT=8080>> "backend\.env"
    echo LOG_LEVEL=info>> "backend\.env"
    echo ✅ 默认后端环境变量创建完成
)

echo 📁 创建日志目录...
if not exist "backend\logs" mkdir "backend\logs"

echo.

:: 第五步：安装PM2
echo ========================================
echo 第五步：安装PM2进程管理器
echo ========================================

pm2 -v >nul 2>&1
if errorlevel 1 (
    echo 📦 安装PM2...
    call npm install -g pm2
    if errorlevel 1 (
        echo ❌ PM2安装失败
        pause
        exit /b 1
    )
    
    call npm install -g pm2-windows-startup
    if errorlevel 1 (
        echo ❌ PM2 Windows服务安装失败
        pause
        exit /b 1
    )
    
    echo ✅ PM2安装完成
) else (
    echo ✅ PM2已安装
)

echo.

:: 第六步：创建PM2配置文件
echo ========================================
echo 第六步：创建PM2配置文件
echo ========================================

echo 📝 创建PM2配置文件...
(
echo module.exports = {
echo   apps: [
echo     {
echo       name: 'fsu-backend',
echo       script: './backend/start.js',
echo       cwd: './backend',
echo       instances: 1,
echo       autorestart: true,
echo       watch: false,
echo       max_memory_restart: '1G',
echo       env: {
echo         NODE_ENV: 'production',
echo         PORT: 3001
echo       },
echo       error_file: './logs/err.log',
echo       out_file: './logs/out.log',
echo       log_file: './logs/combined.log',
echo       time: true
echo     }
echo   ]
echo };
) > ecosystem.config.js

echo ✅ PM2配置文件创建完成
echo.

:: 第七步：构建前端
echo ========================================
echo 第七步：构建生产版本
echo ========================================

echo 🔨 构建前端生产版本...
cd frontend
call npm run build
if errorlevel 1 (
    echo ❌ 前端构建失败
    pause
    exit /b 1
)

cd ..
echo ✅ 前端构建完成
echo.

:: 第八步：配置防火墙
echo ========================================
echo 第八步：配置防火墙规则
echo ========================================

echo 🔥 配置防火墙规则...

:: 删除可能存在的旧规则
netsh advfirewall firewall delete rule name="FSU-HTTP" >nul 2>&1
netsh advfirewall firewall delete rule name="FSU-Backend" >nul 2>&1
netsh advfirewall firewall delete rule name="SC-Server" >nul 2>&1

:: 添加新规则
netsh advfirewall firewall add rule name="FSU-HTTP" dir=in action=allow protocol=TCP localport=80 >nul
netsh advfirewall firewall add rule name="FSU-Backend" dir=in action=allow protocol=TCP localport=3001 >nul
netsh advfirewall firewall add rule name="SC-Server" dir=out action=allow protocol=TCP remoteport=8080 >nul

echo ✅ 防火墙规则配置完成
echo   - HTTP端口 80 已开放
echo   - 后端端口 3001 已开放  
echo   - SC服务器端口 8080 出站已允许
echo.

:: 第九步：启动服务
echo ========================================
echo 第九步：启动服务
echo ========================================

echo 🚀 使用PM2启动后端服务...
call pm2 start ecosystem.config.js
if errorlevel 1 (
    echo ❌ 服务启动失败
    pause
    exit /b 1
)

echo ⏳ 等待服务启动...
timeout /t 5 /nobreak >nul

echo 📊 服务状态检查...
call pm2 status

echo ✅ 后端服务启动完成
echo.

:: 第十步：配置自启动
echo ========================================
echo 第十步：配置服务自启动
echo ========================================

echo 🔧 配置PM2自启动服务...
call pm2-startup install
call pm2 save

echo ✅ 自启动配置完成
echo.

:: 第十一步：测试服务
echo ========================================
echo 第十一步：测试服务
echo ========================================

echo 🔍 测试后端服务...
timeout /t 3 /nobreak >nul

curl http://localhost:3001/api/fsu/health >nul 2>&1
if errorlevel 1 (
    echo ⚠️  后端健康检查未通过，但服务可能仍在启动中
    echo 请稍后手动访问: http://localhost:3001/api/fsu/health
) else (
    echo ✅ 后端服务健康检查通过
)

echo.

:: 部署完成
echo ========================================
echo 🎉 部署完成！
echo ========================================
echo.
echo 📋 部署摘要：
echo   📁 部署目录: %DEPLOY_DIR%
echo   🌐 前端构建: %DEPLOY_DIR%\frontend\build
echo   🔧 后端服务: http://localhost:3001
echo   💡 健康检查: http://localhost:3001/api/fsu/health
echo.
echo 📝 下一步操作：
echo   1. 配置IIS反向代理（参考部署指南）
echo   2. 设置SSL证书（如需要HTTPS）
echo   3. 配置域名和DNS解析
echo   4. 测试完整功能流程
echo.
echo 🔧 常用管理命令：
echo   pm2 status          - 查看服务状态
echo   pm2 logs fsu-backend - 查看服务日志
echo   pm2 restart fsu-backend - 重启服务
echo   pm2 stop fsu-backend    - 停止服务
echo.
echo 📖 详细说明请参考: Windows-Server-2012-R2-部署指南.md
echo.
echo 🎯 现在可以通过配置IIS来提供Web服务
echo.

pause
