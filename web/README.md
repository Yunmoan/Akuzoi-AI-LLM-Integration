# Akuzoi AI Web 前端

基于 React + TypeScript + Radix UI + Tailwind CSS 的现代化Web前端应用。

## 技术栈

- **框架**: React 18 + TypeScript
- **路由**: React Router DOM
- **UI组件**: Radix UI
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **构建工具**: Vite
- **图标**: Lucide React

## 功能特性

- 🔐 **OAuth登录** - 集成Natayark ID OAuth 2.0登录
- 💬 **智能对话** - 多智能体聊天界面
- 👤 **用户管理** - 昵称设置、用户信息管理
- 🛡️ **管理员系统** - 用户管理、系统监控
- 📱 **响应式设计** - 支持桌面和移动端
- 🎨 **现代化UI** - 基于Radix UI的组件库

## 快速开始

### 1. 安装依赖

```bash
cd web
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:3001` 启动。

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产版本

```bash
npm run preview
```

## 项目结构

```
web/
├── src/
│   ├── components/          # 组件
│   │   ├── ui/             # Radix UI组件
│   │   ├── Layout.tsx      # 布局组件
│   │   └── LoadingSpinner.tsx
│   ├── pages/              # 页面组件
│   │   ├── LoginPage.tsx   # 登录页面
│   │   ├── ChatPage.tsx    # 聊天页面
│   │   ├── AdminPage.tsx   # 管理员页面
│   │   └── SetNicknamePage.tsx
│   ├── stores/             # 状态管理
│   │   └── auth.ts         # 认证状态
│   ├── lib/                # 工具库
│   │   ├── api.ts          # API服务
│   │   └── utils.ts        # 工具函数
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 应用入口
│   └── index.css           # 全局样式
├── public/                 # 静态资源
├── package.json
├── vite.config.ts          # Vite配置
├── tailwind.config.js      # Tailwind配置
└── tsconfig.json           # TypeScript配置
```

## API代理配置

在 `vite.config.ts` 中配置了API代理，所有 `/api` 和 `/health` 请求都会被代理到后端服务器：

```typescript
server: {
  port: 3001,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      secure: false,
    },
    '/health': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

## 页面说明

### 登录页面 (`/login`)
- OAuth登录入口
- 自动重定向到Natayark ID授权页面

### 聊天页面 (`/chat`)
- 智能体选择侧边栏
- 实时聊天界面
- 消息历史记录
- 支持多智能体切换

### 管理员页面 (`/admin`)
- 系统统计仪表板
- 用户管理列表
- 用户搜索和筛选
- 封禁/解封功能

### 昵称设置页面 (`/set-nickname`)
- 新用户首次登录后设置昵称
- 表单验证和错误处理

## 状态管理

使用 Zustand 进行状态管理：

### 认证状态 (`stores/auth.ts`)
- 用户信息
- 登录状态
- Token管理
- 认证检查

## API服务

在 `lib/api.ts` 中定义了完整的API服务：

- `authAPI` - 认证相关API
- `agentsAPI` - 智能体相关API
- `chatAPI` - 聊天相关API
- `adminAPI` - 管理员相关API

## 组件库

基于 Radix UI 构建的组件库：

- `Button` - 按钮组件
- `Card` - 卡片组件
- `Input` - 输入框组件
- 更多组件在 `components/ui/` 目录下

## 样式系统

使用 Tailwind CSS 进行样式管理：

- 响应式设计
- 暗色模式支持
- 自定义CSS变量
- 组件样式变体

## 开发指南

### 添加新页面

1. 在 `src/pages/` 目录下创建页面组件
2. 在 `src/App.tsx` 中添加路由配置
3. 在 `src/components/Layout.tsx` 中添加导航链接（如需要）

### 添加新组件

1. 在 `src/components/` 目录下创建组件
2. 使用 Radix UI 作为基础组件
3. 使用 Tailwind CSS 进行样式设计

### 添加新API

1. 在 `src/lib/api.ts` 中添加API方法
2. 在相应的页面或组件中调用API
3. 处理加载状态和错误状态

## 部署

### 开发环境

```bash
npm run dev
```

### 生产环境

```bash
npm run build
npm run preview
```

### Docker部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "preview"]
```

## 注意事项

1. **后端服务** - 确保后端服务在 `http://localhost:3000` 运行
2. **OAuth配置** - 确保OAuth回调地址配置正确
3. **CORS设置** - 后端需要允许前端域名的跨域请求
4. **环境变量** - 生产环境需要配置正确的API地址

## 故障排除

### 常见问题

1. **API请求失败** - 检查后端服务是否运行
2. **OAuth登录失败** - 检查OAuth配置和回调地址
3. **样式不生效** - 检查Tailwind CSS配置
4. **TypeScript错误** - 检查类型定义和导入

### 调试技巧

1. 使用浏览器开发者工具查看网络请求
2. 检查控制台错误信息
3. 使用React Developer Tools调试组件状态
4. 检查Vite开发服务器日志 