# Redis 配置说明

## Redis 密码配置

### 1. 无密码配置（默认）
如果您的Redis没有设置密码，在 `.env` 文件中：
```env
REDIS_PASSWORD=
```

### 2. 有密码配置
如果您的Redis设置了密码，在 `.env` 文件中：
```env
REDIS_PASSWORD=your_redis_password
```

## Redis 安装和配置

### Windows 环境

1. **下载 Redis for Windows**
   - 访问 https://github.com/microsoftarchive/redis/releases
   - 下载最新版本的 Redis-x64-xxx.msi

2. **安装 Redis**
   - 运行下载的 .msi 文件
   - 按照安装向导完成安装

3. **启动 Redis 服务**
   ```cmd
   redis-server
   ```

4. **测试连接**
   ```cmd
   redis-cli ping
   ```
   应该返回 `PONG`

### Linux/macOS 环境

1. **Ubuntu/Debian**
   ```bash
   sudo apt update
   sudo apt install redis-server
   sudo systemctl start redis-server
   sudo systemctl enable redis-server
   ```

2. **CentOS/RHEL**
   ```bash
   sudo yum install redis
   sudo systemctl start redis
   sudo systemctl enable redis
   ```

3. **macOS**
   ```bash
   brew install redis
   brew services start redis
   ```

## 设置 Redis 密码（可选）

### 1. 编辑 Redis 配置文件
找到 Redis 配置文件（通常是 `redis.conf`）：

- Windows: `C:\Program Files\Redis\redis.windows.conf`
- Linux: `/etc/redis/redis.conf`
- macOS: `/usr/local/etc/redis.conf`

### 2. 设置密码
在配置文件中找到并修改：
```conf
# requirepass foobared
requirepass your_redis_password
```

### 3. 重启 Redis 服务
- Windows: 重启 Redis 服务
- Linux: `sudo systemctl restart redis-server`
- macOS: `brew services restart redis`

### 4. 测试密码
```bash
redis-cli
> AUTH your_redis_password
> PING
```

## 项目中的 Redis 使用

本项目使用 Redis 存储：
- 用户对话历史（7天过期）
- 速率限制数据
- 每日消息计数

### 连接配置
在 `config/database.js` 中：
```javascript
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: process.env.REDIS_DB || 0
});
```

## 故障排除

### 1. 连接被拒绝
```
Redis连接错误: connect ECONNREFUSED 127.0.0.1:6379
```
**解决方案：**
- 确保 Redis 服务正在运行
- 检查端口是否正确（默认6379）

### 2. 认证失败
```
Redis连接错误: NOAUTH Authentication required
```
**解决方案：**
- 检查 `.env` 文件中的 `REDIS_PASSWORD` 配置
- 确保密码与 Redis 配置一致

### 3. 权限问题
```
Redis连接错误: Permission denied
```
**解决方案：**
- 检查 Redis 配置文件权限
- 确保应用有访问 Redis 的权限

## 生产环境建议

1. **设置强密码**
2. **禁用危险命令**
3. **配置防火墙**
4. **启用持久化**
5. **监控 Redis 性能**

## 常用 Redis 命令

```bash
# 连接 Redis
redis-cli

# 使用密码连接
redis-cli -a your_password

# 查看所有键
KEYS *

# 查看键的类型
TYPE key_name

# 删除键
DEL key_name

# 查看键的过期时间
TTL key_name

# 清空当前数据库
FLUSHDB

# 清空所有数据库
FLUSHALL
``` 