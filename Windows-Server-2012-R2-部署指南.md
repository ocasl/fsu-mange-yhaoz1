# Windows Server 2012 R2 部署指南

## 📋 系统要求

### 硬件要求

- **CPU**: 2 核心以上，推荐 4 核心
- **内存**: 4GB 以上，推荐 8GB
- **硬盘**: 50GB 以上可用空间
- **网络**: 能够访问铁塔 SC 服务器的专网环境

### 软件要求

- Windows Server 2012 R2 (已安装)
- .NET Framework 4.5 或更高版本
- 管理员权限

## 🚀 部署步骤

### 第一步：安装 Node.js 环境

1. **下载 Node.js**

   ```
   访问官网：https://nodejs.org/
   下载推荐的LTS版本 (v18.x或v20.x)
   选择Windows x64版本的.msi安装包
   ```

2. **安装 Node.js**

   ```
   运行下载的.msi安装包
   - 选择"Add to PATH"选项
   - 选择"Automatically install the necessary tools"
   - 点击Next直到安装完成
   ```

3. **验证安装**

   ```cmd
   # 打开命令提示符(以管理员身份运行)
   node -v
   npm -v

   # 应该显示版本号，如：
   # v18.17.0
   # 9.6.7
   ```

### 第二步：安装 Git (可选但推荐)

1. **下载 Git**

   ```
   访问：https://git-scm.com/download/win
   下载最新版本的Git for Windows
   ```

2. **安装 Git**
   ```
   运行安装包，使用默认设置
   确保选择"Git from the command line and also from 3rd-party software"
   ```

### 第三步：部署应用程序

1. **创建应用目录**

   ```cmd
   # 在C盘创建应用目录
   mkdir C:\FSU-System
   cd C:\FSU-System
   ```

2. **复制项目文件**

   ```cmd
   # 方法1：如果有Git，可以克隆项目
   git clone <你的项目仓库地址> .

   # 方法2：直接复制项目文件
   # 将整个yhaoz1文件夹复制到C:\FSU-System\
   ```

3. **安装项目依赖**
   ```cmd
   # 在项目根目录执行
   cd C:\FSU-System
   npm run install:all
   ```

### 第四步：配置环境变量

1. **配置后端环境变量**

   ```cmd
   cd C:\FSU-System\backend
   copy config.env .env

   # 编辑.env文件，设置以下参数：
   ```

   **backend\.env 配置示例：**

   ```env
   # 服务端口
   PORT=3001

   # SC服务器配置
   SC_HOST=sn-r.toweraiot.cn
   SC_PORT=8080

   # 日志级别
   LOG_LEVEL=info

   # 数据库配置(如果需要)
   # DB_CONNECTION_STRING=mongodb://localhost:27017/fsu_system
   ```

2. **配置前端环境变量** (如果需要)
   ```cmd
   cd C:\FSU-System\frontend
   copy config.env .env
   ```

### 第五步：测试应用运行

1. **启动测试**

   ```cmd
   # 在项目根目录
   cd C:\FSU-System

   # 运行启动脚本
   start.bat
   ```

2. **验证服务**

   ```cmd
   # 测试后端API
   curl http://localhost:3001/api/fsu/health

   # 或在浏览器访问
   http://localhost:3001/api/fsu/health
   ```

3. **访问前端**
   ```
   浏览器访问：http://localhost:3000
   ```

### 第六步：安装 PM2 进程管理器

1. **安装 PM2**

   ```cmd
   npm install -g pm2
   npm install -g pm2-windows-startup
   ```

2. **配置 PM2 自启动**

   ```cmd
   # 安装Windows服务
   pm2-startup install

   # 保存当前PM2进程列表
   pm2 save
   ```

3. **创建 PM2 配置文件**

   在 `C:\FSU-System\` 创建 `ecosystem.config.js`：

   ```javascript
   module.exports = {
     apps: [
       {
         name: "fsu-backend",
         script: "./backend/start.js",
         cwd: "./backend",
         instances: 1,
         autorestart: true,
         watch: false,
         max_memory_restart: "1G",
         env: {
           NODE_ENV: "production",
           PORT: 3001,
         },
         error_file: "./logs/err.log",
         out_file: "./logs/out.log",
         log_file: "./logs/combined.log",
         time: true,
       },
     ],
   };
   ```

4. **使用 PM2 启动应用**

   ```cmd
   cd C:\FSU-System

   # 启动后端服务
   pm2 start ecosystem.config.js

   # 查看状态
   pm2 status

   # 查看日志
   pm2 logs fsu-backend

   # 保存配置
   pm2 save
   ```

### 第七步：配置 IIS 反向代理 (推荐)

1. **安装 IIS 和相关模块**

   ```
   - 打开"服务器管理器"
   - 点击"添加角色和功能"
   - 选择"Web服务器(IIS)"
   - 安装URL重写模块和应用程序请求路由
   ```

2. **下载并安装模块**

   ```
   - URL Rewrite: https://www.iis.net/downloads/microsoft/url-rewrite
   - Application Request Routing: https://www.iis.net/downloads/microsoft/application-request-routing
   ```

3. **配置 IIS 站点**

   ```
   - 打开IIS管理器
   - 右键"网站" -> "添加网站"
   - 网站名称: FSU-System
   - 物理路径: C:\FSU-System\frontend\build
   - 端口: 80 (或其他端口)
   ```

4. **配置 URL 重写规则**

   在网站根目录创建 `web.config`：

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <!-- API请求转发到Node.js后端 -->
           <rule name="API Proxy" stopProcessing="true">
             <match url="^api/(.*)" />
             <action type="Rewrite" url="http://localhost:3001/api/{R:1}" />
           </rule>

           <!-- React路由支持 -->
           <rule name="React Router" stopProcessing="true">
             <match url=".*" />
             <conditions logicalGrouping="MatchAll">
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
               <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
             </conditions>
             <action type="Rewrite" url="/index.html" />
           </rule>
         </rules>
       </rewrite>
     </system.webServer>
   </configuration>
   ```

