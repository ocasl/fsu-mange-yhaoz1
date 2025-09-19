#!/bin/bash

echo "🚀 启动专用设备测试系统"
echo "================================"
echo "📱 主FSU设备: 61082543800903 (上线注册+保活)"
echo "🌊 水浸传感器: 61082541840888"
echo ""
echo "💡 请确保FSU系统已在8080端口运行"
echo "⏳ 3秒后启动测试..."
sleep 3

node test-specific-devices.js
