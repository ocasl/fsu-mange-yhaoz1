# React前端项目Tomcat部署指南

## 一、打包前准备

### 1. 配置生产环境API地址

在 `frontend` 目录下创建 `.env.production` 文件（如果需要）：

```bash
# 生产环境配置文件
REACT_APP_API_BASE_URL=http://49.233.218.18:3001/api
```

**说明：**
- 如果不创建此文件，将使用 `src/services/api.js` 中的默认地址
- 当前默认地址已配置为：`http://49.233.218.18:3001/api`
- 如需修改，可在此文件中覆盖配置

### 2. 确认 package.json 配置

已添加 `"homepage": "."` 配置，打包后使用相对路径，可部署到任意目录。

---

## 二、打包步骤

### Windows环境：

```bash
# 1. 进入前端目录
cd frontend

# 2. 安装依赖（首次打包或依赖有更新时需要）
npm install

# 3. 执行打包命令
npm run build
```

### 打包输出

打包成功后，会在 `frontend` 目录下生成 `build` 文件夹，包含以下内容：
- `index.html` - 入口页面
- `static/` - 静态资源目录（js、css、图片等）
- `asset-manifest.json` - 资源清单
- 其他配置文件

---

## 三、部署到Tomcat

### 方式一：部署到ROOT目录（推荐）

将前端应用部署到Tomcat根目录，访问时无需添加项目名称。

**步骤：**

1. **删除或备份Tomcat原有ROOT目录**
   ```bash
   # 进入Tomcat安装目录
   cd /path/to/tomcat/webapps
   
   # 删除或重命名原有ROOT目录
   rm -rf ROOT
   # 或重命名: mv ROOT ROOT.bak
   ```

2. **将build目录重命名为ROOT并复制**
   ```bash
   # Windows PowerShell
   Copy-Item -Path "E:\AAAA\yhaoz1\frontend\build" -Destination "C:\tomcat\webapps\ROOT" -Recurse
   
   # Windows CMD
   xcopy /E /I E:\AAAA\yhaoz1\frontend\build C:\tomcat\webapps\ROOT
   
   # Linux
   cp -r /path/to/frontend/build /path/to/tomcat/webapps/ROOT
   ```

3. **访问应用**
   ```
   http://your-server-ip:8080/
   ```

### 方式二：部署为独立应用

将前端应用部署为独立的Web应用，访问时需要添加项目名称。

**步骤：**

1. **将build目录重命名为你的应用名称（如fsu-app）**
   ```bash
   # Windows PowerShell
   Copy-Item -Path "E:\AAAA\yhaoz1\frontend\build" -Destination "C:\tomcat\webapps\fsu-app" -Recurse
   
   # Windows CMD
   xcopy /E /I E:\AAAA\yhaoz1\frontend\build C:\tomcat\webapps\fsu-app
   ```

2. **修改package.json的homepage配置**
   
   如果使用此方式，需要修改 `frontend/package.json`：
   ```json
   {
     "homepage": "/fsu-app"
   }
   ```
   然后重新执行 `npm run build`

3. **访问应用**
   ```
   http://your-server-ip:8080/fsu-app/
   ```

---

## 四、Tomcat配置建议

### 1. 配置字符编码（可选）

编辑 `tomcat/conf/server.xml`，在Connector标签中添加 `URIEncoding="UTF-8"`：

```xml
<Connector port="8080" protocol="HTTP/1.1"
           connectionTimeout="20000"
           redirectPort="8443"
           URIEncoding="UTF-8" />
```

### 2. 配置跨域（如果后端在不同服务器）

如果前端和后端不在同一服务器，需要在后端配置CORS跨域。

已在后端 `app.js` 中配置：
```javascript
app.use(cors({
  origin: '*',
  credentials: true
}));
```

### 3. 配置反向代理（推荐）

**方案A：使用Nginx反向代理**

在Tomcat前面加一层Nginx，统一处理前后端请求：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态资源
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 后端API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**方案B：配置API代理在同一域名下**

修改 `.env.production`：
```bash
# 使用相对路径，让前后端在同一域名下
REACT_APP_API_BASE_URL=/api
```

然后在Nginx中配置转发 `/api` 到后端Node.js服务。

