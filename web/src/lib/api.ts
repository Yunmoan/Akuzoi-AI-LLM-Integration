import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除token并重定向到登录页
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  // 获取OAuth登录链接
  getLoginUrl: () => api.get('/auth/login'),
  
  // OAuth回调处理
  handleCallback: (code: string, state: string) => 
    api.get(`/auth/callback?code=${code}&state=${state}`),
  
  // 设置昵称
  setNickname: (nickname: string) => 
    api.post('/auth/set-nickname', { nickname }),
  
  // 获取当前用户信息
  getCurrentUser: () => api.get('/auth/me'),
  
  // 登出
  logout: () => api.post('/auth/logout'),
};

// 智能体相关API
export const agentsAPI = {
  // 获取智能体列表
  getAgents: () => api.get('/agents'),
  
  // 获取智能体详情
  getAgent: (agentId: string) => api.get(`/agents/${agentId}`),
  
  // 获取用户与智能体的对话统计
  getConversations: (agentId: string) => 
    api.get(`/agents/${agentId}/conversations`),
};

// 聊天相关API
export const chatAPI = {
  // 发送消息
  sendMessage: (data: { agentId: string; message: string; sessionId?: string }) =>
    api.post('/chat/send', data),
  
  // 获取会话列表
  getSessions: (agentId?: string) =>
    api.get('/chat/sessions', { params: { agentId } }),
  
  // 获取会话历史
  getSessionHistory: (sessionId: string, agentId: string) =>
    api.get(`/chat/sessions/${sessionId}/history`, { params: { agentId } }),
  
  // 删除会话
  deleteSession: (sessionId: string) =>
    api.delete(`/chat/sessions/${sessionId}`),
  
  // 清空智能体所有对话
  clearAgentConversations: (agentId: string) =>
    api.delete(`/chat/agent/${agentId}/conversations`),
  
  // 更新会话标题
  updateSessionTitle: (sessionId: string, title: string) =>
    api.put(`/chat/sessions/${sessionId}/title`, { title }),
  
  // 获取今日统计
  getTodayStats: () => api.get('/chat/stats/today'),
  
  // 获取总体统计
  getOverviewStats: () => api.get('/chat/stats/overview'),
};

// 管理员相关API
export const adminAPI = {
  // 获取所有用户
  getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/users', { params }),
  
  // 获取用户详情
  getUser: (userId: number) => api.get(`/admin/users/${userId}`),
  
  // 获取用户聊天历史
  getUserChatHistory: (userId: number, params?: { page?: number; limit?: number }) =>
    api.get(`/admin/users/${userId}/chat-history`, { params }),
  
  // 获取用户统计信息
  getUserStats: (userId: number) => api.get(`/admin/users/${userId}/stats`),
  
  // 封禁用户
  banUser: (userId: number, reason: string) =>
    api.post(`/admin/users/${userId}/ban`, { reason }),
  
  // 解封用户
  unbanUser: (userId: number) =>
    api.post(`/admin/users/${userId}/unban`),
  
  // 获取系统统计
  getSystemStats: () => api.get('/admin/stats'),
  
  // 获取管理员操作日志
  getActions: (params?: { page?: number; limit?: number; adminUserId?: number }) =>
    api.get('/admin/actions', { params }),
  
  // 获取管理员配置
  getConfig: () => api.get('/admin/config'),
};

export default api; 