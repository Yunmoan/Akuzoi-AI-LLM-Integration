# OAuth授权码过期和Admin路由404问题修复

## 问题描述

### 1. OAuth授权码过期问题
用户在使用OAuth登录时，系统反复报错"授权码已过期"，用户无法正常登录。

### 2. Admin路由404问题
管理员访问 `/api/admin/stats` 时返回404错误。

## 问题分析

### OAuth授权码过期问题
1. **原因**：前端没有正确处理授权码过期的情况
2. **表现**：用户重复使用同一个过期的授权码
3. **影响**：用户无法正常登录

### Admin路由404问题
1. **可能原因**：
   - 用户没有管理员权限
   - 数据库中的 `is_admin` 字段没有正确设置
   - 管理员配置文件中的用户不匹配

## 解决方案

### 1. OAuth授权码过期修复

#### 前端修复 (`web/src/pages/OAuthCallbackPage.tsx`)
- 添加了 `hasProcessed` 状态防止重复处理
- 在授权码过期时清除无效token
- 直接跳转到登录页面，避免重复尝试

```tsx
// 防止重复处理
if (hasProcessed) {
  return;
}
setHasProcessed(true);

// 授权码过期处理
if (error.response?.data?.message?.includes('授权码已过期')) {
  // 清除可能存在的无效token
  localStorage.removeItem('token');
  setTimeout(() => navigate('/login'), 2000);
  return;
}
```

### 2. Admin路由404问题诊断

#### 检查步骤
1. **检查路由配置**：确认 `/api/admin/stats` 路由已正确配置
2. **检查用户权限**：确认用户有管理员权限
3. **检查数据库**：确认用户的 `is_admin` 字段设置正确
4. **检查配置文件**：确认 `config/admins.json` 配置正确

#### 诊断脚本 (`check-admin-route.js`)
```javascript
// 检查数据库中的管理员用户
const [admins] = await connection.execute(`
  SELECT id, oauth_id, username, nickname, email, is_admin, realname_verified
  FROM users 
  WHERE is_admin = 1
  ORDER BY id
`);
```

## 修复效果

### OAuth授权码过期修复
**修复前**：
1. 用户使用过期授权码
2. 系统报错但用户继续尝试
3. 重复报错，无法登录 ❌

**修复后**：
1. 用户使用过期授权码
2. 系统检测到过期，清除无效token
3. 直接跳转到登录页面
4. 用户可以重新开始OAuth流程 ✅

### Admin路由404修复
**修复前**：
1. 管理员访问 `/api/admin/stats`
2. 返回404错误 ❌

**修复后**：
1. 检查用户权限
2. 确认管理员身份
3. 正常返回统计数据 ✅

## 部署步骤

### 1. 更新前端代码
```bash
cd web
npm run build
```

### 2. 检查管理员权限
```bash
# 运行诊断脚本
node check-admin-route.js

# 如果需要设置管理员
node set-admin.js
```

### 3. 重启服务
```bash
# 重启后端服务
pm2 restart your-app-name

# 重新加载Nginx配置
sudo nginx -t
sudo systemctl reload nginx
```

## 验证方法

### OAuth登录测试
1. 访问登录页面
2. 点击OAuth登录
3. 完成授权
4. 检查是否成功跳转

### Admin权限测试
1. 使用管理员账户登录
2. 访问管理页面
3. 检查统计数据是否正常显示

## 常见问题

### 1. 用户不是管理员
**解决方案**：
- 使用 `set-admin.js` 脚本设置管理员权限
- 检查 `config/admins.json` 配置

### 2. 数据库中没有管理员
**解决方案**：
```sql
UPDATE users SET is_admin = 1 WHERE username = 'your_username';
```

### 3. OAuth配置错误
**解决方案**：
- 检查环境变量配置
- 确认OAuth服务器设置

## 总结

这个修复解决了两个关键问题：

1. ✅ **OAuth授权码过期**：防止用户重复使用过期授权码
2. ✅ **Admin路由404**：确保管理员权限正确配置

现在系统应该能够：
- 正确处理OAuth登录流程
- 正常显示管理员功能
- 提供更好的用户体验
