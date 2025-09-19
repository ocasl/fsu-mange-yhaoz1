# FSU 完整系统 - 使用指南

## 🚀 启动方式

### 方式一：完整 FSU 系统（推荐）

```bash
cd backend
npm run start:fsu
```

包含功能：

- ✅ LOGIN 注册到 SC 服务器
- 💗 心跳保活功能
- 📊 自动心跳统计
- 🔵 设备数据响应
- 📝 完整日志记录

### 方式二：仅设备数据响应

```bash
cd backend
npm run start:device-system
```

仅包含：

- 🔵 设备数据响应功能
- ⚠️ 不包含 LOGIN 注册和心跳保活

## 📋 FSU 设备信息

系统使用真实的 FSU 设备配置：

```
📋 FSU设备信息:
  - FSU ID: 61082143802203
  - FSU Code: 61082143802203
  - 内网IP: 自动检测（VPN/10.x.x.x/192.168.x.x）
  - 网络类型: 4G
  - 软件版本: 1
```

## 🔄 完整工作流程

### 启动过程

1. **IP 检测** - 自动检测 VPN 或内网 IP 地址
2. **WebService 启动** - 启动 FSU WebService 服务器
3. **LOGIN 注册** - 向 SC 服务器注册 FSU 信息
4. **心跳监控** - 开始监控心跳统计
5. **等待请求** - 等待 SC 发送心跳和数据请求

### 运行时行为

1. **SC 发送心跳** - GET_FSUINFO 请求 (Code: 1701)
2. **FSU 响应心跳** - GET_FSUINFO_ACK 响应 (Code: 1702)
3. **SC 请求数据** - GET_DATA 请求 (Code: 401)
4. **FSU 返回数据** - GET_DATA_ACK 响应 (Code: 402)

## 📊 实时监控

### 心跳统计（每 60 秒）

```
📊 [14:30:15] 心跳统计:
   💗 总心跳数: 15
   ✅ 成功: 15
   ❌ 失败: 0
   📈 成功率: 100.0%
   ⏱️  距离上次心跳: 1分30秒
```

### 实时请求响应

```
💓 [心跳] 14:30:15
   结果: ✅ 成功
   FSU ID: 61082143802203
   统计: 总计15, 成功15, 失败0

🔵 [GET_DATA请求] 14:30:45
📍 FSU ID: 61082143802203
📱 设备列表: [{"id":"61080241840279","code":"61080241840279"}]

✅ [GET_DATA_ACK响应] 14:30:45
📍 FSU ID: 61082143802203
📱 设备ID: 61080241840279
```

## 🔧 自定义配置

### 自定义端口和 FSU ID

```bash
# 使用自定义端口
node start-device-test-system.js --heartbeat --port 8090

# 使用自定义FSU ID
node start-device-test-system.js --heartbeat --fsu-id 61089443800204

# 组合配置
node start-device-test-system.js --heartbeat --port 8090 --fsu-id 61089443800204
```

### 查看帮助信息

```bash
node start-device-test-system.js --help
```

## 📝 日志监控

### 启动实时日志监控（新终端窗口）

```bash
cd backend
npm run logs
```

实时显示：

- 🔵 GET_DATA 请求详情
- ✅ GET_DATA_ACK 响应详情
- 💓 心跳请求处理过程
- 💚 心跳响应结果

### 查看历史日志

```bash
# 查看最近20条重要日志
npm run logs:tail

# 查看最近50条日志
node log-viewer.js tail 50
```

## 🧪 测试功能

### 测试所有设备类型

```bash
npm run test:devices
```

### 测试特定设备

```bash
# 测试水浸传感器
node test-device-messages.js device flooding

# 测试温湿度传感器
node test-device-messages.js device temperature

# 测试开关电源
node test-device-messages.js device switchPower
```

### 查看支持的设备

```bash
npm run test:list
```

## 📱 支持的设备类型

| 设备类型       | FSU ID         | 设备 ID        | 描述         |
| -------------- | -------------- | -------------- | ------------ |
| flooding       | 61080243800281 | 61080241840279 | 水浸传感器   |
| temperature    | 61080243800281 | 61080241830309 | 温湿度传感器 |
| switchPower    | 61080243800281 | 61080240600278 | 开关电源     |
| battery        | 61089443800204 | 61089440700375 | 蓄电池       |
| smoke          | 61089443800204 | 61089441820181 | 烟雾传感器   |
| infrared       | 61089443800204 | 61089441810120 | 红外传感器   |
| doorAccess     | 61089443800204 | 61089449900035 | 非智能门禁   |
| stepBattery    | 61089443800204 | 61089444700207 | 梯次电池     |
| airConditioner | 61080243801859 | 61080241501046 | 空调         |

## 🌐 服务端点

启动后可访问的地址：

- **WebService 端点**: `http://内网IP:8080/services/FSUService`
- **心跳端点**: `http://内网IP:8080/invoke`
- **健康检查**: `http://内网IP:8080/health`
- **服务状态**: `http://内网IP:8080/`

## ❓ 常见问题

### Q: 系统启动失败怎么办？

1. 检查端口 8080 是否被占用
2. 确认网络连接正常
3. 查看错误日志：`./logs/error.log`

### Q: LOGIN 注册失败怎么办？

1. 检查 VPN 连接状态
2. 确认 SC 服务器地址正确
3. 验证内网 IP 检测是否正确

### Q: 心跳统计显示失败怎么办？

1. 检查 FSU ID 是否匹配
2. 确认 SC 服务器正常运行
3. 查看详细日志了解失败原因

### Q: 设备数据请求失败怎么办？

1. 检查请求的设备 ID 是否在支持列表中
2. 确认请求格式符合规范
3. 查看实时日志了解具体错误

## 📞 技术支持

如遇问题，请查看：

- 完整日志：`./logs/combined.log`
- 错误日志：`./logs/error.log`
- 详细文档：`设备报文测试说明.md`

---

**🎉 现在您拥有了一个完整的 FSU 系统，包含心跳保活和设备数据响应功能！**
