@echo off
chcp 65001 >nul
title IIS配置脚本 - FSU系统

echo ========================================
echo 🌐 IIS配置脚本 - FSU设备上线系统
echo ========================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 请以管理员身份运行此脚本！
    pause
    exit /b 1
)

echo ✅ 管理员权限验证通过
echo.

:: 设置变量
set DEPLOY_DIR=C:\FSU-System
set SITE_NAME=FSU-System
set SITE_PORT=80
set BACKEND_PORT=3001

:: 检查部署目录
if not exist "%DEPLOY_DIR%" (
    echo ❌ 部署目录不存在: %DEPLOY_DIR%
    echo 请先运行 deploy-windows-server.bat 进行部署
    pause
    exit /b 1
)

if not exist "%DEPLOY_DIR%\frontend\build" (
    echo ❌ 前端构建文件不存在
    echo 请先运行 deploy-windows-server.bat 完成构建
    pause
    exit /b 1
)

echo 📁 部署目录: %DEPLOY_DIR%
echo 🌐 网站名称: %SITE_NAME%
echo 🔗 网站端口: %SITE_PORT%
echo 🔧 后端端口: %BACKEND_PORT%
echo.

:: 第一步：启用IIS功能
echo ========================================
echo 第一步：启用IIS功能
echo ========================================

echo 🔧 启用IIS Web服务器功能...
dism /online /enable-feature /featurename:IIS-WebServerRole /all >nul 2>&1
dism /online /enable-feature /featurename:IIS-WebServer /all >nul 2>&1
dism /online /enable-feature /featurename:IIS-CommonHttpFeatures /all >nul 2>&1
dism /online /enable-feature /featurename:IIS-HttpErrors /all >nul 2>&1
dism /online /enable-feature /featurename:IIS-HttpLogging /all >nul 2>&1
dism /online /enable-feature /featurename:IIS-StaticContent /all >nul 2>&1
dism /online /enable-feature /featurename:IIS-DefaultDocument /all >nul 2>&1
dism /online /enable-feature /featurename:IIS-DirectoryBrowsing /all >nul 2>&1
dism /online /enable-feature /featurename:IIS-ASPNET45 /all >nul 2>&1

echo ✅ IIS基础功能启用完成
echo.

:: 第二步：检查和下载URL重写模块
echo ========================================
echo 第二步：配置URL重写模块
echo ========================================

echo 🔍 检查URL重写模块...
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite" >nul 2>&1
if errorlevel 1 (
    echo ❌ URL重写模块未安装
    echo.
    echo 📥 需要手动下载并安装以下模块：
    echo    1. URL Rewrite Module 2.1
    echo       https://www.iis.net/downloads/microsoft/url-rewrite
    echo.
    echo    2. Application Request Routing 3.0
    echo       https://www.iis.net/downloads/microsoft/application-request-routing
    echo.
    echo 安装完成后请重新运行此脚本
    pause
    exit /b 1
) else (
    echo ✅ URL重写模块已安装
)

echo.

:: 第三步：停止默认网站
echo ========================================
echo 第三步：配置IIS网站
echo ========================================

echo 🛑 停止默认网站...
%windir%\system32\inetsrv\appcmd stop site "Default Web Site" >nul 2>&1

:: 删除可能存在的同名网站
echo 🗑️  删除可能存在的同名网站...
%windir%\system32\inetsrv\appcmd delete site "%SITE_NAME%" >nul 2>&1

