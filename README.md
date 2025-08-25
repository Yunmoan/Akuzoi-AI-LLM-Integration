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

`.env` 的有关配置请参考：[.env.example](.env.example)

### 4. 数据库初始化

运行npm run start前，请先运行数据库初始化脚本： ``npm run init-db``
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

**注意**: 项目首次启动时会自动创建 `prompts/` 目录和默认的 `agents.json` 配置文件。

### 6. 部署前端

前端使用 react 开发，您可以自行修改 web/ 文件夹内容。

在 web/ 文件夹下，运行：

`` npm install ``

若要进行修改，请进行修改。

然后，运行构建：`` npm run build ``

将 dist 目录下的文件复制到您的服务器上。

配置 Nginx 反代理（反代理后端服务端）

```nginx

   #参考反代理部署配置

   location /api/ {
        # 移除 /api 前缀，代理到后端
        proxy_pass http://localhost:3000/api/; # 后端服务地址
        
        # 代理设置
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
    }

    # 健康检查端点
    location /health {
        proxy_pass http://localhost:3000/health; # 配置后端服务
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```

同样的。您需要配置“伪静态”以确保 react 应用正确地处理路由。

```nginx 
try_files $uri $uri/ /index.html;
```

部署完成。

### 7.设置管理员

您需要首先使用 Oauth 登录，并配置昵称。

然后，在数据库中对您的账户列表的 ``is_admin` 设置为 1。


***

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

### 自动初始化

项目首次启动时会自动创建 `prompts/` 目录和默认的 `agents.json` 配置文件。如果文件已存在，系统会保留现有配置。

### 配置文件位置

智能体配置文件位于 `prompts/agents.json`，包含以下字段：

#### 基础配置
- `id`: 智能体唯一标识符（必填）
- `name`: 智能体显示名称（必填）
- `description`: 智能体描述信息（必填）
- `avatar_url`: 智能体头像URL（必填）
- `enabled`: 是否启用该智能体（必填，true/false）

#### LLM模型配置
- `model`: 使用的LLM模型名称（必填）
  - 支持 OpenAI 模型：`gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo` 等
  - 支持其他兼容模型：`moonshotai/Kimi-K2-Instruct` 等
- `system_prompt`: 系统提示词（必填，不会泄露到前端）
- `max_tokens`: 单次回复最大token数（必填，建议1000-4000）
- `temperature`: 温度参数（必填，0.0-2.0）
  - `0.0`: 最确定性，适合事实性回答
  - `0.7`: 平衡创造性和准确性
  - `1.0+`: 更具创造性，适合创意写作

#### 记忆管理配置
- `memory`: 记忆管理配置对象
  - `enabled`: 是否启用记忆功能（必填，true/false）
  - `max_messages`: 最大记忆条数（必填，建议10-100）
  - `max_age_hours`: 记忆保存时间（小时，必填，建议24-168）

### 配置示例

```json
{
  "agents": [
    {
      "id": "general_assistant",
      "name": "通用助手",
      "description": "一个通用的AI助手，能够帮助用户解决各种问题",
      "avatar_url": "https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=AI",
      "model": "gpt-3.5-turbo",
      "system_prompt": "你是一个有用的AI助手。请用中文回答用户的问题，提供准确、有帮助的信息。",
      "max_tokens": 2000,
      "temperature": 0.7,
      "enabled": true,
      "memory": {
        "max_messages": 20,
        "max_age_hours": 24,
        "enabled": true
      }
    },
    {
      "id": "creative_writer",
      "name": "创意写作助手",
      "description": "专门帮助用户进行创意写作的AI助手",
      "avatar_url": "https://via.placeholder.com/100x100/10B981/FFFFFF?text=✍",
      "model": "gpt-3.5-turbo",
      "system_prompt": "你是一个专业的创意写作助手。你擅长故事创作、诗歌写作、文案撰写等。请用中文与用户交流，激发他们的创作灵感。",
      "max_tokens": 3000,
      "temperature": 0.9,
      "enabled": true,
      "memory": {
        "max_messages": 15,
        "max_age_hours": 48,
        "enabled": true
      }
    }
  ]
}
```

### 自定义智能体

1. **编辑配置文件**: 修改 `prompts/agents.json` 文件
2. **添加新智能体**: 在 `agents` 数组中添加新的智能体配置
3. **重启服务**: 修改配置后需要重启服务才能生效

### 配置最佳实践

1. **ID命名**: 使用小写字母和下划线，如 `general_assistant`, `creative_writer`
2. **模型选择**: 根据用途选择合适的模型和参数
3. **记忆配置**: 根据智能体用途调整记忆参数
4. **系统提示词**: 明确智能体的角色和行为规范
5. **测试验证**: 配置完成后测试智能体的响应效果

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
5. **智能体配置错误**: 检查 `agents.json` 文件格式和必填字段

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
