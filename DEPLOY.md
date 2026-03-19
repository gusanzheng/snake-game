# 部署指南

## 架构说明

- **前端**：Vite 构建为静态文件（`dist/`），由 Express 直接托管
- **后端**：Express.js（Node.js），生产端口 `3000`
- **数据库**：MongoDB（已在远端，无需额外部署）

生产环境只需启动一个 Node.js 进程，Express 同时提供 API 和静态文件服务。

---

## 一、本地构建 & 上传

```bash
# 1. 构建前端（需要代理）
proxy on
npm run build
proxy off

# 2. 上传到云服务器（排除 node_modules 和 .env）
#    将 <user> 和 <server-ip> 替换为你的实际用户名和服务器 IP
rsync -av --exclude='node_modules' --exclude='.env' \
  /path/to/snake-game/ \
  <user>@<server-ip>:/home/dev/snake-game
```

## 二、安装依赖 & 配置环境变量

```bash
cd /home/dev/snake-game

# 只安装生产依赖
npm install --omit=dev

# 创建 .env 文件（参考 .env.example，填入实际值）
cp .env.example .env
# 然后编辑 .env，填入真实的 MONGODB_PASS 等信息
```

---

## 三、用 PM2 启动服务

```bash
# 安装 PM2（进程守护工具）
sudo npm install -g pm2

# 启动服务
pm2 start npm --name "snake-game" -- start

# 查看运行状态
pm2 status

# 查看日志（排查问题用）
pm2 logs snake-game
```

```bash
# 设置开机自启
pm2 startup        # 执行命令输出的那条 sudo env ... 命令
pm2 save           # 保存当前进程列表
```

---


浏览器访问 `http://<server-ip>:3000` 验证是否正常运行。

---

## 四、Nginx 反向代理（绑定域名 / 80 端口）

如果需要通过域名或不带端口号访问：

```bash
sudo apt install -y nginx
```

写入以下内容（将 `<your-domain>` 替换为实际域名或 IP）：

```nginx
cat > /etc/nginx/sites-available/snake-game << 'EOF'                                                                                                                                                                    
  server {                                                                
      listen 80;                                                                                                                                                                                                          
      server_name <your-domain>;                                                                                                                                                                                              
      return 301 https://$host$request_uri;                                                                                                                                                                               
  }                                                                                                                                                                                                                       

  server {
      listen 443 ssl;
      server_name <your-domain>;

      ssl_certificate     /etc/nginx/cert/<your-domain>.pem;
      ssl_certificate_key /etc/nginx/cert/<your-domain>.key;

      location / {
          proxy_pass http://localhost:3000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
      }
  }
```

```bash
sudo ln -s /etc/nginx/sites-available/snake-game /etc/nginx/sites-enabled/
sudo nginx -t              # 检查配置语法
sudo systemctl restart nginx
```

之后访问 `http://<your-domain>` 即可，无需端口号。

---

## 常用运维命令

| 命令 | 用途 |
|------|------|
| `pm2 status` | 查看所有进程状态 |
| `pm2 logs snake-game` | 查看实时日志 |
| `pm2 restart snake-game` | 重启服务 |
| `pm2 stop snake-game` | 停止服务 |

---
