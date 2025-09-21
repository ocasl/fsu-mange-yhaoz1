@echo off
chcp 65001 >nul
title 公网部署配置 - FSU系统

echo ========================================
echo 🌐 FSU系统公网部署配置
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

:: 设置网络信息
set PUBLIC_IP=49.233.218.18
set PRIVATE_IP=10.2.20.12
set DEPLOY_DIR=C:\FSU-System
set SITE_NAME=FSU-System

echo 📋 网络配置信息:
echo   公网IP: %PUBLIC_IP%
echo   内网IP: %PRIVATE_IP%
echo   部署目录: %DEPLOY_DIR%
echo.

:: 检查基础部署是否完成
if not exist "%DEPLOY_DIR%" (
    echo ❌ 基础部署未完成，请先运行 deploy-windows-server.bat
    pause
    exit /b 1
)

echo ✅ 基础部署检查通过
echo.

:: 第一步：配置公网防火墙规则
echo ========================================
echo 第一步：配置公网防火墙规则
echo ========================================

echo 🗑️  清理旧防火墙规则...
netsh advfirewall firewall delete rule name="FSU-HTTP-Public" >nul 2>&1
netsh advfirewall firewall delete rule name="FSU-HTTPS-Public" >nul 2>&1
netsh advfirewall firewall delete rule name="FSU-Backend-Internal" >nul 2>&1

echo 🌐 配置公网访问规则...

:: HTTP访问 (80端口) - 公网访问
netsh advfirewall firewall add rule name="FSU-HTTP-Public" dir=in action=allow protocol=TCP localport=80 remoteip=any
echo ✅ HTTP端口 80 已开放 (公网访问)

:: HTTPS访问 (443端口) - 公网访问
netsh advfirewall firewall add rule name="FSU-HTTPS-Public" dir=in action=allow protocol=TCP localport=443 remoteip=any
echo ✅ HTTPS端口 443 已开放 (公网访问)

:: 后端API端口 (3001) - 仅限内网访问
netsh advfirewall firewall add rule name="FSU-Backend-Internal" dir=in action=allow protocol=TCP localport=3001 remoteip=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.1
echo ✅ 后端端口 3001 已配置 (仅限内网访问)

echo.

:: 第二步：配置IIS公网绑定
echo ========================================
echo 第二步：配置IIS公网绑定
echo ========================================

echo 🌐 删除现有绑定...
%windir%\system32\inetsrv\appcmd set site "%SITE_NAME%" /-bindings.[protocol='http',bindingInformation='*:80:'] >nul 2>&1

echo 🔗 添加公网IP绑定...
%windir%\system32\inetsrv\appcmd set site "%SITE_NAME%" /+bindings.[protocol='http',bindingInformation='%PUBLIC_IP%:80:']
%windir%\system32\inetsrv\appcmd set site "%SITE_NAME%" /+bindings.[protocol='http',bindingInformation='*:80:']

echo ✅ IIS公网绑定配置完成

echo.

:: 第三步：更新web.config配置
echo ========================================
echo 第三步：更新web.config安全配置
echo ========================================

echo 📝 更新web.config文件...
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<rewrite^>
echo       ^<rules^>
echo         ^<!-- API请求转发到Node.js后端 --^>
echo         ^<rule name="API Proxy" stopProcessing="true"^>
echo           ^<match url="^api/(.*)" /^>
echo           ^<action type="Rewrite" url="http://localhost:3001/api/{R:1}" /^>
echo         ^</rule^>
echo.         
echo         ^<!-- 强制HTTPS重定向 --^>
echo         ^<rule name="HTTP to HTTPS redirect" stopProcessing="true"^>
echo           ^<match url="(.*)" /^>
echo           ^<conditions^>
echo             ^<add input="{HTTPS}" pattern="off" ignoreCase="true" /^>
echo           ^</conditions^>
echo           ^<action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" /^>
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
echo     ^<!-- 安全头设置 --^>
echo     ^<httpProtocol^>
echo       ^<customHeaders^>
echo         ^<add name="X-Frame-Options" value="DENY" /^>
echo         ^<add name="X-Content-Type-Options" value="nosniff" /^>
echo         ^<add name="X-XSS-Protection" value="1; mode=block" /^>
echo         ^<add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" /^>
echo       ^</customHeaders^>
echo     ^</httpProtocol^>
echo.
echo     ^<!-- 请求限制 --^>
echo     ^<security^>
echo       ^<requestFiltering^>
echo         ^<requestLimits maxAllowedContentLength="10485760" /^>
echo       ^</requestFiltering^>
echo     ^</security^>
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

