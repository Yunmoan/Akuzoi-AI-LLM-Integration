# 实名认证退出登录问题修复

## 问题描述

没有实名的用户会被直接退出登录而没有任何提示，用户体验很差。

## 问题分析

### 原因
1. **API响应拦截器问题**：在 `web/src/lib/api.ts` 中，当遇到 `REALNAME_REQUIRED` 错误时，会清除token并跳转
2. **认证检查逻辑问题**：在 `web/src/stores/auth.ts` 中，实名认证检查使用了 `window.location.href` 导致页面刷新
3. **React Router使用错误**：在 `App.tsx` 中错误地在 `<Router>` 外部使用了 `useNavigate()`

### 问题流程
1. 用户登录成功
2. 系统检查实名认证状态
3. 发现用户未实名认证
4. API响应拦截器清除token
5. 用户被强制退出登录 ❌

## 解决方案

### 1. 修复API响应拦截器

在 `web/src/lib/api.ts` 中修改实名认证错误处理：

```typescript
} else if (error.response?.status === 403) {
  if (error.response?.data?.code === 'REALNAME_REQUIRED') {
    // 实名认证错误，不清除token，让前端组件处理跳转
    console.log('需要实名认证，保持登录状态');
    // 不自动跳转，让前端组件处理
  } else if (error.response?.data?.message?.includes('封禁')) {
    // 封禁用户错误，显示封禁原因
    console.error('用户被封禁:', error.response.data);
    // 不自动跳转，让前端组件处理
  } else {
    // 其他权限错误
    console.error('权限不足:', error.response.data);
  }
}
```

### 2. 改进认证检查逻辑

在 `web/src/stores/auth.ts` 中添加navigate支持：

```typescript
interface AuthState {
  // ... 其他属性
  navigate?: (path: string) => void;
  setNavigate: (navigate: (path: string) => void) => void;
}

// 在checkAuth函数中使用navigate
const { token, navigate } = get();

// 检查实名认证状态
if (!user.realname_verified) {
  set({ 
    user, 
    isAuthenticated: true,  // 保持认证状态
    error: '请先完成实名认证' 
  });
  // 使用React Router跳转，避免页面刷新
  if (navigate) {
    navigate('/realname-verification');
  } else if (typeof window !== 'undefined') {
    window.location.href = '/realname-verification';
  }
  return;
}
```

### 3. 修复React Router使用

在 `web/src/App.tsx` 中创建内部组件：

```typescript
// 内部组件，用于在Router内部使用useNavigate
function AppContent() {
  const { isAuthenticated, isLoading, checkAuth, setNavigate } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // 设置navigate函数
    setNavigate(navigate);
  }, [navigate, setNavigate]);

  useEffect(() => {
    // 应用启动时检查认证状态
    checkAuth();
  }, [checkAuth]);

  // ... 路由配置
}

function App() {
  return (
    <ErrorBoundary>
      <ToastManager>
        <Router>
          <div className="App">
            <AppContent />
          </div>
        </Router>
      </ToastManager>
    </ErrorBoundary>
  );
}
```

## 修复效果

### 修复前
1. 用户登录成功
2. 系统检测到未实名认证
3. 清除token，强制退出登录
4. 用户需要重新登录 ❌

### 修复后
1. 用户登录成功
2. 系统检测到未实名认证
3. 保持登录状态，显示提示信息
4. 自动跳转到实名认证页面
5. 用户可以完成实名认证 ✅

## 用户体验改进

### 1. 保持登录状态
- 不清除用户的token
- 保持用户的登录状态
- 避免重复登录

### 2. 友好提示
- 显示"请先完成实名认证"提示
- 引导用户完成实名认证流程

### 3. 平滑跳转
- 使用React Router的navigate
- 避免页面刷新
- 保持应用状态

## 部署步骤

### 1. 更新前端代码
```bash
cd web
npm run build
```

### 2. 重启服务
```bash
# 重启后端服务
pm2 restart your-app-name

# 重新加载Nginx配置
sudo nginx -t
sudo systemctl reload nginx
```

## 验证方法

### 1. 测试未实名用户登录
1. 使用未实名认证的账户登录
2. 检查是否保持登录状态
3. 检查是否自动跳转到实名认证页面
4. 检查是否有友好提示信息

### 2. 测试实名用户登录
1. 使用已实名认证的账户登录
2. 检查是否正常进入应用
3. 检查是否没有不必要的跳转

### 3. 测试实名认证流程
1. 完成实名认证
2. 检查是否自动跳转回应用
3. 检查功能是否正常

## 注意事项

1. **权限控制**：确保实名认证页面有适当的权限控制
2. **错误处理**：处理实名认证过程中的各种错误情况
3. **状态管理**：确保用户状态在整个流程中保持一致
4. **用户体验**：提供清晰的引导和反馈

## 总结

这个修复解决了实名认证退出登录的问题：

1. ✅ **保持登录状态**：不清除未实名用户的token
2. ✅ **友好提示**：显示清晰的提示信息
3. ✅ **平滑跳转**：使用React Router避免页面刷新
4. ✅ **改善体验**：用户无需重复登录

现在未实名认证的用户可以正常使用应用，并会被引导完成实名认证流程！
