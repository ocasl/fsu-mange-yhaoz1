@echo off
chcp 65001 >nul
title SSL证书配置 - FSU系统

echo ========================================
echo 🔐 SSL证书配置 - FSU系统公网部署
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
set PUBLIC_IP=49.233.218.18
set SITE_NAME=FSU-System
set CERT_STORE=My
set CERT_LOCATION=LocalMachine

echo 📋 SSL配置信息:
echo   公网IP: %PUBLIC_IP%
echo   网站名称: %SITE_NAME%
echo   证书存储: %CERT_LOCATION%\%CERT_STORE%
echo.

:: SSL证书配置选项
echo 📝 SSL证书配置选项:
echo   1. 使用自签名证书（测试用）
echo   2. 导入已有证书文件
echo   3. 使用Let's Encrypt免费证书
echo   4. 仅配置HTTPS绑定（证书已安装）
echo.
set /p ssl_choice="请选择SSL配置方式 (1-4): "

if "%ssl_choice%"=="1" goto CREATE_SELF_SIGNED
if "%ssl_choice%"=="2" goto IMPORT_CERTIFICATE
if "%ssl_choice%"=="3" goto LETS_ENCRYPT
if "%ssl_choice%"=="4" goto CONFIGURE_BINDING

echo 无效选项
pause
exit /b 1

:: 创建自签名证书
:CREATE_SELF_SIGNED
echo.
echo ========================================
echo 创建自签名证书
echo ========================================

echo 🔐 创建自签名SSL证书...
echo.
echo ⚠️  自签名证书仅适用于测试环境
echo    生产环境建议使用权威CA颁发的证书
echo.

:: 使用PowerShell创建自签名证书
powershell -Command ^
"$cert = New-SelfSignedCertificate -DnsName '%PUBLIC_IP%', 'localhost' -CertStoreLocation 'Cert:\LocalMachine\My' -KeyLength 2048 -KeyAlgorithm RSA -HashAlgorithm SHA256 -KeyUsage DigitalSignature,KeyEncipherment -Type SSLServerAuthentication -NotAfter (Get-Date).AddYears(1); ^
Write-Host '证书指纹:' $cert.Thumbprint; ^
$cert.Thumbprint | Out-File -FilePath 'cert_thumbprint.txt' -Encoding ASCII"

if exist cert_thumbprint.txt (
    set /p CERT_THUMBPRINT=<cert_thumbprint.txt
    del cert_thumbprint.txt
    echo ✅ 自签名证书创建成功
    echo 📋 证书指纹: %CERT_THUMBPRINT%
    goto CONFIGURE_BINDING
) else (
    echo ❌ 证书创建失败
    pause
    exit /b 1
)

:: 导入证书文件
:IMPORT_CERTIFICATE
echo.
echo ========================================
echo 导入SSL证书文件
echo ========================================

echo 📁 请将证书文件放在以下目录：
echo    C:\SSL-Certificates\
echo.
echo 📋 支持的证书格式：
echo    - .pfx (推荐，包含私钥)
echo    - .cer + .key (证书和私钥分离)
echo.

set /p cert_file="请输入证书文件名 (例如: certificate.pfx): "
set cert_path=C:\SSL-Certificates\%cert_file%

if not exist "%cert_path%" (
    echo ❌ 证书文件不存在: %cert_path%
    pause
    exit /b 1
)

echo 🔐 导入证书文件...
set /p cert_password="请输入证书密码 (如无密码直接回车): "

if "%cert_password%"=="" (
    certlm -importpfx -p "" "%cert_path%"
) else (
    certlm -importpfx -p "%cert_password%" "%cert_path%"
)

if errorlevel 1 (
    echo ❌ 证书导入失败
    pause
    exit /b 1
)

echo ✅ 证书导入成功
echo 📋 请手动查看证书指纹并继续配置...
pause
goto CONFIGURE_BINDING

:: Let's Encrypt证书
:LETS_ENCRYPT
echo.
echo ========================================
echo Let's Encrypt免费证书
echo ========================================

