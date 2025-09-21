@echo off
chcp 65001 >nul
title 系统检查和维护工具 - FSU系统

echo ========================================
echo 🔍 FSU系统检查和维护工具
echo ========================================
echo.

:: 设置变量
set DEPLOY_DIR=C:\FSU-System
set SITE_NAME=FSU-System
set BACKEND_PORT=3001
set FRONTEND_PORT=80

:: 主菜单
:MAIN_MENU
cls
echo ========================================
echo 🔧 FSU系统管理工具
echo ========================================
echo.
echo 请选择要执行的操作：
echo.
echo 1. 🔍 系统状态检查
echo 2. 📊 服务状态检查
echo 3. 🔄 重启所有服务
echo 4. 📁 查看日志
echo 5. 🧹 清理日志
echo 6. 🔧 系统诊断
echo 7. 📈 性能监控
echo 8. 🚀 更新部署
echo 9. 🌐 公网访问检查
echo 0. ❌ 退出
echo.
set /p choice="请输入选项 (0-9): "

if "%choice%"=="1" goto CHECK_SYSTEM
if "%choice%"=="2" goto CHECK_SERVICES
if "%choice%"=="3" goto RESTART_SERVICES
if "%choice%"=="4" goto VIEW_LOGS
if "%choice%"=="5" goto CLEAN_LOGS
if "%choice%"=="6" goto DIAGNOSE_SYSTEM
if "%choice%"=="7" goto MONITOR_PERFORMANCE
if "%choice%"=="8" goto UPDATE_DEPLOYMENT
if "%choice%"=="9" goto CHECK_PUBLIC_ACCESS
if "%choice%"=="0" goto EXIT_SCRIPT

echo 无效选项，请重新选择
pause
goto MAIN_MENU

:: 系统状态检查
:CHECK_SYSTEM
cls
echo ========================================
echo 🔍 系统状态检查
echo ========================================
echo.

echo 📋 基础环境检查
echo ----------------------------------------

:: 检查Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js: 未安装
) else (
    for /f "tokens=*" %%i in ('node -v') do echo ✅ Node.js: %%i
)

:: 检查npm
npm -v >nul 2>&1
if errorlevel 1 (
    echo ❌ npm: 未安装
) else (
    for /f "tokens=*" %%i in ('npm -v') do echo ✅ npm: %%i
)

:: 检查PM2
pm2 -v >nul 2>&1
if errorlevel 1 (
    echo ❌ PM2: 未安装
) else (
    for /f "tokens=*" %%i in ('pm2 -v') do echo ✅ PM2: %%i
)

echo.
echo 📁 部署目录检查
echo ----------------------------------------

if exist "%DEPLOY_DIR%" (
    echo ✅ 部署目录: %DEPLOY_DIR% [存在]
) else (
    echo ❌ 部署目录: %DEPLOY_DIR% [不存在]
    goto CHECK_SYSTEM_END
)

if exist "%DEPLOY_DIR%\backend" (
    echo ✅ 后端目录: [存在]
) else (
    echo ❌ 后端目录: [不存在]
)

if exist "%DEPLOY_DIR%\frontend\build" (
    echo ✅ 前端构建: [存在]
) else (
    echo ❌ 前端构建: [不存在]
)

if exist "%DEPLOY_DIR%\ecosystem.config.js" (
    echo ✅ PM2配置: [存在]
) else (
    echo ❌ PM2配置: [不存在]
)

echo.
echo 🌐 网络连接检查
echo ----------------------------------------

:: 检查端口占用
netstat -an | find ":%BACKEND_PORT%" | find "LISTENING" >nul
if not errorlevel 1 (
    echo ✅ 后端端口 %BACKEND_PORT%: [正在监听]
) else (
    echo ❌ 后端端口 %BACKEND_PORT%: [未监听]
)

netstat -an | find ":%FRONTEND_PORT%" | find "LISTENING" >nul
if not errorlevel 1 (
    echo ✅ 前端端口 %FRONTEND_PORT%: [正在监听]
) else (
    echo ❌ 前端端口 %FRONTEND_PORT%: [未监听]
)

:: 测试SC服务器连接
echo 🔍 测试SC服务器连接...
ping sn-r.toweraiot.cn -n 2 >nul 2>&1
if not errorlevel 1 (
    echo ✅ SC服务器连通性: [正常]
) else (
    echo ❌ SC服务器连通性: [失败]
)

:CHECK_SYSTEM_END
echo.
pause
goto MAIN_MENU

