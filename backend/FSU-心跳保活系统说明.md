# FSU 心跳保活系统

## 概述

基于中国铁塔动环监控系统 B 接口规范实现的完整心跳保活机制。系统在 LOGIN 成功后自动启动 WebService 服务端，等待 SC 主动发送心跳请求，实现长期稳定的连接保活。

## 心跳架构

### 🔄 工作流程

```
1. FSU → SC: LOGIN请求 (登录注册)
2. SC → FSU: LOGIN_ACK (注册成功)
3. FSU启动WebService服务端 (监听8080端口)
4. SC → FSU: GET_FSUINFO (定期心跳请求)
5. FSU → SC: GET_FSUINFO_ACK (心跳响应)
6. 循环步骤4-5保持连接
```

### 📋 角色分工

- **FSU**: WebService 服务端，被动接收心跳请求
- **SC**: WebService 客户端，主动发送心跳请求
- **频率**: SC 每 60-300 秒发送一次心跳（由 SC 系统配置决定）

## 使用方法

### 🚀 快速启动

```bash
# 进入backend目录
cd backend

# 启动心跳保活系统
node start-heartbeat-system.js
```

### 📊 输出示例

```
🚀 FSU心跳保活系统
==================================================
根据中国铁塔B接口规范实现的完整心跳保活机制

📋 FSU设备信息:
  - FSU ID: 6108214380203
  - FSU Code: 61082143802203
  - 网络类型: 4G
  - 设备版本: 1

🔄 启动心跳保活系统...
✅ 心跳保活系统启动成功！
   FSU ID: 6108214380203
   WebService URL: http://192.168.2.162:8080
   心跳超时: 300秒

📋 系统架构说明:
  1. ✅ LOGIN注册 - FSU向SC注册并获得认证
  2. 🌐 启动WebService - FSU作为服务端等待SC请求
  3. 💗 被动接收心跳 - SC主动发送GET_FSUINFO请求
  4. ✅ 响应心跳 - FSU返回GET_FSUINFO_ACK确认
  5. 🔄 监控重连 - 检测心跳超时并自动重连

💗 系统正在运行，等待SC心跳请求...
按 Ctrl+C 停止系统
```

## 核心组件

### 1. HeartbeatManager (心跳管理器)

**文件**: `services/heartbeatManager.js`

**功能**:

- 完整的 LOGIN → WebService 启动 → 心跳监控流程
- 自动重连机制
- 心跳统计和监控
- 异常处理和恢复

**主要方法**:

```javascript
// 启动心跳保活系统
await heartbeatManager.start(fsuData);

// 停止心跳保活系统
await heartbeatManager.stop();

// 获取系统状态
const status = heartbeatManager.getStatus();

// 获取心跳统计
const stats = heartbeatManager.getHeartbeatStatistics();
```

### 2. FSUWebServiceServer (WebService 服务器)

**文件**: `services/fsuWebServiceServer.js`

**功能**:

- 实现 FSU 作为 WebService 服务端
- 处理 GET_FSUINFO 心跳请求
- 处理 SET_FSUREBOOT 重启请求
- 发出心跳事件供管理器监控

**关键端点**:

- `POST /invoke` - 主要的 SOAP 服务端点
- `GET /health` - 健康检查端点
- `GET /` - 服务状态页面

### 3. 启动工具

**文件**: `start-heartbeat-system.js`

**功能**:

- 一键启动完整心跳保活系统
- 实时状态监控和统计显示
- 优雅停止和资源清理

## 心跳报文格式

### GET_FSUINFO 请求 (SC → FSU)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Request>
  <PK_Type>
    <Name>GET_FSUINFO</Name>
    <Code>1701</Code>
  </PK_Type>
  <Info>
    <FsuId>6108214380203</FsuId>
    <FsuCode>61082143802203</FsuCode>
  </Info>
</Request>
```

### GET_FSUINFO_ACK 响应 (FSU → SC)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <PK_Type>
    <Name>GET_FSUINFO_ACK</Name>
    <Code>1702</Code>
  </PK_Type>
  <Info>
    <FsuId>6108214380203</FsuId>
    <FsuCode>61082143802203</FsuCode>
    <TFSUStatus>
      <CPUUsage>15</CPUUsage>
      <MEMUsage>45</MEMUsage>
    </TFSUStatus>
    <Result>1</Result>
  </Info>
</Response>
```

## 监控和诊断

### 📊 实时状态监控

系统每 60 秒自动显示状态：

```
📊 [11:30:45] 系统状态:
   🔄 运行状态: 正常运行
   💗 心跳统计: 总计15, 成功15, 失败0
   📈 成功率: 100%
   ⏱️  距离上次心跳: 2分钟
```

### 📈 详细统计报告

每 10 分钟显示详细统计：

```
📈 详细统计报告:
========================================
FSU ID: 6108214380203
运行时间: 2小时15分钟30秒
WebService端口: 8080
WebService状态: 运行中

心跳统计:
  总心跳数: 45
  成功心跳: 44
  失败心跳: 1
  成功率: 98%
  最后成功: 2025-01-21 11:28:30
========================================
```