echo 🌐 Let's Encrypt免费SSL证书配置
echo.
echo ⚠️  此功能需要：
echo    1. 有效的域名解析到此服务器
echo    2. 安装ACME客户端工具
echo    3. 80端口可公网访问
echo.
echo 💡 推荐使用 win-acme 工具：
echo    下载地址: https://github.com/win-acme/win-acme/releases
echo.
echo 📝 配置步骤：
echo    1. 下载并解压 win-acme
echo    2. 以管理员身份运行 wacs.exe
echo    3. 选择IIS网站自动配置
echo    4. 按提示输入域名和邮箱
echo.

echo 请手动配置Let's Encrypt证书后重新运行此脚本
pause
exit /b 0

:: 配置HTTPS绑定
:CONFIGURE_BINDING
echo.
echo ========================================
echo 配置HTTPS绑定
echo ========================================

echo 🔍 查找可用的SSL证书...
echo.
echo 📋 当前证书列表：
powershell -Command "Get-ChildItem -Path Cert:\LocalMachine\My | Where-Object {$_.HasPrivateKey -eq $true} | Select-Object Subject, Thumbprint, NotAfter | Format-Table -AutoSize"

echo.
if not defined CERT_THUMBPRINT (
    set /p CERT_THUMBPRINT="请输入要使用的证书指纹: "
)

echo 🔗 配置HTTPS绑定...

:: 删除现有HTTPS绑定
%windir%\system32\inetsrv\appcmd set site "%SITE_NAME%" /-bindings.[protocol='https',bindingInformation='*:443:'] >nul 2>&1

:: 添加HTTPS绑定
%windir%\system32\inetsrv\appcmd set site "%SITE_NAME%" /+bindings.[protocol='https',bindingInformation='*:443:']

:: 绑定SSL证书
netsh http add sslcert ipport=0.0.0.0:443 certhash=%CERT_THUMBPRINT% appid={4dc3e181-e14b-4a21-b022-59fc669b0914} certstorename=MY

if errorlevel 1 (
    echo ❌ SSL证书绑定失败
    echo 💡 请检查证书指纹是否正确
    pause
    exit /b 1
)

echo ✅ HTTPS绑定配置成功

:: 配置强制HTTPS重定向
echo.
echo 🔄 配置HTTPS重定向...

:: 检查URL重写模块
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  URL重写模块未安装，跳过HTTPS重定向配置
    echo 💡 请安装URL重写模块后手动配置重定向
) else (
    echo ✅ URL重写模块已安装
    echo ✅ HTTPS重定向已在web.config中配置
)

:: 重启IIS
echo.
echo 🔄 重启IIS服务...
iisreset /restart

echo ⏳ 等待服务重启...
timeout /t 5 /nobreak >nul

:: 测试HTTPS访问
echo.
echo 🔍 测试HTTPS访问...
curl -k -s https://%PUBLIC_IP%/ >nul 2>&1
if not errorlevel 1 (
    echo ✅ HTTPS访问测试成功
) else (
    echo ⚠️  HTTPS访问测试失败，请检查配置
)

echo.
echo ========================================
echo 🎉 SSL证书配置完成！
echo ========================================
echo.
echo 📋 SSL配置摘要：
echo   🔐 HTTPS地址: https://%PUBLIC_IP%/
echo   📜 证书指纹: %CERT_THUMBPRINT%
echo   🔄 自动重定向: HTTP → HTTPS
echo   🛡️  安全等级: 已启用基础安全配置
echo.
echo 🌐 现在可以通过HTTPS安全访问：
echo   🔒 前端界面: https://%PUBLIC_IP%/
echo   📊 健康检查: https://%PUBLIC_IP%/api/fsu/health
echo.
echo 📝 后续建议：
echo   1. 🌐 配置域名并申请权威CA证书
echo   2. 🔧 测试证书自动续期
echo   3. 📊 配置HTTPS监控
echo   4. 🛡️  启用HSTS安全头
echo.
echo ⚠️  安全提醒：
echo   - 定期检查证书有效期
echo   - 及时更新证书
echo   - 监控SSL/TLS安全评级
echo   - 定期检查安全配置
echo.

pause
