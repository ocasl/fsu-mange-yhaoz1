# VPN 连接指导

## 🎯 重要说明

**Node.js 无法直接建立 VPN 连接**，这是因为：

1. VPN 连接需要系统级权限
2. 需要操作网络接口和路由表
3. 需要专门的 VPN 客户端程序

**正确的做法是**：先手动连接 VPN，然后让 Node.js 检测 VPN 环境。

## 🔧 VPN 连接方法

### Windows 系统

#### 方法 1: 使用系统内置 VPN

1. 打开"设置" > "网络和 Internet" > "VPN"
2. 点击"添加 VPN 连接"
3. 填入 VPN 服务器信息：
   - 服务器: `117.156.97.152`
   - 用户名: `61082143802203`
   - 密码: `61082143802203`
4. 连接 VPN

#### 方法 2: 使用 OpenVPN 客户端

1. 下载安装 [OpenVPN Connect](https://openvpn.net/client/)
2. 导入配置文件 `backend/config/openvpn-client.ovpn`
3. 连接 VPN

### Linux 系统

#### 方法 1: 使用 NetworkManager

```bash
# 安装NetworkManager OpenVPN插件
sudo apt-get install network-manager-openvpn-gnome

# 通过GUI添加VPN连接
nm-connection-editor
```

#### 方法 2: 使用 OpenVPN 命令行

```bash
# 安装OpenVPN
sudo apt-get install openvpn

# 使用配置文件连接
sudo openvpn --config /path/to/config.ovpn
```

### macOS 系统

#### 方法 1: 使用系统 VPN 设置

1. 打开"系统偏好设置" > "网络"
2. 点击"+"添加新连接
3. 选择 VPN 类型并配置

#### 方法 2: 使用 Tunnelblick

1. 下载安装 [Tunnelblick](https://tunnelblick.net/)
2. 导入 OpenVPN 配置文件
3. 连接 VPN

## 🚀 Node.js VPN 检测

连接 VPN 后，Node.js 会自动检测 VPN 环境：

### 检测方法

1. **VPN 接口检测**: 查找 tun、tap、ppp 等 VPN 网络接口
2. **路由表分析**: 检查默认路由是否通过 VPN
3. **连通性测试**: 测试到 SC 服务器的连接
4. **内网 IP 识别**: 使用本机内网 IP 作为备用

### API 接口

```bash
# 检测VPN环境
curl -X POST http://localhost:3001/api/fsu/vpn/detect

# 查看VPN状态
curl http://localhost:3001/api/fsu/vpn/status

# 重置VPN状态
curl -X POST http://localhost:3001/api/fsu/vpn/reset
```

## 📝 配置文件示例

### OpenVPN 配置 (openvpn-client.ovpn)

```
client
dev tun
proto udp
remote 117.156.97.152 1194
auth-user-pass auth.txt
cipher AES-256-CBC
comp-lzo
verb 3
```

### 认证文件 (auth.txt)

```
61082143802203
61082143802203
```

## 🔍 故障排除

### 1. VPN 连接不上

- 检查网络连接
- 确认 VPN 服务器地址和端口
- 验证用户名密码
- 检查防火墙设置

### 2. Node.js 检测不到 VPN

- 确认 VPN 确实已连接
- 检查网络接口名称
- 查看日志输出
- 尝试重启 Node.js 服务

### 3. 无法访问 SC 服务器

- 确认 VPN 路由配置
- 测试到 SC 服务器的连通性
- 检查 DNS 设置

## 💡 最佳实践

1. **先连接 VPN，再启动 Node.js 服务**
2. **使用稳定的 VPN 客户端**（如 OpenVPN）
3. **配置自动重连**，确保 VPN 连接稳定
4. **监控 VPN 状态**，及时处理连接中断
5. **使用内网 IP 段**作为备用方案

## 📞 技术支持

如果遇到问题，请提供：

1. 操作系统版本
2. VPN 客户端类型和版本
3. Node.js 日志输出
4. 网络接口信息 (`ipconfig` 或 `ifconfig`)