:: 服务状态检查
:CHECK_SERVICES
cls
echo ========================================
echo 📊 服务状态检查
echo ========================================
echo.

echo 🔧 PM2服务状态
echo ----------------------------------------
pm2 status 2>nul
if errorlevel 1 (
    echo ❌ PM2服务未运行或未配置
) else (
    echo ✅ PM2服务状态如上所示
)

echo.
echo 🌐 IIS服务状态  
echo ----------------------------------------
sc query W3SVC | find "STATE" | find "RUNNING" >nul
if not errorlevel 1 (
    echo ✅ IIS Web服务: [运行中]
) else (
    echo ❌ IIS Web服务: [未运行]
)

%windir%\system32\inetsrv\appcmd list sites | find "%SITE_NAME%" >nul 2>&1
if not errorlevel 1 (
    echo ✅ FSU网站: [已配置]
    %windir%\system32\inetsrv\appcmd list sites | find "%SITE_NAME%"
) else (
    echo ❌ FSU网站: [未配置]
)

echo.
echo 🔍 服务健康检查
echo ----------------------------------------

:: 测试后端API
curl -s http://localhost:%BACKEND_PORT%/api/fsu/health >nul 2>&1
if not errorlevel 1 (
    echo ✅ 后端API健康检查: [通过]
) else (
    echo ❌ 后端API健康检查: [失败]
)

:: 测试前端页面
curl -s http://localhost:%FRONTEND_PORT% >nul 2>&1
if not errorlevel 1 (
    echo ✅ 前端页面访问: [正常]
) else (
    echo ❌ 前端页面访问: [失败]
)

echo.
pause
goto MAIN_MENU

:: 重启所有服务
:RESTART_SERVICES
cls
echo ========================================
echo 🔄 重启所有服务
echo ========================================
echo.

echo ⚠️  即将重启所有服务，这可能会中断正在进行的操作
set /p confirm="确认重启？(Y/N): "
if /i "%confirm%" neq "Y" goto MAIN_MENU

echo.
echo 🛑 停止PM2服务...
cd /d "%DEPLOY_DIR%"
pm2 stop all
pm2 delete all

echo 🛑 重启IIS...
iisreset /restart

echo ⏳ 等待IIS重启完成...
timeout /t 5 /nobreak >nul

echo 🚀 重新启动PM2服务...
pm2 start ecosystem.config.js
pm2 save

echo ⏳ 等待服务启动...
timeout /t 10 /nobreak >nul

echo 🔍 检查服务状态...
pm2 status

echo.
echo ✅ 服务重启完成
echo.
pause
goto MAIN_MENU

:: 查看日志
:VIEW_LOGS
cls
echo ========================================
echo 📁 查看日志
echo ========================================
echo.

echo 请选择要查看的日志：
echo.
echo 1. 📊 PM2服务日志
echo 2. 📝 后端应用日志
echo 3. 🌐 IIS访问日志
echo 4. ❌ IIS错误日志
echo 5. 🔙 返回主菜单
echo.
set /p log_choice="请输入选项 (1-5): "

if "%log_choice%"=="1" goto VIEW_PM2_LOGS
if "%log_choice%"=="2" goto VIEW_BACKEND_LOGS
if "%log_choice%"=="3" goto VIEW_IIS_ACCESS_LOGS
if "%log_choice%"=="4" goto VIEW_IIS_ERROR_LOGS
if "%log_choice%"=="5" goto MAIN_MENU

echo 无效选项
pause
goto VIEW_LOGS

:VIEW_PM2_LOGS
echo.
echo 📊 PM2服务日志 (最近50行)
echo ----------------------------------------
pm2 logs --lines 50
pause
goto VIEW_LOGS

:VIEW_BACKEND_LOGS
echo.
echo 📝 后端应用日志 (最近50行)
echo ----------------------------------------
if exist "%DEPLOY_DIR%\backend\logs\combined.log" (
    powershell "Get-Content '%DEPLOY_DIR%\backend\logs\combined.log' -Tail 50"
) else (
    echo 日志文件不存在
)
pause
goto VIEW_LOGS

:VIEW_IIS_ACCESS_LOGS
echo.
echo 🌐 IIS访问日志 (最近20行)
echo ----------------------------------------
for /f %%a in ('dir /b /od "%SystemDrive%\inetpub\logs\LogFiles\W3SVC*\*.log" 2^>nul ^| tail -1') do (
    powershell "Get-Content '%SystemDrive%\inetpub\logs\LogFiles\W3SVC*\%%a' -Tail 20"
)
pause
goto VIEW_LOGS

