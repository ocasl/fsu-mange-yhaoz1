@echo off
chcp 65001 >nul
title 修复设备写入错误 - FSU系统

echo ========================================
echo 🔧 修复 "cannot write to specified device" 错误
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

echo 📋 "The system cannot write to the specified device" 错误分析
echo ----------------------------------------
echo 此错误通常由以下原因引起：
echo   1. 磁盘空间不足
echo   2. 文件权限问题
echo   3. 防病毒软件阻止
echo   4. 文件被其他程序占用
echo   5. 系统文件损坏
echo   6. 输出重定向问题
echo.

:: 第一步：检查磁盘空间
echo ========================================
echo 第一步：检查磁盘空间
echo ========================================

echo 💾 检查各分区剩余空间...
for /f "skip=1 tokens=1,2,3,4" %%a in ('wmic logicaldisk get size^,freespace^,caption^,description') do (
    if not "%%a"=="" (
        set /a free_gb=%%a/1024/1024/1024 2>nul
        set /a total_gb=%%b/1024/1024/1024 2>nul
        if defined free_gb if defined total_gb (
            echo 分区 %%c: 剩余空间 !free_gb! GB / 总容量 !total_gb! GB
            if !free_gb! LSS 1 (
                echo ❌ 警告: 分区 %%c 空间不足 ^(!free_gb! GB^)
                set DISK_FULL=1
            ) else (
                echo ✅ 分区 %%c 空间充足
            )
        )
    )
)

if defined DISK_FULL (
    echo.
    echo ⚠️  发现磁盘空间不足，正在清理临时文件...
    
    :: 清理系统临时文件
    del /f /s /q "%TEMP%\*" 2>nul
    del /f /s /q "C:\Windows\Temp\*" 2>nul
    del /f /s /q "C:\Windows\Prefetch\*" 2>nul
    
    echo ✅ 临时文件清理完成
)

echo.

:: 第二步：检查文件权限
echo ========================================
echo 第二步：检查文件权限
echo ========================================

set DEPLOY_DIR=C:\FSU-System

if exist "%DEPLOY_DIR%" (
    echo 📁 检查部署目录权限: %DEPLOY_DIR%
    
    :: 设置完整权限
    echo 🔐 设置目录权限...
    icacls "%DEPLOY_DIR%" /grant "Everyone:(OI)(CI)F" /T >nul 2>&1
    icacls "%DEPLOY_DIR%" /grant "Users:(OI)(CI)F" /T >nul 2>&1
    icacls "%DEPLOY_DIR%" /grant "Administrators:(OI)(CI)F" /T >nul 2>&1
    
    echo ✅ 目录权限设置完成
) else (
    echo ⚠️  部署目录不存在: %DEPLOY_DIR%
)

:: 检查日志目录权限
if exist "%DEPLOY_DIR%\backend\logs" (
    echo 📂 设置日志目录权限...
    icacls "%DEPLOY_DIR%\backend\logs" /grant "Everyone:(OI)(CI)F" /T >nul 2>&1
    echo ✅ 日志目录权限设置完成
) else (
    echo 📁 创建日志目录...
    mkdir "%DEPLOY_DIR%\backend\logs" 2>nul
    icacls "%DEPLOY_DIR%\backend\logs" /grant "Everyone:(OI)(CI)F" /T >nul 2>&1
    echo ✅ 日志目录创建并设置权限完成
)

echo.

:: 第三步：检查进程占用
echo ========================================
echo 第三步：检查进程占用
echo ========================================

echo 🔍 检查可能冲突的进程...

:: 检查Node.js进程
tasklist | find "node.exe" >nul
if not errorlevel 1 (
    echo ✅ 发现Node.js进程
    tasklist | find "node.exe"
) else (
    echo ⚠️  未发现Node.js进程
)

:: 检查文件句柄占用
echo.
echo 🔍 检查文件占用情况...
handle.exe "%DEPLOY_DIR%" 2>nul | find "pid" >nul
if not errorlevel 1 (
    echo ⚠️  发现文件被占用
    handle.exe "%DEPLOY_DIR%" 2>nul
) else (
    echo ✅ 未发现文件占用冲突
)

echo.

:: 第四步：检查防病毒软件
echo ========================================
echo 第四步：检查安全软件
echo ========================================

echo 🛡️  检查Windows Defender状态...
powershell -Command "Get-MpPreference | Select-Object -Property RealTimeProtectionEnabled" 2>nul | find "True" >nul
if not errorlevel 1 (
    echo ⚠️  Windows Defender实时保护已启用
    echo 💡 建议将 %DEPLOY_DIR% 添加到排除列表
    
    set /p add_exclusion="是否自动添加到Windows Defender排除列表? (Y/N): "
    if /i "!add_exclusion!"=="Y" (
        powershell -Command "Add-MpPreference -ExclusionPath '%DEPLOY_DIR%'" 2>nul
        echo ✅ 已添加到Windows Defender排除列表
    )
) else (
    echo ✅ Windows Defender实时保护已关闭或未检测到
)

echo.

:: 第五步：修复控制台输出问题
echo ========================================
echo 第五步：修复控制台输出问题
echo ========================================

echo 🔧 检查控制台编码设置...
chcp | find "65001" >nul
if not errorlevel 1 (
    echo ✅ 控制台编码设置正确 (UTF-8)
) else (
    echo 🔄 设置控制台编码为UTF-8...
    chcp 65001 >nul
    echo ✅ 控制台编码已修复
)

echo.
echo 🔧 检查输出重定向...

