import { create } from 'zustand';
import { authAPI } from '@/lib/api';

export interface User {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  realname_verified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  checkAuth: () => Promise<void>;
  setNickname: (nickname: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,

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

  checkAuth: async () => {
    const { token } = get();
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.getCurrentUser();
      const user = response.data.user;
      set({ user, isAuthenticated: true });
    } catch (error: any) {
      console.error('Auth check failed:', error);
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