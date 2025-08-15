# Akuzoi AI LLM Integration

Akuzoi AI 大语言模型 Web 集成


## 技术栈

- **后端框架**: Express.js
- **数据库**: MySQL 8.0+
- **缓存**: Redis 6.0+
- **认证**: JWT
- **OAuth**: Natayark ID OAuth 2.0
- **LLM**: OpenAI API (兼容其他OpenAI-like API)
- **日志**: Winston
- **安全**: Helmet, CORS, Rate Limiting

## 项目结构

```
Akuzoi-AI-LLM-Integration-1/
├── src/                      # 后端源码
│   └── app.js               # 主应用文件
├── config/                   # 配置文件
│   ├── database.js          # 数据库配置
│   └── admins.json          # 管理员配置
├── middleware/               # 中间件
│   ├── auth.js              # 认证中间件
│   ├── adminAuth.js         # 管理员认证中间件
│   └── rateLimiter.js       # 速率限制中间件
├── routes/                   # 路由
│   ├── auth.js              # 认证路由
│   ├── agents.js            # 智能体路由
│   ├── chat.js              # 聊天路由
│   └── admin.js             # 管理员路由
├── services/                 # 服务层
│   ├── oauthService.js      # OAuth服务
│   ├── llmService.js        # LLM服务
│   ├── memoryService.js     # 记忆管理服务
│   └── adminService.js      # 管理员服务
├── utils/                    # 工具
│   └── logger.js            # 日志工具
├── prompts/                  # 提示词配置
│   └── agents.json          # 智能体配置
├── web/                      # 前端应用
│   ├── src/                 # 前端源码
│   ├── package.json         # 前端依赖
│   ├── vite.config.ts       # Vite配置
│   └── README.md            # 前端说明
├── logs/                     # 日志文件
├── package.json              # 后端依赖
├── env.example               # 环境变量示例
├── start.sh                  # 后端启动脚本
├── test-api.js               # API测试脚本
├── test-memory.js            # 记忆管理测试脚本
├── scripts/                  # 脚本文件
│   ├── init-db.js           # 数据库初始化脚本
│   └── cleanup-memory.js    # 记忆清理脚本
└── README.md                 # 项目说明
```

## 快速开始

### 1. 环境要求

- Node.js 16.0+
- MySQL 8.0+
- Redis 6.0+

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境变量示例文件并配置：

```bash
cp env.example .env
```

编辑 `.env` 文件，配置以下必要参数：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# MySQL配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=akuzoi_ai_db

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# OAuth配置
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_CLIENT_SECRET=your_oauth_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback

# LLM配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1

# 功能开关
ENABLE_REALNAME_CHECK=true

# 聊天限制配置
MAX_DAILY_MESSAGES=100
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10
```

### 4. 数据库初始化

项目启动时会自动创建必要的数据库表：

- `users` - 用户信息表
- `chat_records` - 聊天记录表
- `daily_chat_stats` - 每日聊天统计表

### 5. 启动服务

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务启动后，访问 `http://localhost:3000/health` 检查健康状态。

## API 接口文档

### 认证相关

#### 获取OAuth登录链接
```
GET /api/auth/login
```

#### OAuth回调处理
```
GET /api/auth/callback?code={code}&state={state}
```

#### 设置用户昵称
```
POST /api/auth/set-nickname
Authorization: Bearer {token}
Content-Type: application/json

{
  "nickname": "用户昵称"
}
```

#### 获取当前用户信息
```
GET /api/auth/me
Authorization: Bearer {token}
```

### 智能体相关

#### 获取智能体列表
```
GET /api/agents
Authorization: Bearer {token}
```

#### 获取智能体详情
```
GET /api/agents/{agentId}
Authorization: Bearer {token}
```

#### 获取用户与智能体的对话统计
```
GET /api/agents/{agentId}/conversations
Authorization: Bearer {token}
```

### 聊天相关

#### 发送消息
```
POST /api/chat/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "agentId": "general_assistant",
  "message": "你好",
  "sessionId": "optional_session_id"
}
```

#### 获取会话列表
```
GET /api/chat/sessions?agentId=general_assistant
Authorization: Bearer {token}
```

#### 获取会话历史
```
GET /api/chat/sessions/{sessionId}/history?agentId=general_assistant
Authorization: Bearer {token}
```

#### 删除会话
```
DELETE /api/chat/sessions/{sessionId}
Authorization: Bearer {token}
```

#### 清空智能体所有对话
```
DELETE /api/chat/agent/{agentId}/conversations
Authorization: Bearer {token}
```

#### 更新会话标题
```
PUT /api/chat/sessions/{sessionId}/title
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "新的会话标题"
}
```

#### 获取今日统计
```
GET /api/chat/stats/today
Authorization: Bearer {token}
```

#### 获取总体统计
```
GET /api/chat/stats/overview
Authorization: Bearer {token}
```

### 管理员相关

#### 获取所有用户列表
```
GET /api/admin/users?page=1&limit=20&search=关键词
Authorization: Bearer {token}
```

