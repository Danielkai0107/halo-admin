import { create } from 'zustand';
import type { User } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  
  login: (user, token) => {
    set({ user, token, isAuthenticated: true, isLoading: false });
  },
  
  logout: async () => {
    try {
      await authService.logout();
      set({ user: null, token: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
  
  setUser: (user) => {
    set({ user });
  },
  
  // 初始化認證狀態（監聽 Firebase Auth 變更）
  initialize: () => {
    authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // 獲取完整用戶資料
          const response = await authService.getProfile();
          const token = await firebaseUser.getIdToken();
          set({
            user: response.data,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to load user profile:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });
  },
}));
