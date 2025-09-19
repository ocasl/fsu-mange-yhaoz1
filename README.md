# FSU 设备上线管理系统

一个专为 FSU（Field Service Unit）设备上线管理打造的 Web 系统，支持设备信息录入、自动构造 SC 协议报文、设备注册状态跟踪等功能。

## 🚀 系统特性

- **用户友好界面**: 基于 React + Ant Design 的现代化 UI
- **智能表单验证**: 前后端双重参数校验，确保数据准确性
- **实时状态监控**: SC 服务器连接状态实时检测
- **历史记录管理**: 完整的设备注册历史记录和状态跟踪
- **协议自动构造**: 自动构造符合 SC 协议的 XML 注册报文
- **错误重试机制**: 网络异常时自动重试，提高成功率
- **详细日志记录**: 完整的操作日志，便于问题排查

## 📋 系统架构

```
用户界面 → 前端页面 → 后端API → SC服务器
   ↓         ↓         ↓        ↓
React    Express   XML协议   铁塔SC
Ant Design  Node.js  构造器   服务器
```

## 🛠️ 技术栈

### 前端

- **React 18** - 用户界面框架
- **Ant Design 5** - UI 组件库
- **Axios** - HTTP 客户端
- **Day.js** - 日期处理

### 后端

- **Node.js** - 运行环境
- **Express** - Web 框架
- **Winston** - 日志管理
- **Axios** - HTTP 客户端
- **xml2js** - XML 处理

## 📦 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
# 安装所有依赖（根目录、前端、后端）
npm run install:all
```

### 环境配置

1. 复制环境变量模板文件：

```bash
# 后端环境变量
cp backend/env.example backend/.env
cp backend/config.env backend/.env

# 前端环境变量
cp frontend/config.env frontend/.env
```

2. 修改配置文件：

```bash
# 编辑后端配置
nano backend/.env

# 主要配置项：
# SC_HOST=sn-r.toweraiot.cn  # SC服务器地址
# SC_PORT=8080               # SC服务器端口
# PORT=3001                  # 后端服务端口
```

### 启动服务

#### 开发模式（推荐）

```bash
# 终端1：启动后端服务
npm run dev:backend

# 终端2：启动前端服务
npm run dev:frontend
```

#### 生产模式

```bash
# 构建前端
npm run build:frontend

# 启动后端
npm run start:backend
```

### 访问系统

- 前端界面：http://localhost:3000
- 后端 API：http://localhost:3001
- 健康检查：http://localhost:3001/api/fsu/health

## 🔧 API 接口文档

### 核心接口

#### 1. FSU 设备注册

```http
POST /api/fsu/register
Content-Type: application/json

{
  "fsuId": "10024",
  "fsuCode": "11010110100001",
  "devices": ["power", "air"],
  "networkType": "4G",
  "softwareVersion": "V1.0.0",
  "remark": "测试设备"
}
```

**响应示例：**

```json
{
  "success": true,
  "message": "FSU设备注册成功",
  "data": {
    "fsuId": "10024",
    "registerTime": "2024-01-01T10:00:00.000Z"
  },
  "processTime": 1250
}
```

#### 2. SC 连接测试

```http
GET /api/fsu/test-connection
```

#### 3. 系统状态

```http
GET /api/fsu/status
```

#### 4. 健康检查

```http
GET /api/fsu/health
```

## 📝 使用说明

### 设备注册流程

1. **连接检查**: 系统自动检测 SC 服务器连接状态
2. **信息录入**: 填写 FSU ID、编码、设备列表等必要信息
3. **参数验证**: 前端实时验证，后端二次校验
4. **报文构造**: 系统自动构造符合 SC 协议的 XML 报文
5. **发送注册**: 通过 HTTP POST 发送到 SC 服务器
6. **结果处理**: 解析 SC 响应，展示注册结果
7. **记录保存**: 保存注册历史记录供查询

### 设备类型说明

| 设备代码 | 设备名称 | 说明             |
| -------- | -------- | ---------------- |
| power    | 高压配电 | 电力配电设备监控 |
| air      | 空调     | 空调设备监控     |
| battery  | 蓄电池   | 蓄电池设备监控   |

### 网络类型支持

- 4G 网络
- 5G 网络
- 有线网络
- WiFi 网络

## 🔍 故障排查

### 常见问题

#### 1. SC 服务器连接失败

**现象**: 连接状态显示"连接失败"
**可能原因**:

- 网络不通（需要 VPN 接入专网）
- SC 服务器地址/端口配置错误
- 防火墙阻挡

**解决方案**:

```bash
# 检查网络连通性
ping sn-r.toweraiot.cn

# 检查端口连通性
telnet sn-r.toweraiot.cn 8080

# 检查配置文件
cat backend/.env
```

#### 2. FSU 注册失败

**现象**: 提交后返回错误信息
**可能原因**:

- 参数格式不正确
- FSU ID 已存在
- SC 服务器拒绝请求

**解决方案**:

- 检查 FSU ID 格式（10-20 位数字）
- 检查 FSU 编码格式（14 位字符）
- 查看后端日志：`tail -f backend/logs/combined.log`

#### 3. 前端页面无法访问

**现象**: 浏览器无法打开页面
**解决方案**:

```bash
# 检查前端服务状态
npm run dev:frontend

# 检查端口占用
netstat -an | grep 3000
```

### 日志查看

```bash
# 查看所有日志
tail -f backend/logs/combined.log

# 查看错误日志
tail -f backend/logs/error.log

# 实时监控日志
tail -f backend/logs/combined.log | grep "FSU"
```

## 📈 性能优化

### 后端优化

- 请求超时设置：5 秒
- 重试机制：失败后 30 秒间隔重试 3 次
- 日志轮转：单文件最大 5MB，保留 5 个历史文件

### 前端优化

- 表单实时验证减少无效提交
- 历史记录分页显示，提升加载性能
- 连接状态缓存，减少重复检测

## 🔐 安全考虑

### 网络安全

- 后端服务必须部署在能访问 SC 专网的环境
- 建议使用 HTTPS 协议传输敏感数据
- VPN 账号密码使用环境变量存储

### 数据安全

- 敏感配置信息不提交到代码仓库
- API 接口建议增加认证机制
- 日志文件定期清理，避免敏感信息泄露

## 🚀 部署建议

### 开发环境

- 使用 nodemon 自动重启后端服务
- 前端热更新提升开发效率
- 详细日志输出便于调试

### 生产环境

- 使用 PM2 管理 Node.js 进程
- 配置 Nginx 反向代理
- 设置日志级别为 warn 或 error
- 定期备份重要数据

### PM2 部署示例

```bash
# 安装PM2
npm install -g pm2

# 启动后端服务
pm2 start backend/app.js --name "fsu-backend"

# 查看服务状态
pm2 status

# 查看日志
pm2 logs fsu-backend
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目！

### 开发流程

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们

- 项目维护者：FSU Team
- 技术支持：请提交 Issue
- 系统版本：v1.0.0

---

**注意**: 本系统需要在能够访问铁塔 SC 服务器的网络环境中部署使用。