:VIEW_IIS_ERROR_LOGS
echo.
echo ❌ IIS错误日志
echo ----------------------------------------
if exist "%SystemDrive%\inetpub\logs\FailedReqLogFiles" (
    dir /b "%SystemDrive%\inetpub\logs\FailedReqLogFiles\*"
) else (
    echo 无错误日志文件
)
pause
goto VIEW_LOGS

:: 清理日志
:CLEAN_LOGS
cls
echo ========================================
echo 🧹 清理日志
echo ========================================
echo.

echo ⚠️  即将清理以下日志文件：
echo   - 后端应用日志 (保留最近7天)
echo   - PM2日志文件
echo   - IIS日志文件 (保留最近30天)
echo.
set /p clean_confirm="确认清理？(Y/N): "
if /i "%clean_confirm%" neq "Y" goto MAIN_MENU

echo.
echo 🧹 清理后端日志...
if exist "%DEPLOY_DIR%\backend\logs" (
    forfiles /p "%DEPLOY_DIR%\backend\logs" /s /m *.log /d -7 /c "cmd /c del @path" 2>nul
    echo ✅ 后端日志清理完成
) else (
    echo ⚠️  后端日志目录不存在
)

echo 🧹 清理PM2日志...
pm2 flush

echo 🧹 清理IIS日志...
forfiles /p "%SystemDrive%\inetpub\logs\LogFiles" /s /m *.log /d -30 /c "cmd /c del @path" 2>nul

echo.
echo ✅ 日志清理完成
echo.
pause
goto MAIN_MENU

:: 系统诊断
:DIAGNOSE_SYSTEM
cls
echo ========================================
echo 🔧 系统诊断
echo ========================================
echo.

echo 🔍 诊断系统问题...
echo.

echo 📊 内存使用情况
echo ----------------------------------------
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /format:list | find "="

echo.
echo 💾 磁盘空间检查
echo ----------------------------------------
wmic logicaldisk get size,freespace,caption /format:list | find "="

echo.
echo 🌐 网络连接诊断
echo ----------------------------------------
echo 检查关键端口...
netstat -an | find "LISTENING" | find ":%BACKEND_PORT%"
netstat -an | find "LISTENING" | find ":%FRONTEND_PORT%"

echo.
echo 检查DNS解析...
nslookup sn-r.toweraiot.cn

echo.
echo 🔥 防火墙规则检查
echo ----------------------------------------
netsh advfirewall firewall show rule name="FSU-HTTP" dir=in
netsh advfirewall firewall show rule name="FSU-Backend" dir=in

echo.
echo 📋 进程检查
echo ----------------------------------------
echo Node.js进程:
tasklist | find "node.exe"

echo.
echo IIS工作进程:
tasklist | find "w3wp.exe"

echo.
pause
goto MAIN_MENU

:: 性能监控
:MONITOR_PERFORMANCE
cls
echo ========================================
echo 📈 性能监控
echo ========================================
echo.

echo 🔍 实时性能监控 (按Ctrl+C停止)
echo ----------------------------------------
echo.

echo CPU使用率:
wmic cpu get loadpercentage /value | find "LoadPercentage"

echo.
echo 内存使用情况:
for /f "skip=1" %%p in ('wmic os get freephysicalmemory^,totalvisiblememorysize /format:value') do for /f "tokens=1,2 delims==" %%a in ("%%p") do if "%%a"=="FreePhysicalMemory" set free=%%b& if "%%a"=="TotalVisibleMemorySize" set total=%%b
if defined free if defined total (
    set /a used=total-free
    set /a percent=used*100/total
    echo 已用内存: %percent%%%
)

echo.
echo 🌐 网络连接数:
netstat -an | find "ESTABLISHED" | find /c ":%BACKEND_PORT%"

echo.
echo 📊 PM2进程监控:
pm2 monit

pause
goto MAIN_MENU

:: 更新部署
:UPDATE_DEPLOYMENT
cls
echo ========================================
echo 🚀 更新部署
echo ========================================
echo.

echo ⚠️  即将执行更新部署操作
echo    这将停止服务、更新代码、重新构建并重启服务
echo.
set /p update_confirm="确认更新？(Y/N): "
if /i "%update_confirm%" neq "Y" goto MAIN_MENU

echo.
echo 🛑 停止服务...
cd /d "%DEPLOY_DIR%"
pm2 stop all

echo 📦 更新依赖...
call npm install
cd backend && call npm install && cd ..
cd frontend && call npm install && cd ..

echo 🔨 重新构建前端...
cd frontend
call npm run build
cd ..

