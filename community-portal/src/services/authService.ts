import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';

export const authService = {
  // 登入
  login: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error('登入錯誤:', error);
      throw error;
    }
  },

  // 登出
  logout: async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('登出錯誤:', error);
      throw error;
    }
  },

  // 獲取當前用戶
  getCurrentUser: () => {
    return auth.currentUser;
  },
};
