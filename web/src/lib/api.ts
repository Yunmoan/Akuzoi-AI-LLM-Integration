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
    } else if (error.response?.status === 404) {
      // 404错误，通常是资源不存在
      console.error('资源不存在:', error.response.data);
    } else if (error.response?.status >= 500) {
      // 服务器错误
      console.error('服务器错误:', error.response.data);
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
  
  // 获取用户自己的统计信息
  getUserStats: () => api.get('/auth/stats'),
  
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
  
  // 创建新对话（清空记忆）
  createNewConversation: (agentId: string) =>
    api.post(`/chat/agent/${agentId}/new-conversation`),
  
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

  // 敏感词管理
  getSensitiveWordStats: () => api.get('/admin/sensitive-words/stats'),
  
  addSensitiveWord: (data: {
    word: string;
    category: string;
    level: string;
    synonyms?: string[];
    context?: string[];
  }) => api.post('/admin/sensitive-words', data),
  
  removeSensitiveWord: (word: string) => api.delete(`/admin/sensitive-words/${word}`),
  
  testSensitiveWordDetection: (data: {
    text: string;
    options?: any;
  }) => api.post('/admin/sensitive-words/test', data),
  
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
  
  // 更新用户每日消息限制
  updateUserDailyLimit: (userId: number, dailyLimit: number) =>
    api.put(`/admin/users/${userId}/daily-limit`, { daily_limit: dailyLimit }),
  
  // 获取系统统计
  getSystemStats: () => api.get('/admin/stats'),
  
  // 获取管理员操作日志
  getActions: (params?: { page?: number; limit?: number; adminUserId?: number }) =>
    api.get('/admin/actions', { params }),
  
  // 获取管理员配置
  getConfig: () => api.get('/admin/config'),
};

export default api; 