echo 🚀 重启服务...
pm2 restart all

echo ⏳ 等待服务启动...
timeout /t 10 /nobreak >nul

echo 🔍 验证更新...
pm2 status

echo.
echo ✅ 更新部署完成
echo.
pause
goto MAIN_MENU

:: 公网访问检查
:CHECK_PUBLIC_ACCESS
cls
echo ========================================
echo 🌐 公网访问检查
echo ========================================
echo.

set PUBLIC_IP=49.233.218.18

echo 📋 网络配置检查
echo ----------------------------------------

:: 检查网络接口
echo 🔍 检查网络接口配置...
ipconfig | find "%PUBLIC_IP%" >nul
if not errorlevel 1 (
    echo ✅ 公网IP配置: %PUBLIC_IP% [已配置]
) else (
    echo ⚠️  公网IP配置: %PUBLIC_IP% [未在本机找到]
)

echo.
echo 🔥 防火墙规则检查
echo ----------------------------------------

:: 检查HTTP端口
netsh advfirewall firewall show rule name="FSU-HTTP-Public" | find "启用" >nul
if not errorlevel 1 (
    echo ✅ HTTP端口 (80): [已开放]
) else (
    echo ❌ HTTP端口 (80): [未开放]
)

:: 检查HTTPS端口
netsh advfirewall firewall show rule name="FSU-HTTPS-Public" | find "启用" >nul
if not errorlevel 1 (
    echo ✅ HTTPS端口 (443): [已开放]
) else (
    echo ❌ HTTPS端口 (443): [未开放]
)

echo.
echo 🌐 IIS网站绑定检查
echo ----------------------------------------

:: 检查IIS网站绑定
%windir%\system32\inetsrv\appcmd list sites | find "FSU-System" >nul
if not errorlevel 1 (
    echo ✅ FSU网站: [已配置]
    %windir%\system32\inetsrv\appcmd list sites | find "FSU-System"
) else (
    echo ❌ FSU网站: [未配置]
)

echo.
echo 🔐 SSL证书检查
echo ----------------------------------------

:: 检查SSL证书绑定
netsh http show sslcert ipport=0.0.0.0:443 >nul 2>&1
if not errorlevel 1 (
    echo ✅ SSL证书: [已绑定]
    netsh http show sslcert ipport=0.0.0.0:443 | find "证书哈希"
) else (
    echo ⚠️  SSL证书: [未绑定]
)

echo.
echo 🔍 公网连通性测试
echo ----------------------------------------

echo 🌐 测试公网HTTP访问...
curl -s --connect-timeout 5 http://%PUBLIC_IP%/ >nul 2>&1
if not errorlevel 1 (
    echo ✅ 公网HTTP访问: [正常]
) else (
    echo ❌ 公网HTTP访问: [失败]
    echo    可能原因: 防火墙阻挡、IIS未启动、网络问题
)

echo 🔒 测试公网HTTPS访问...
curl -k -s --connect-timeout 5 https://%PUBLIC_IP%/ >nul 2>&1
if not errorlevel 1 (
    echo ✅ 公网HTTPS访问: [正常]
) else (
    echo ❌ 公网HTTPS访问: [失败]
    echo    可能原因: SSL证书未配置、HTTPS端口未开放
)

echo 📊 测试API健康检查...
curl -s --connect-timeout 5 http://%PUBLIC_IP%/api/fsu/health >nul 2>&1
if not errorlevel 1 (
    echo ✅ API健康检查: [正常]
) else (
    echo ❌ API健康检查: [失败]
    echo    可能原因: 后端服务未启动、代理配置错误
)

echo.
echo 🌍 外部访问测试
echo ----------------------------------------

echo 💡 建议使用以下工具进行外部访问测试:
echo    - 在线网站监测: https://www.17ce.com/
echo    - 端口检测: https://tool.chinaz.com/port/
echo    - SSL检测: https://www.ssllabs.com/ssltest/
echo.

echo 📱 公网访问地址:
echo    HTTP:  http://%PUBLIC_IP%/
echo    HTTPS: https://%PUBLIC_IP%/
echo    API:   http://%PUBLIC_IP%/api/fsu/health
echo.

echo 🔧 如有问题，请检查:
echo    1. 防火墙规则是否正确配置
echo    2. IIS网站是否正常运行
echo    3. 云服务器安全组是否开放相应端口
echo    4. SSL证书是否正确安装
echo.

pause
goto MAIN_MENU

:: 退出脚本
:EXIT_SCRIPT
echo.
echo 👋 感谢使用FSU系统管理工具
exit /b 0