---

## 五、验证部署

### 1. 检查静态文件

访问 Tomcat，应该能看到登录界面：
```
http://your-server-ip:8080/
```

### 2. 检查API连接

打开浏览器开发者工具（F12），检查Network标签：
- 查看API请求是否正常发送
- 检查是否有CORS错误
- 验证API响应状态

### 3. 常见问题排查

**问题1：页面空白或404**
- 检查 `homepage` 配置是否正确
- 检查Tomcat日志：`tomcat/logs/catalina.out`
- 确认build文件夹内容完整

**问题2：API请求失败**
- 检查 `.env.production` 中的API地址是否正确
- 确认后端服务是否正常运行（http://49.233.218.18:3001/api）
- 检查防火墙和端口是否开放

**问题3：刷新页面404**
- React Router使用BrowserRouter时，需要配置Tomcat的URL重写
- 在 `webapps/ROOT` 或应用目录下创建 `WEB-INF/web.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee 
         http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd"
         version="3.1">
    <error-page>
        <error-code>404</error-code>
        <location>/index.html</location>
    </error-page>
</web-app>
```

---

## 六、快速部署脚本（Windows）

创建 `deploy-to-tomcat.bat` 脚本：

```batch
@echo off
echo ========================================
echo React前端打包并部署到Tomcat
echo ========================================

REM 配置Tomcat路径（请修改为实际路径）
set TOMCAT_PATH=C:\apache-tomcat-9.0.xx
set APP_NAME=ROOT

echo.
echo [1/4] 进入前端目录...
cd frontend

echo.
echo [2/4] 安装依赖...
call npm install

echo.
echo [3/4] 执行打包...
call npm run build

echo.
echo [4/4] 部署到Tomcat...
if exist "%TOMCAT_PATH%\webapps\%APP_NAME%" (
    echo 删除旧版本...
    rmdir /s /q "%TOMCAT_PATH%\webapps\%APP_NAME%"
)

echo 复制新版本...
xcopy /E /I build "%TOMCAT_PATH%\webapps\%APP_NAME%"

echo.
echo ========================================
echo 部署完成！
echo 访问地址: http://localhost:8080/
echo ========================================
pause
```

---

## 七、生产环境优化建议

### 1. 启用Gzip压缩

在Tomcat的 `server.xml` 中启用压缩：

```xml
<Connector port="8080" protocol="HTTP/1.1"
           connectionTimeout="20000"
           redirectPort="8443"
           URIEncoding="UTF-8"
           compression="on"
           compressionMinSize="2048"
           compressableMimeType="text/html,text/xml,text/plain,text/css,text/javascript,application/javascript,application/json" />
```

### 2. 配置缓存策略

创建 `WEB-INF/web.xml` 配置静态资源缓存：

```xml
<filter>
    <filter-name>CacheFilter</filter-name>
    <filter-class>org.apache.catalina.filters.ExpiresFilter</filter-class>
    <init-param>
        <param-name>ExpiresByType image</param-name>
        <param-value>access plus 1 month</param-value>
    </init-param>
    <init-param>
        <param-name>ExpiresByType text/css</param-name>
        <param-value>access plus 1 month</param-value>
    </init-param>
    <init-param>
        <param-name>ExpiresByType application/javascript</param-name>
        <param-value>access plus 1 month</param-value>
    </init-param>
</filter>
```

### 3. 使用HTTPS

配置SSL证书，启用HTTPS访问，提高安全性。

---

## 八、总结

**最简单的部署步骤：**

```bash
# 1. 打包
cd frontend
npm run build

# 2. 部署（将build目录改名为ROOT并复制到Tomcat的webapps目录）
# Windows: xcopy /E /I build C:\tomcat\webapps\ROOT
# Linux: cp -r build /path/to/tomcat/webapps/ROOT

# 3. 启动Tomcat并访问
# http://your-server-ip:8080/
```

**重要提示：**
- ✅ `homepage: "."` 已配置（支持相对路径）
- ✅ `npm run build` 命令已存在
- ✅ API地址已在代码中配置
- ⚠️ 确保后端服务正常运行（http://49.233.218.18:3001）
- ⚠️ 确保防火墙开放相应端口（8080、3001）