echo 🌐 创建新网站...
%windir%\system32\inetsrv\appcmd add site /name:"%SITE_NAME%" /physicalPath:"%DEPLOY_DIR%\frontend\build" /bindings:http/*:%SITE_PORT%:

if errorlevel 1 (
    echo ❌ 网站创建失败
    pause
    exit /b 1
)

echo ✅ 网站创建成功
echo.

:: 第四步：配置应用程序池
echo ========================================
echo 第四步：配置应用程序池
echo ========================================

echo 🔧 配置应用程序池...
%windir%\system32\inetsrv\appcmd set apppool "%SITE_NAME%" /processModel.identityType:ApplicationPoolIdentity >nul 2>&1
%windir%\system32\inetsrv\appcmd set apppool "%SITE_NAME%" /recycling.periodicRestart.time:00:00:00 >nul 2>&1
%windir%\system32\inetsrv\appcmd set apppool "%SITE_NAME%" /processModel.idleTimeout:00:00:00 >nul 2>&1

echo ✅ 应用程序池配置完成
echo.

:: 第五步：创建web.config文件
echo ========================================
echo 第五步：创建web.config配置文件
echo ========================================

echo 📝 创建web.config文件...
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<rewrite^>
echo       ^<rules^>
echo         ^<!-- API请求转发到Node.js后端 --^>
echo         ^<rule name="API Proxy" stopProcessing="true"^>
echo           ^<match url="^api/(.*)" /^>
echo           ^<action type="Rewrite" url="http://localhost:%BACKEND_PORT%/api/{R:1}" /^>
echo         ^</rule^>
echo.         
echo         ^<!-- 静态资源处理 --^>
echo         ^<rule name="Static Assets" stopProcessing="true"^>
echo           ^<match url="^(static|images|css|js)/.*" /^>
echo           ^<action type="None" /^>
echo         ^</rule^>
echo.
echo         ^<!-- React路由支持 --^>
echo         ^<rule name="React Router" stopProcessing="true"^>
echo           ^<match url=".*" /^>
echo           ^<conditions logicalGrouping="MatchAll"^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" /^>
echo           ^</conditions^>
echo           ^<action type="Rewrite" url="/index.html" /^>
echo         ^</rule^>
echo       ^</rules^>
echo     ^</rewrite^>
echo.
echo     ^<!-- 默认文档设置 --^>
echo     ^<defaultDocument^>
echo       ^<files^>
echo         ^<clear /^>
echo         ^<add value="index.html" /^>
echo       ^</files^>
echo     ^</defaultDocument^>
echo.
echo     ^<!-- MIME类型设置 --^>
echo     ^<staticContent^>
echo       ^<mimeMap fileExtension=".json" mimeType="application/json" /^>
echo       ^<mimeMap fileExtension=".woff" mimeType="font/woff" /^>
echo       ^<mimeMap fileExtension=".woff2" mimeType="font/woff2" /^>
echo     ^</staticContent^>
echo.
echo     ^<!-- 错误页面 --^>
echo     ^<httpErrors errorMode="Custom"^>
echo       ^<remove statusCode="404" subStatusCode="-1" /^>
echo       ^<error statusCode="404" path="/index.html" responseMode="ExecuteURL" /^>
echo     ^</httpErrors^>
echo   ^</system.webServer^>
echo ^</configuration^>
) > "%DEPLOY_DIR%\frontend\build\web.config"

echo ✅ web.config文件创建完成
echo.

:: 第六步：启用ARR代理
echo ========================================
echo 第六步：启用ARR代理功能
echo ========================================

echo 🔧 启用ARR代理功能...
%windir%\system32\inetsrv\appcmd set config -section:system.webServer/proxy /enabled:"True" >nul 2>&1

if errorlevel 1 (
    echo ⚠️  ARR代理功能启用可能失败，请确保已安装Application Request Routing
) else (
    echo ✅ ARR代理功能启用成功
)

echo.

:: 第七步：设置权限
echo ========================================
echo 第七步：设置文件夹权限
echo ========================================

echo 🔐 设置文件夹权限...
icacls "%DEPLOY_DIR%\frontend\build" /grant "IIS_IUSRS:(OI)(CI)R" >nul 2>&1
icacls "%DEPLOY_DIR%\frontend\build" /grant "IUSR:(OI)(CI)R" >nul 2>&1

echo ✅ 权限设置完成
echo.

:: 第八步：启动网站
echo ========================================
echo 第八步：启动网站
echo ========================================

echo 🚀 启动网站...
%windir%\system32\inetsrv\appcmd start site "%SITE_NAME%"

if errorlevel 1 (
    echo ❌ 网站启动失败
    pause
    exit /b 1
)

echo ✅ 网站启动成功
echo.

:: 第九步：测试配置
echo ========================================
echo 第九步：测试配置
echo ========================================

echo 🔍 测试后端服务连接...
curl http://localhost:%BACKEND_PORT%/api/fsu/health >nul 2>&1
if errorlevel 1 (
    echo ⚠️  后端服务未启动，请先启动后端服务
    echo     cd %DEPLOY_DIR%
    echo     pm2 start ecosystem.config.js
) else (
    echo ✅ 后端服务连接正常
)

echo.
echo 🔍 测试前端页面...
curl http://localhost:%SITE_PORT% >nul 2>&1
if errorlevel 1 (
    echo ⚠️  前端页面访问可能有问题
) else (
    echo ✅ 前端页面访问正常
)

echo.

:: 配置完成
echo ========================================
echo 🎉 IIS配置完成！
echo ========================================
echo.
echo 📋 配置摘要：
echo   🌐 网站名称: %SITE_NAME%
echo   📁 物理路径: %DEPLOY_DIR%\frontend\build
echo   🔗 访问地址: http://localhost:%SITE_PORT%
echo   🔧 后端代理: http://localhost:%BACKEND_PORT%
echo.
echo 🌐 现在可以通过以下地址访问系统：
echo   前端界面: http://localhost:%SITE_PORT%
echo   或者: http://服务器IP:%SITE_PORT%
echo.
echo 📝 下一步操作：
echo   1. 配置防火墙开放端口 %SITE_PORT%
echo   2. 设置DNS解析指向服务器IP
echo   3. 配置SSL证书（如需要HTTPS）
echo   4. 测试完整功能流程
echo.
echo 🔧 常用IIS管理命令：
echo   iisreset                    - 重启IIS
echo   appcmd list sites           - 查看所有网站
echo   appcmd stop site "%SITE_NAME%"  - 停止网站
echo   appcmd start site "%SITE_NAME%" - 启动网站
echo.
echo 📖 详细配置说明请参考: Windows-Server-2012-R2-部署指南.md
echo.

pause
