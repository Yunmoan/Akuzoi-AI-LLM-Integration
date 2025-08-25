# OAuth回调404问题修复

## 问题描述

用户在使用OAuth登录时，OAuth服务器重定向到 `https://akuzoi.zyghit.cn/auth/callback` 时出现404错误。

### 问题分析

1. **OAuth配置**：重定向URI设置为 `http://localhost:3001/auth/callback`
2. **前端路由**：配置为 `/auth/callback`（已修复）
3. **后端路由**：实际路径为 `/api/auth/callback`
4. **Nginx配置**：只代理了 `/api/` 路径，没有代理 `/auth/callback`

## 解决方案

### 1. 前端路由修复

修改 `web/src/App.tsx`，将OAuth回调路由从 `/oauth/callback` 改为 `/auth/callback`：

```tsx
<Route path="/auth/callback" element={<OAuthCallbackPage />} />
```

### 2. Nginx配置修复

在 `nginx-config-example.conf` 中添加对 `/auth/callback` 的代理配置：

```nginx
# OAuth回调代理 - 重要：将/auth/callback代理到后端
location /auth/callback {
    proxy_pass http://localhost:3055/api/auth/callback;
    
    # 代理设置
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # 超时设置
    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
    
    # 缓冲设置
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
}
```

## 路由流程

### 修复前
1. OAuth服务器重定向到 `/auth/callback`
2. Nginx找不到对应的代理配置
3. 返回404错误 ❌

### 修复后
1. OAuth服务器重定向到 `/auth/callback`
2. Nginx将请求代理到 `http://localhost:3055/api/auth/callback`
3. 后端处理OAuth回调
4. 返回成功响应 ✅

## 部署步骤

1. **更新前端代码**：
   ```bash
   cd web
   npm run build
   ```

2. **更新Nginx配置**：
   ```bash
   # 编辑Nginx配置文件
   sudo nano /etc/nginx/sites-available/your-site
   
   # 重新加载Nginx配置
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **重启后端服务**：
   ```bash
   # 重启Node.js应用
   pm2 restart your-app-name
   ```

## 验证方法

1. **测试OAuth登录流程**：
   - 访问登录页面
   - 点击OAuth登录
   - 完成授权
   - 检查是否成功跳转

2. **检查日志**：
   ```bash
   # 查看Nginx访问日志
   sudo tail -f /var/log/nginx/access.log
   
   # 查看应用日志
   pm2 logs your-app-name
   ```

## 注意事项

1. **OAuth配置**：确保OAuth服务器上的重定向URI配置正确
2. **域名配置**：确保Nginx配置中的域名与实际域名一致
3. **端口配置**：确保代理的端口号与后端服务端口一致
4. **HTTPS配置**：生产环境建议使用HTTPS

## 总结

这个修复解决了OAuth回调404的问题，通过：

1. ✅ 修正前端路由配置
2. ✅ 添加Nginx代理配置
3. ✅ 确保路由流程正确

现在OAuth登录流程应该可以正常工作了。
