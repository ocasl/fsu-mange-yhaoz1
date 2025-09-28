@echo off
echo ========================================
echo    监控管理系统 - 生产环境启动脚本
echo    公网地址: http://49.233.218.18:3000
echo ========================================

echo.
echo [1/4] 检查端口占用...
netstat -ano | findstr :3000
netstat -ano | findstr :3001

echo.
echo [2/4] 启动后端服务 (端口:3001)...
cd backend
start "FSU-Backend" cmd /k "npm start"

timeout /t 3 /nobreak > nul

echo.
echo [3/4] 启动前端服务 (端口:3000)...
cd ../frontend
start "FSU-Frontend" cmd /k "npm start"

echo.
echo [4/4] 服务启动完成！
echo.
echo 🌐 前端访问地址: http://49.233.218.18:3000
echo 🔌 后端API地址:  http://49.233.218.18:3001/api
echo 💓 健康检查:    http://49.233.218.18:3001/api/health
echo.
echo ⚠️  请确保阿里云安全组已开放以下端口:
echo    - 3000 (前端服务)
echo    - 3001 (后端API)
echo.
echo 按任意键关闭此窗口...
pause > nul