### 第八步：构建生产版本

1. **构建前端**

   ```cmd
   cd C:\FSU-System
   npm run build:frontend
   ```

2. **配置 IIS 指向构建文件**
   ```
   将IIS网站物理路径设置为：
   C:\FSU-System\frontend\build
   ```

### 第九步：配置防火墙

1. **开放必要端口**

   ```cmd
   # 开放HTTP端口
   netsh advfirewall firewall add rule name="FSU-HTTP" dir=in action=allow protocol=TCP localport=80

   # 开放HTTPS端口(如果需要)
   netsh advfirewall firewall add rule name="FSU-HTTPS" dir=in action=allow protocol=TCP localport=443

   # 开放Node.js后端端口(内部访问)
   netsh advfirewall firewall add rule name="FSU-Backend" dir=in action=allow protocol=TCP localport=3001
   ```

2. **配置出站规则**
   ```cmd
   # 允许访问SC服务器
   netsh advfirewall firewall add rule name="SC-Server" dir=out action=allow protocol=TCP remoteport=8080
   ```

### 第十步：系统服务配置

1. **创建 Windows 服务**

   创建 `install-service.bat`：

   ```batch
   @echo off
   cd /d C:\FSU-System

   echo 安装PM2 Windows服务...
   pm2-startup install

   echo 启动FSU后端服务...
   pm2 start ecosystem.config.js

   echo 保存PM2配置...
   pm2 save

   echo 服务安装完成！
   pause
   ```

2. **验证服务状态**

   ```cmd
   # 查看Windows服务
   sc query PM2

   # 查看PM2状态
   pm2 status
   ```

### 第十一步：监控和日志

1. **配置日志轮转**

   ```cmd
   # 安装PM2日志轮转模块
   pm2 install pm2-logrotate

   # 配置日志轮转
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   pm2 set pm2-logrotate:compress true
   ```

2. **配置监控**
   ```cmd
   # 启用PM2监控
   pm2 install pm2-server-monit
   ```

## 🔧 维护操作

### 日常维护命令

```cmd
# 查看服务状态
pm2 status

# 重启服务
pm2 restart fsu-backend

# 查看日志
pm2 logs fsu-backend

# 停止服务
pm2 stop fsu-backend

# 重新加载配置
pm2 reload fsu-backend
```

### 更新部署

```cmd
# 1. 停止服务
pm2 stop all

# 2. 备份当前版本
mkdir C:\FSU-System-backup
xcopy C:\FSU-System C:\FSU-System-backup /E /H

# 3. 更新代码
cd C:\FSU-System
git pull origin main

# 4. 更新依赖
npm run install:all

# 5. 重新构建前端
npm run build:frontend

# 6. 重启服务
pm2 start ecosystem.config.js
```

## 🔍 故障排查

### 常见问题

1. **Node.js 服务无法启动**

   ```cmd
   # 检查端口占用
   netstat -an | find "3001"

   # 检查防火墙
   netsh advfirewall firewall show rule name="FSU-Backend"

   # 查看详细错误
   pm2 logs fsu-backend --lines 50
   ```

2. **无法访问 SC 服务器**

   ```cmd
   # 测试网络连通性
   ping sn-r.toweraiot.cn
   telnet sn-r.toweraiot.cn 8080

   # 检查DNS解析
   nslookup sn-r.toweraiot.cn
   ```

3. **IIS 反向代理不工作**
   ```
   - 检查URL重写模块是否安装
   - 验证web.config语法
   - 查看IIS日志：%SystemDrive%\inetpub\logs\LogFiles
   ```

### 性能优化

1. **系统优化**

   ```cmd
   # 设置Node.js内存限制
   set NODE_OPTIONS=--max-old-space-size=2048

   # 优化PM2配置
   pm2 set pm2:autodump true
   pm2 set pm2:kill_timeout 5000
   ```

2. **数据库优化**
   ```
   - 如果使用MongoDB，配置适当的索引
   - 定期清理旧日志数据
   - 设置连接池大小
   ```

## 🔐 安全建议

1. **系统安全**

   - 定期更新 Windows Server 补丁
   - 配置强密码策略
   - 启用 Windows 防火墙
   - 定期备份系统和应用数据

2. **应用安全**

   - 使用 HTTPS 协议
   - 配置 API 访问控制
   - 定期更新 Node.js 和依赖包
   - 设置日志审计

3. **网络安全**
   - 限制不必要的端口开放
   - 配置 VPN 访问 SC 专网
   - 使用安全的认证机制

## 📞 技术支持

- 系统日志位置：`C:\FSU-System\backend\logs\`
- PM2 日志位置：`C:\Users\<用户名>\.pm2\logs\`
- IIS 日志位置：`%SystemDrive%\inetpub\logs\LogFiles`

---

**部署完成后访问地址：**

- 前端界面：http://服务器 IP/
- 后端 API：http://服务器 IP/api/
- 健康检查：http://服务器 IP/api/fsu/health