#### 获取用户详细信息
```
GET /api/admin/users/{userId}
Authorization: Bearer {token}
```

#### 获取用户聊天历史
```
GET /api/admin/users/{userId}/chat-history?page=1&limit=50
Authorization: Bearer {token}
```

#### 封禁用户
```
POST /api/admin/users/{userId}/ban
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "封禁原因"
}
```

#### 解封用户
```
POST /api/admin/users/{userId}/unban
Authorization: Bearer {token}
```

#### 获取系统统计
```
GET /api/admin/stats
Authorization: Bearer {token}
```

#### 获取管理员操作日志
```
GET /api/admin/actions?page=1&limit=50&adminUserId=1
Authorization: Bearer {token}
```

#### 获取管理员配置
```
GET /api/admin/config
Authorization: Bearer {token}
```

## 智能体配置

智能体配置文件位于 `prompts/agents.json`，包含以下字段：

- `id`: 智能体唯一标识
- `name`: 智能体名称
- `description`: 智能体描述
- `model`: 使用的LLM模型
- `system_prompt`: 系统提示词（不会泄露到前端）
- `max_tokens`: 最大token数
- `temperature`: 温度参数
- `memory`: 记忆管理配置
  - `max_messages`: 最大记忆条数
  - `max_age_hours`: 记忆保存时间（小时）
  - `enabled`: 是否启用记忆功能
- `enabled`: 是否启用

## 管理员配置

管理员配置文件位于 `config/admins.json`，包含以下内容：

### 管理员列表
- `oauth_username`: 管理员的Natayark用户名
- `role`: 管理员角色（super_admin、moderator等）
- `permissions`: 权限列表
- `enabled`: 是否启用
- `created_at`: 创建时间

### 角色定义
- `super_admin`: 超级管理员，拥有所有权限
- `moderator`: 内容审核员，负责用户管理

### 权限列表
- `view_all_users`: 查看所有用户
- `view_user_chat_history`: 查看用户对话历史
- `ban_user`: 封禁用户
- `unban_user`: 解封用户
- `view_system_stats`: 查看系统统计
- `manage_agents`: 管理智能体
- `manage_admins`: 管理管理员

## 安全特性

1. **实名认证检查**: 通过 `ENABLE_REALNAME_CHECK` 控制是否检查用户实名状态
2. **速率限制**: 全局和聊天专用速率限制
3. **每日消息限制**: 限制用户每日发送消息数量
4. **JWT认证**: 安全的用户认证机制
5. **CORS保护**: 跨域请求保护
6. **输入验证**: 所有用户输入都经过验证
7. **SQL注入防护**: 使用参数化查询

## 部署说明

### 生产环境配置

1. 设置 `NODE_ENV=production`
2. 配置强密码的 `JWT_SECRET`
3. 配置生产环境的数据库连接
4. 配置生产环境的Redis连接
5. 配置正确的OAuth回调地址
6. 配置前端域名到CORS白名单

### Docker部署

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

## 开发指南

### 添加新的智能体

1. 编辑 `prompts/agents.json` 文件
2. 添加新的智能体配置
3. 重启服务

### 自定义速率限制

修改 `middleware/rateLimiter.js` 中的配置参数。

### 扩展API接口

在 `routes/` 目录下创建新的路由文件，并在 `src/app.js` 中注册。

## 故障排除

### 常见问题

1. **数据库连接失败**: 检查MySQL服务状态和连接配置
2. **Redis连接失败**: 检查Redis服务状态和连接配置
3. **OAuth登录失败**: 检查OAuth配置和回调地址
4. **LLM API调用失败**: 检查API密钥和网络连接

### 日志查看

日志文件位于 `logs/` 目录：
- `error.log`: 错误日志
- `combined.log`: 完整日志

## 记忆管理功能

### 功能特性
- **智能体独立记忆**: 每个智能体维护独立的对话记忆，互不干扰
- **可配置记忆参数**: 每个智能体可独立配置最大记忆条数和保存时间
- **会话管理**: 支持多会话、会话历史查看、会话删除等功能
- **自动记忆清理**: 根据配置的时间自动清理过期的对话记录
- **记忆持久化**: 对话记忆存储在数据库中，支持跨会话保持

### 配置示例
```json
{
  "id": "general_assistant",
  "name": "通用助手",
  "memory": {
    "max_messages": 20,
    "max_age_hours": 24,
    "enabled": true
  }
}
```

### 使用说明
1. **新建会话**: 发送消息时不指定sessionId，系统会自动创建新会话
2. **继续会话**: 发送消息时指定sessionId，AI会基于该会话的历史记忆回复
3. **会话管理**: 通过前端界面可以查看、切换、删除会话
4. **记忆清理**: 系统会根据配置自动清理过期记忆，也可手动清空

### 定时任务
```bash
# 手动清理过期记忆
npm run cleanup-memory

# 设置定时任务（每小时执行一次）
0 * * * * cd /path/to/project && npm run cleanup-memory
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