### 🔧 手动测试心跳

```bash
# 使用curl测试心跳接口
curl -X POST http://192.168.2.162:8080/invoke \
  -H "Content-Type: text/xml; charset=utf-8" \
  -H "SOAPAction: invoke" \
  -d '<?xml version="1.0" encoding="UTF-8"?><Request><PK_Type><Name>GET_FSUINFO</Name><Code>1701</Code></PK_Type><Info><FsuId>6108214380203</FsuId><FsuCode>6108214380203</FsuCode></Info></Request>'
```

## 自动重连机制

### 🔄 重连触发条件

1. **心跳超时**: 5 分钟内未收到 SC 心跳请求
2. **WebService 错误**: 服务器发生异常
3. **网络异常**: VPN 连接断开等

### 🛠️ 重连策略

1. **重连延迟**: 第 1 次 30 秒，第 2 次 60 秒，第 3 次 90 秒
2. **最大重试**: 3 次重连尝试
3. **重连流程**: LOGIN → 启动 WebService → 恢复监控
4. **失败处理**: 达到最大重试次数后停止重连

### 📝 重连日志

```
🔄 安排重连 {
  fsuId: "6108214380203",
  attempt: 1,
  delaySeconds: 30
}

🔄 执行心跳重连 {
  fsuId: "6108214380203",
  attempt: 1
}

✅ 心跳重连成功 {
  fsuId: "6108214380203",
  attempt: 1
}
```

## 日志和调试

### 📝 日志文件

- `logs/fsu-interface.log` - FSU 接口调用详细日志
- `logs/fsu-errors.log` - 错误日志
- `logs/combined.log` - 综合日志

### 🔍 调试信息

启动时带有详细的调试信息：

```bash
# 设置日志级别为debug
LOG_LEVEL=debug node start-heartbeat-system.js
```

### 📊 性能监控

系统会自动记录：

- 心跳响应时间
- 成功率统计
- 重连次数
- 系统运行时间

## 配置说明

### 环境变量 (config.env)

```bash
# SC服务器配置
SC_HOST=sn-r.toweraiot.cn
SC_PORT=8080
SC_TIMEOUT=5000

# VPN配置
VPN_SERVER=117.156.97.152
VPN_USER=61082143802203
VPN_PASSWORD=61082143802203

# 日志级别
LOG_LEVEL=info
```

### 心跳管理器配置

```javascript
// 可在heartbeatManager.js中调整的参数
this.webServicePort = 8080; // WebService端口
this.heartbeatTimeout = 300000; // 5分钟心跳超时
this.maxReconnectAttempts = 3; // 最大重连次数
```

## 故障排除

### ❌ 常见问题

1. **LOGIN 失败**

   - 检查 SC 服务器地址和网络连接
   - 确认 VPN 连接正常
   - 验证 FSU ID 和认证信息

2. **WebService 启动失败**

   - 检查端口 8080 是否被占用
   - 确认防火墙设置
   - 查看详细错误日志

3. **心跳超时**

   - 确认 SC 系统是否正常运行
   - 检查网络连通性
   - 验证 FSU ID 匹配

4. **重连失败**
   - 检查 VPN 连接状态
   - 确认 SC 服务器可用性
   - 查看重连日志分析原因

### 🔧 调试步骤

1. **检查网络连接**

   ```bash
   ping sn-r.toweraiot.cn
   telnet sn-r.toweraiot.cn 8080
   ```

2. **测试 LOGIN**

   ```bash
   node test-real-sc-connection.js
   ```

3. **手动测试心跳**

   ```bash
   curl http://192.168.2.162:8080/health
   ```

4. **查看详细日志**
   ```bash
   tail -f logs/fsu-interface.log
   ```

## 最佳实践

### ✅ 推荐配置

1. **生产环境**: 设置合适的心跳超时时间（5-10 分钟）
2. **监控告警**: 监控心跳成功率和重连次数
3. **日志管理**: 定期清理和归档日志文件
4. **网络稳定**: 确保 VPN 连接的稳定性

### 🚫 注意事项

1. **避免频繁重启**: 重连机制会自动处理临时故障
2. **端口冲突**: 确保 8080 端口未被其他服务占用
3. **资源监控**: 长期运行时注意内存和 CPU 使用
4. **时区设置**: 确保系统时间与 SC 服务器同步

---

## 总结

FSU 心跳保活系统提供了完整的、符合规范的心跳保活机制：

✅ **LOGIN 成功** → 您已经实现  
✅ **心跳架构** → 现在可以实现  
✅ **自动重连** → 包含完整的故障恢复  
✅ **监控诊断** → 实时状态和统计  
✅ **日志记录** → 详细的调试信息

现在您可以运行 `node start-heartbeat-system.js` 启动完整的心跳保活系统！
