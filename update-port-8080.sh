#!/bin/bash

# 更新nginx配置为8080端口
cat > /etc/nginx/conf.d/yhaoz1.conf << 'EOF'
server {
    listen 8080;
    server_name _;

    location / {
        root /var/www/yhaoz1/frontend/build;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 更新后端CORS配置
sed -i 's/CORS_ORIGIN=http:\/\/103.236.91.181/CORS_ORIGIN=http:\/\/103.236.91.181:8080/' /var/www/yhaoz1/backend/config.env

# 测试nginx配置
nginx -t

# 重启nginx
systemctl restart nginx

# 重启后端服务
/usr/bin/pm2 restart yhaoz1-backend

echo "✅ 端口已更改为8080"
echo "访问地址: http://103.236.91.181:8080/"


