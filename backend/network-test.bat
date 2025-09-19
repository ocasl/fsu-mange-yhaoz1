@echo off
echo 正在测试192.168.2.1的连通性...
echo.

echo 1. 测试基本连通性:
ping -n 4 192.168.2.1
echo.

echo 2. 测试Web服务:
curl -v --connect-timeout 5 http://192.168.2.1 2>&1
echo.

echo 3. 测试FSU端口:
curl -v --connect-timeout 5 http://192.168.2.1:8080 2>&1
echo.

echo 4. 显示路由信息:
route print | findstr "192.168.2"
echo.

echo 测试完成！请检查上述输出确定问题所在。
pause