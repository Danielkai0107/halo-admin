import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '../types';

export const authService = {
  // 登入
  login: async (email: string, password: string) => {
    try {
      // Firebase Auth 登入
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // 從 Firestore 獲取用戶詳細資料
      const userDoc = await getDoc(doc(db, 'admin_users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('用戶資料不存在');
      }
      
      const userData = userDoc.data();
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || email,
        name: userData.name || '',
        role: userData.role || 'STAFF',
        tenantId: userData.tenantId || null,
        phone: userData.phone,
        avatar: userData.avatar,
      };
      
      return {
        data: {
          user,
          access_token: await firebaseUser.getIdToken(),
        },
      };
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // 登出
  logout: async () => {
    await signOut(auth);
  },

  // 獲取當前用戶資料
  getProfile: async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('未登入');
    }
    
    const userDoc = await getDoc(doc(db, 'admin_users', currentUser.uid));
    if (!userDoc.exists()) {
      throw new Error('用戶資料不存在');
    }
    
    const userData = userDoc.data();
    const user: User = {
      id: currentUser.uid,
      email: currentUser.email || '',
      name: userData.name || '',
      role: userData.role || 'STAFF',
      tenantId: userData.tenantId || null,
      phone: userData.phone,
      avatar: userData.avatar,
    };
    
    return { data: user };
  },

  // 獲取當前用戶（別名）
  getMe: async () => {
    return authService.getProfile();
  },

  // 監聽認證狀態變更
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  // 獲取當前 Firebase 用戶
  getCurrentUser: () => {
    return auth.currentUser;
  },
};
