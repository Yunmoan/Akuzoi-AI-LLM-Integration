# Akuzoi AI 完整设置指南

## 🚀 快速启动

### 1. 环境准备

确保已安装：
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+

### 2. 数据库初始化

```bash
# 运行数据库初始化脚本
node scripts/init-db.js
```

### 3. 环境变量配置

复制并配置环境变量：
```bash
cp env.example .env
```

编辑 `.env` 文件，配置以下关键参数：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=akuzoi_ai_db

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT密钥
JWT_SECRET=your_jwt_secret_key

# OAuth配置
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_CLIENT_SECRET=your_oauth_client_secret
OAUTH_REDIRECT_URI=http://localhost:3001/auth/callback
OAUTH_AUTHORIZATION_URL=https://account.naids.com/oauth2/authorize
OAUTH_TOKEN_URL=https://account.naids.com/api/oauth2/token
OAUTH_USER_DATA_URL=https://account.naids.com/api/api/user/data

# LLM配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1

# 实名认证检查（可选）
ENABLE_REALNAME_CHECK=true
```

### 4. 启动后端服务

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

后端将在 `http://localhost:3000` 启动

### 5. 启动前端服务

```bash
# 进入前端目录
cd web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将在 `http://localhost:3001` 启动

## 🔧 测试流程

### 1. 健康检查
```bash
curl http://localhost:3000/health
```

### 2. OAuth流程测试
```bash
node test-oauth.js
```

### 3. 前端访问
打开浏览器访问：http://localhost:3001

## 📋 完整流程测试

### 1. 登录流程
1. 访问 http://localhost:3001
2. 点击"使用 Natayark ID 登录"
3. 完成OAuth授权
4. 首次登录会跳转到昵称设置页面
5. 设置昵称后进入聊天界面

### 2. 聊天功能
1. 选择AI智能体
2. 开始对话
3. 查看对话历史

### 3. 管理员功能
1. 使用管理员账户登录
2. 访问 `/admin` 页面
3. 查看系统统计
4. 管理用户

## 🛠️ 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查MySQL服务
   mysql -u root -p
   
   # 检查数据库是否存在
   SHOW DATABASES;
   USE akuzoi_ai_db;
   SHOW TABLES;
   ```

2. **Redis连接失败**
   ```bash
   # 检查Redis服务
   redis-cli ping
   
   # 如果设置了密码
   redis-cli -a your_password ping
   ```

3. **OAuth回调失败**
   - 检查回调地址配置
   - 确认OAuth应用配置正确
   - 查看后端日志

4. **前端无法连接后端**
   - 确认后端服务运行在3000端口
   - 检查API代理配置
   - 查看浏览器控制台错误

### 日志查看

```bash
# 后端日志
tail -f logs/combined.log

# 错误日志
tail -f logs/error.log
```

## 📁 项目结构

```
Akuzoi-AI-LLM-Integration-1/
├── src/                      # 后端源码
├── config/                   # 配置文件
├── middleware/               # 中间件
├── routes/                   # 路由
├── services/                 # 服务层
├── utils/                    # 工具
├── prompts/                  # 提示词配置
├── web/                      # 前端应用
├── scripts/                  # 脚本文件
├── logs/                     # 日志文件
├── package.json              # 后端依赖
├── env.example               # 环境变量示例
└── README.md                 # 项目说明
```

## 🔐 安全配置

### 1. 生产环境配置
- 使用强密码
- 启用HTTPS
- 配置防火墙
- 定期备份数据库

### 2. 环境变量安全
- 不要在代码中硬编码敏感信息
- 使用环境变量管理配置
- 定期轮换密钥

### 3. 数据库安全
- 限制数据库访问权限
- 启用SSL连接
- 定期备份

## 📊 监控和维护

### 1. 系统监控
- 监控服务状态
- 查看错误日志
- 监控数据库性能

### 2. 数据备份
```bash
# MySQL备份
mysqldump -u root -p akuzoi_ai_db > backup.sql

# Redis备份
redis-cli BGSAVE
```

### 3. 日志管理
- 定期清理旧日志
- 监控日志大小
- 设置日志轮转

## 🎯 下一步

1. 配置生产环境
2. 设置域名和SSL证书
3. 配置负载均衡
4. 设置监控和告警
5. 制定备份策略

## 📞 支持

如果遇到问题，请：
1. 查看日志文件
2. 检查配置是否正确
3. 参考故障排除部分
4. 提交Issue到项目仓库 