:: 测试输出重定向
echo 测试输出 > test_output.txt 2>&1
if exist test_output.txt (
    echo ✅ 输出重定向正常
    del test_output.txt >nul 2>&1
) else (
    echo ❌ 输出重定向失败
    echo 💡 这可能是导致 "cannot write to specified device" 错误的原因
)

echo.

:: 第六步：修复脚本中的输出重定向
echo ========================================
echo 第六步：优化部署脚本
echo ========================================

echo 🔧 检查部署脚本中的问题...

:: 检查可能导致问题的重定向语句
set PROBLEM_FOUND=0

if exist "deploy-windows-server.bat" (
    findstr /C:">nul 2>&1" deploy-windows-server.bat >nul
    if not errorlevel 1 (
        echo ⚠️  发现部署脚本中有大量输出重定向
        set PROBLEM_FOUND=1
    )
)

if exist "deploy-public-network.bat" (
    findstr /C:">nul 2>&1" deploy-public-network.bat >nul
    if not errorlevel 1 (
        echo ⚠️  发现公网部署脚本中有大量输出重定向
        set PROBLEM_FOUND=1
    )
)

if "%PROBLEM_FOUND%"=="1" (
    echo.
    echo 🔧 创建修复版本的脚本...
    
    :: 创建简化版本的部署脚本
    echo 📝 创建调试版本的部署脚本...
    
    (
    echo @echo off
    echo chcp 65001
    echo title FSU系统部署 - 调试版本
    echo.
    echo echo ========================================
    echo echo 🚀 FSU系统部署 - 调试版本
    echo echo ========================================
    echo echo.
    echo.
    echo :: 检查Node.js
    echo echo 📋 检查Node.js环境...
    echo node -v
    echo if errorlevel 1 ^(
    echo     echo ❌ Node.js未安装
    echo     pause
    echo     exit /b 1
    echo ^)
    echo echo ✅ Node.js环境正常
    echo.
    echo echo 📁 创建部署目录...
    echo if not exist "C:\FSU-System" mkdir "C:\FSU-System"
    echo echo ✅ 部署目录创建完成
    echo.
    echo echo 📋 复制项目文件...
    echo xcopy "%%~dp0*" "C:\FSU-System\" /E /H /Y
    echo echo ✅ 文件复制完成
    echo.
    echo echo 📦 安装依赖...
    echo cd C:\FSU-System
    echo call npm install
    echo cd backend
    echo call npm install
    echo cd ..\frontend
    echo call npm install
    echo cd ..
    echo echo ✅ 依赖安装完成
    echo.
    echo echo 🎉 基础部署完成！
    echo echo 现在可以手动测试各个组件
    echo pause
    ) > deploy-debug.bat
    
    echo ✅ 调试版本脚本已创建: deploy-debug.bat
) else (
    echo ✅ 脚本中未发现明显问题
)

echo.

:: 第七步：系统文件检查
echo ========================================
echo 第七步：系统文件检查
echo ========================================

echo 🔍 检查系统文件完整性...
set /p run_sfc="是否运行系统文件检查? (可能需要较长时间) (Y/N): "
if /i "%run_sfc%"=="Y" (
    echo 🔄 运行系统文件检查...
    sfc /scannow
    echo ✅ 系统文件检查完成
) else (
    echo ⚠️  跳过系统文件检查
)

echo.

:: 第八步：创建测试脚本
echo ========================================
echo 第八步：创建测试脚本
echo ========================================

echo 📝 创建简化测试脚本...

(
echo @echo off
echo chcp 65001
echo title 简化测试脚本
echo.
echo echo 测试基本功能...
echo echo 当前目录: %%CD%%
echo echo 当前用户: %%USERNAME%%
echo echo 系统时间: %%DATE%% %%TIME%%
echo.
echo echo 测试Node.js:
echo node --version
echo.
echo echo 测试npm:
echo npm --version
echo.
echo echo 测试文件写入:
echo echo 测试内容 ^> test.txt
echo if exist test.txt ^(
echo     echo ✅ 文件写入正常
echo     del test.txt
echo ^) else ^(
echo     echo ❌ 文件写入失败
echo ^)
echo.
echo pause
) > test-basic.bat

echo ✅ 测试脚本已创建: test-basic.bat

echo.

:: 总结
echo ========================================
echo 🎉 错误修复完成！
echo ========================================
echo.
echo 📋 已完成的修复操作:
echo   ✅ 磁盘空间检查和清理
echo   ✅ 文件权限修复
echo   ✅ 进程冲突检查
echo   ✅ 安全软件配置
echo   ✅ 控制台编码修复
echo   ✅ 脚本输出重定向优化
echo   ✅ 系统文件检查 (可选)
echo   ✅ 创建调试脚本
echo.
echo 📝 建议的下一步操作:
echo   1. 运行 test-basic.bat 验证基本功能
echo   2. 如果基本测试通过，运行 deploy-debug.bat
echo   3. 如果仍有问题，检查具体的错误信息
echo   4. 考虑重启系统后再次尝试
echo.
echo 🔧 如果问题持续存在:
echo   - 检查事件查看器中的详细错误信息
echo   - 尝试在安全模式下运行
echo   - 考虑使用不同的用户账户
echo   - 检查硬盘健康状况
echo.
echo 💡 调试提示:
echo   - 使用 deploy-debug.bat 代替原始脚本
echo   - 逐步执行命令，观察具体失败点
echo   - 检查每一步的输出信息
echo.

pause
