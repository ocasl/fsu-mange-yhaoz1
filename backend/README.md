# FSU 管理系统后端 API 服务

基于 Node.js + Express + MongoDB 实现的 FSU 管理系统后端 API 服务，支持 FSU 上线管理、告警上报和清除功能。

## 🚀 快速开始

### 环境要求

- Node.js 16+
- MongoDB 5.0+
- 网络连接到 SC 服务器

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install
```

### 配置环境变量

创建`.env`文件，参考`.env.example`配置：

```bash
# 服务端口
PORT=3001

# MongoDB连接
MONGODB_URI=mongodb://localhost:27017/fsu_management

# SC服务器配置
SC_SERVER_IP=192.168.1.100
SC_SERVER_PORT=8080

# 日志配置
LOG_LEVEL=info
LOG_DIR=./logs

# FSU WebService配置
FSU_WEBSERVICE_PORT=8080
```

### 启动服务

```bash
# 开发模式启动
npm run dev

# 生产模式启动
npm start
```

## 📋 API 接口文档

### FSU 上线管理

#### 获取 FSU 上线列表

```http
GET /api/fsu/online/list
```

#### 添加 FSU 上线记录

```http
POST /api/fsu/online
```

#### 更新 FSU 上线记录

```http
PUT /api/fsu/online/:id
```

#### 删除 FSU 上线记录

```http
DELETE /api/fsu/online/:id
```

#### 批量删除 FSU 上线记录

```http
POST /api/fsu/online/batch-delete
```

#### 导出 FSU 上线数据

```http
GET /api/fsu/online/export
```

#### 获取 FSU 上线详情

```http
GET /api/fsu/online/:id
```

### 告警管理

#### 获取告警记录列表

```http
GET /api/alarm/:type/list
```

#### 上报告警

```http
POST /api/alarm/report
```

#### 清除告警

```http
POST /api/alarm/clear
```

#### 删除告警记录

```http
DELETE /api/alarm/:id
```

#### 获取告警记录详情

```http
GET /api/alarm/:id
```

## 🔧 项目结构

```
backend/
├── config/             # 配置文件
│   ├── config.js       # 系统配置
│   └── db.js           # 数据库连接
├── controllers/        # 控制器
│   ├── fsuOnlineController.js  # FSU上线控制器
│   └── alarmController.js      # 告警控制器
├── models/             # 数据模型
│   ├── FsuOnline.js    # FSU上线模型
│   └── AlarmRecord.js  # 告警记录模型
├── routes/             # 路由
│   ├── index.js        # 路由入口
│   ├── fsuOnlineRoutes.js  # FSU上线路由
│   └── alarmRoutes.js      # 告警路由
├── services/           # 服务
│   ├── fsuWebServiceServer.js  # FSU WebService服务
│   └── scService.js           # SC服务通信
├── utils/              # 工具
│   ├── alarmManager.js  # 告警管理器
│   └── logger.js        # 日志工具
├── logs/               # 日志目录
├── app.js              # 应用入口
├── start.js            # 启动脚本
├── package.json        # 项目配置
└── README.md           # 项目文档
```

## 📝 开发指南

### 数据库模型

系统使用 MongoDB 作为数据库，主要包含两个集合：

1. **FSU 上线记录(fsu_online)**：存储 FSU 上线信息
2. **告警记录(alarm_records)**：存储告警上报和清除记录

### 日志系统

系统使用 Winston 作为日志工具，日志文件保存在`logs`目录下：

- `info.log`：普通日志
- `error.log`：错误日志

### 错误处理

系统实现了全局错误处理中间件，会捕获所有未处理的异常并记录到日志。

## 🔍 故障排查

### 常见问题

1. **MongoDB 连接失败**：检查 MongoDB 服务是否启动，连接字符串是否正确
2. **SC 服务器通信失败**：检查 SC 服务器 IP 和端口是否正确，网络是否连通
3. **WebService 启动失败**：检查端口 8080 是否被占用

### 日志查看

```bash
# 查看实时日志
npm run logs

# 查看最新日志
npm run logs:tail

# 清空日志
npm run logs:clear
```

## 📚 参考文档

- [FSU 系统技术规范与 API 文档](./FSU系统技术规范与API文档.md)
- [中国铁塔 B 接口技术规范](./中国铁塔动环监控系统%20统一互联B接口技术规范-20170504.md)
- [告警发送配置总结](./告警发送配置总结.md)

## 📄 许可证

© 2024 FSU Team - 专为 FSU 设备管理打造
