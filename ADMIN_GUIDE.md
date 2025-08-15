# 管理员系统使用指南

## 概述

管理员系统允许指定的Natayark用户拥有特殊权限，可以管理用户、查看对话历史、封禁用户等。

## 配置管理员

### 1. 编辑管理员配置文件

编辑 `config/admins.json` 文件，添加管理员信息：

```json
{
  "admins": [
    {
      "oauth_username": "your_natayark_username",
      "role": "super_admin",
      "permissions": [
        "view_all_users",
        "view_user_chat_history",
        "ban_user",
        "unban_user",
        "view_system_stats",
        "manage_agents"
      ],
      "enabled": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. 管理员角色说明

#### 超级管理员 (super_admin)
- 拥有所有权限
- 可以管理其他管理员
- 可以查看系统统计
- 可以管理智能体配置

#### 内容审核员 (moderator)
- 查看所有用户
- 查看用户对话历史
- 封禁/解封用户
- 无法管理管理员或智能体

### 3. 权限说明

| 权限 | 说明 |
|------|------|
| `view_all_users` | 查看系统中的所有用户列表 |
| `view_user_chat_history` | 查看指定用户的完整对话历史 |
| `ban_user` | 封禁用户，禁止其使用系统 |
| `unban_user` | 解除用户封禁状态 |
| `view_system_stats` | 查看系统整体使用统计 |
| `manage_agents` | 管理AI智能体配置 |
| `manage_admins` | 管理其他管理员账户 |

## 管理员功能

### 1. 用户管理

#### 查看所有用户
```bash
GET /api/admin/users?page=1&limit=20&search=关键词
```

#### 查看用户详情
```bash
GET /api/admin/users/{userId}
```

#### 查看用户聊天历史
```bash
GET /api/admin/users/{userId}/chat-history?page=1&limit=50
```

### 2. 用户封禁管理

#### 封禁用户
```bash
POST /api/admin/users/{userId}/ban
Content-Type: application/json

{
  "reason": "违反社区规则"
}
```

#### 解封用户
```bash
POST /api/admin/users/{userId}/unban
```

### 3. 系统监控

#### 查看系统统计
```bash
GET /api/admin/stats
```

返回数据包括：
- 用户统计（总用户数、封禁用户数、实名认证用户数、今日新增用户）
- 聊天统计（总消息数、总token使用量、今日消息数、今日token使用量）
- 智能体使用排行

#### 查看管理员操作日志
```bash
GET /api/admin/actions?page=1&limit=50&adminUserId=1
```

### 4. 配置管理

#### 查看管理员配置
```bash
GET /api/admin/config
```

## 使用示例

### 1. 使用curl测试管理员API

```bash
# 设置认证token
TOKEN="your_jwt_token"

# 查看所有用户
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/users?page=1&limit=10"

# 查看用户详情
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/users/1"

# 查看用户聊天历史
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/users/1/chat-history"

# 封禁用户
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "发布不当内容"}' \
  "http://localhost:3000/api/admin/users/1/ban"

# 解封用户
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/users/1/unban"

# 查看系统统计
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/stats"
```

### 2. 使用JavaScript测试

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/admin';
const TOKEN = 'your_jwt_token';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// 查看所有用户
async function getAllUsers() {
  try {
    const response = await api.get('/users?page=1&limit=10');
    console.log('用户列表:', response.data);
  } catch (error) {
    console.error('获取用户列表失败:', error.response?.data);
  }
}

// 封禁用户
async function banUser(userId, reason) {
  try {
    const response = await api.post(`/users/${userId}/ban`, { reason });
    console.log('封禁成功:', response.data);
  } catch (error) {
    console.error('封禁失败:', error.response?.data);
  }
}

// 查看系统统计
async function getSystemStats() {
  try {
    const response = await api.get('/stats');
    console.log('系统统计:', response.data);
  } catch (error) {
    console.error('获取统计失败:', error.response?.data);
  }
}
```

## 安全注意事项

### 1. 管理员账户安全
- 定期检查管理员列表
- 及时禁用离职管理员账户
- 使用强密码保护管理员账户

### 2. 操作审计
- 所有管理员操作都会记录日志
- 定期检查操作日志
- 发现异常操作及时处理

### 3. 权限最小化
- 只给管理员必要的权限
- 定期审查权限分配
- 避免过度授权

## 故障排除

### 1. 权限不足错误
```
{
  "success": false,
  "message": "权限不足"
}
```
**解决方案：**
- 检查用户是否在管理员列表中
- 确认管理员账户已启用
- 验证用户是否有相应权限

### 2. 用户不存在错误
```
{
  "success": false,
  "message": "用户不存在"
}
```
**解决方案：**
- 检查用户ID是否正确
- 确认用户确实存在于系统中

### 3. 配置加载失败
```
{
  "success": false,
  "message": "管理员配置加载失败"
}
```
**解决方案：**
- 检查 `config/admins.json` 文件是否存在
- 验证JSON格式是否正确
- 确认文件权限设置正确

## 最佳实践

1. **定期备份管理员配置**
2. **记录所有管理操作**
3. **定期审查管理员权限**
4. **建立管理员操作规范**
5. **监控异常操作行为** 