import { create } from 'zustand';
import { authAPI } from '@/lib/api';

export interface User {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  realname_verified: boolean;
  is_admin?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  navigate?: (path: string) => void;
  
  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setNavigate: (navigate: (path: string) => void) => void;
  checkAuth: () => Promise<void>;
  setNickname: (nickname: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  navigate: undefined,

  login: (token: string, user: User) => {
    localStorage.setItem('token', token);
    set({ token, user, isAuthenticated: true, error: null });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false, error: null });
  },

  setUser: (user: User) => {
    set({ user });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setNavigate: (navigate: (path: string) => void) => {
    set({ navigate });
  },

  checkAuth: async () => {
    const { token, navigate } = get();
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.getCurrentUser();
      const user = response.data.user;
      
      // 检查实名认证状态
      if (!user.realname_verified) {
        // 如果未实名认证，保持登录状态但跳转到实名认证页面
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
      
      // 调试信息
      console.log('🔍 认证检查调试信息:', {
        user: user,
        is_admin: user.is_admin,
        realname_verified: user.realname_verified
      });
      
      set({ user, isAuthenticated: true });
    } catch (error: any) {
      console.error('Auth check failed:', error);
      
      // 检查是否是实名认证错误
      if (error.response?.data?.code === 'REALNAME_REQUIRED') {
        // 保持登录状态但跳转到实名认证页面
        set({ 
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
      
      // 检查是否是401错误（token过期或无效）
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        set({ 
          token: null, 
          user: null, 
          isAuthenticated: false, 
          error: '登录已过期，请重新登录' 
        });
        return;
      }
      
      localStorage.removeItem('token');
      set({ 
        token: null, 
        user: null, 
        isAuthenticated: false, 
        error: error.response?.data?.message || '认证检查失败' 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  setNickname: async (nickname: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.setNickname(nickname);
      const user = response.data.user;
      set({ user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '设置昵称失败';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },
})); 