echo ✅ web.config安全配置完成

echo.

:: 第四步：配置IP访问限制（可选）
echo ========================================
echo 第四步：配置访问安全策略
echo ========================================

echo 🔐 是否启用IP访问限制？
echo    1. 不限制（推荐用于测试）
echo    2. 仅允许特定IP访问
echo    3. 仅允许中国大陆IP访问
echo.
set /p security_choice="请选择安全策略 (1-3): "

if "%security_choice%"=="2" (
    echo.
    echo 📝 请输入允许访问的IP地址（多个IP用空格分隔）:
    set /p allowed_ips="允许的IP: "
    
    echo 🔒 配置IP白名单...
    %windir%\system32\inetsrv\appcmd set config "%SITE_NAME%" -section:system.webServer/security/ipSecurity /+"[ipAddress='%allowed_ips%',allowed='true']" /commit:apphost
    echo ✅ IP白名单配置完成
    
) else if "%security_choice%"=="3" (
    echo 🔒 配置地理位置限制...
    echo ⚠️  需要安装IIS地理位置模块，暂时跳过此配置
) else (
    echo ✅ 暂不限制IP访问
)

echo.

:: 第五步：重启IIS服务
echo ========================================
echo 第五步：重启IIS服务
echo ========================================

echo 🔄 重启IIS服务...
iisreset /restart

echo ⏳ 等待IIS重启完成...
timeout /t 5 /nobreak >nul

echo ✅ IIS服务重启完成

echo.

:: 第六步：验证配置
echo ========================================
echo 第六步：验证公网配置
echo ========================================

echo 🔍 测试本地访问...
curl -s http://localhost/ >nul 2>&1
if not errorlevel 1 (
    echo ✅ 本地HTTP访问正常
) else (
    echo ⚠️  本地HTTP访问测试失败
)

echo.
echo 🔍 测试公网IP访问...
curl -s http://%PUBLIC_IP%/ >nul 2>&1
if not errorlevel 1 (
    echo ✅ 公网IP访问正常
) else (
    echo ⚠️  公网IP访问测试失败，请检查防火墙设置
)

echo.

:: 配置完成
echo ========================================
echo 🎉 公网部署配置完成！
echo ========================================
echo.
echo 📋 配置摘要：
echo   🌐 公网访问地址: http://%PUBLIC_IP%/
echo   🔒 HTTPS地址: https://%PUBLIC_IP%/ (需配置SSL证书)
echo   🔧 后端API: 仅限内网访问
echo   🛡️  安全策略: 已启用基础安全配置
echo.
echo 🌐 现在可以通过以下地址访问系统：
echo   📱 前端界面: http://%PUBLIC_IP%/
echo   📊 健康检查: http://%PUBLIC_IP%/api/fsu/health
echo.
echo 📝 下一步建议：
echo   1. 🔐 配置SSL证书启用HTTPS
echo   2. 🌐 配置域名解析
echo   3. 📊 配置监控告警
echo   4. 🛡️  配置CDN加速
echo   5. 💾 配置自动备份
echo.
echo 🔧 管理工具：
echo   system-check.bat    - 系统状态检查
echo   configure-ssl.bat   - SSL证书配置 (待创建)
echo.
echo ⚠️  安全提醒：
echo   - 定期检查访问日志
echo   - 及时更新系统补丁
echo   - 监控异常访问行为
echo   - 定期备份重要数据
echo.

pause
