import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '../config/firebase';
import type { SaasUser } from '../types';

// 建立第二個 Firebase App 實例用於建立用戶（不影響當前登入狀態）
const firebaseConfig = {
  apiKey: "AIzaSyArXubl605fS6mpgzni0gb1_3YZhgQGMxo",
  authDomain: "safe-net-tw.firebaseapp.com",
  projectId: "safe-net-tw",
  storageBucket: "safe-net-tw.firebasestorage.app",
  messagingSenderId: "290555063879",
  appId: "1:290555063879:web:fac080454a35863dbd4b62",
};

let secondaryApp: any = null;
let secondaryAuth: any = null;

const getSecondaryApp = () => {
  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, 'Secondary');
    secondaryAuth = getAuth(secondaryApp);
  }
  return { app: secondaryApp, auth: secondaryAuth };
};

export const saasUserService = {
  // 訂閱所有 SaaS 用戶（即時監聽）
  subscribe: (callback: (data: SaasUser[]) => void, tenantId?: string) => {
    let q = query(
      collection(db, 'saas_users'),
      orderBy('createdAt', 'desc')
    );

    if (tenantId) {
      q = query(q, where('tenantId', '==', tenantId));
    }

    return onSnapshot(q, async (snapshot) => {
      const users = await Promise.all(
        snapshot.docs.map(async (userDoc) => {
          const userData = userDoc.data();
          
          // 載入關聯的社區資料
          let tenant = null;
          if (userData.tenantId) {
            const tenantDoc = await getDoc(doc(db, 'tenants', userData.tenantId));
            if (tenantDoc.exists()) {
              tenant = { id: tenantDoc.id, ...tenantDoc.data() };
            }
          }

          return {
            id: userDoc.id,
            ...userData,
            tenant,
          } as SaasUser;
        })
      );

      callback(users);
    });
  },

  // 獲取所有用戶（非即時）
  getAll: async (tenantId?: string) => {
    try {
      let q = query(
        collection(db, 'saas_users'),
        orderBy('createdAt', 'desc')
      );

      if (tenantId) {
        q = query(q, where('tenantId', '==', tenantId));
      }

      const snapshot = await getDocs(q);
      const users = await Promise.all(
        snapshot.docs.map(async (userDoc) => {
          const userData = userDoc.data();
          
          // 載入關聯的社區資料
          let tenant = null;
          if (userData.tenantId) {
            const tenantDoc = await getDoc(doc(db, 'tenants', userData.tenantId));
            if (tenantDoc.exists()) {
              tenant = { id: tenantDoc.id, ...tenantDoc.data() };
            }
          }

          return {
            id: userDoc.id,
            ...userData,
            tenant,
          } as SaasUser;
        })
      );

      return { data: users };
    } catch (error) {
      console.error('Failed to get saas users:', error);
      throw error;
    }
  },

  // 獲取單個用戶
  getOne: async (id: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'saas_users', id));
      
      if (!userDoc.exists()) {
        throw new Error('用戶不存在');
      }

      const userData = userDoc.data();
      
      // 載入關聯的社區資料
      let tenant = null;
      if (userData.tenantId) {
        const tenantDoc = await getDoc(doc(db, 'tenants', userData.tenantId));
        if (tenantDoc.exists()) {
          tenant = { id: tenantDoc.id, ...tenantDoc.data() };
        }
      }

      return {
        data: {
          id: userDoc.id,
          ...userData,
          tenant,
        } as SaasUser,
      };
    } catch (error) {
      console.error('Failed to get saas user:', error);
      throw error;
    }
  },

  // 建立用戶（同時建立 Firebase Auth 和 Firestore 記錄）
  create: async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    tenantId: string;
    role: 'ADMIN' | 'MEMBER';
  }) => {
    try {
      // 使用第二個 Firebase App 實例建立用戶，不影響當前登入狀態
      const { auth: secondAuth } = getSecondaryApp();
      
      // 1. 在 Firebase Auth 建立用戶
      const userCredential = await createUserWithEmailAndPassword(
        secondAuth,
        data.email,
        data.password
      );
      
      const firebaseUid = userCredential.user.uid;
      
      // 2. 立即登出新建立的用戶（在第二個 App 實例）
      await signOut(secondAuth);

      // 3. 在 Firestore 建立 saas_users 記錄（使用主要 db 實例）
      const saasUserData = {
        firebaseUid: firebaseUid,
        email: data.email,
        name: data.name,
        phone: data.phone || null,
        avatar: null,
        tenantId: data.tenantId,
        role: data.role,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'saas_users', firebaseUid), saasUserData);

      return {
        data: {
          id: firebaseUid,
          ...saasUserData,
        },
      };
    } catch (error: any) {
      console.error('Failed to create saas user:', error);
      
      // 提供友善的錯誤訊息
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('此 Email 已被使用');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('密碼強度不足（至少 6 個字元）');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('無效的 Email 格式');
      }
      
      throw error;
    }
  },

  // 更新用戶
  update: async (id: string, data: Partial<SaasUser>) => {
    try {
      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      // 移除不應該更新的欄位
      delete updateData.id;
      delete updateData.firebaseUid;
      delete updateData.tenant;
      delete updateData.createdAt;

      await updateDoc(doc(db, 'saas_users', id), updateData);

      return { data: { success: true } };
    } catch (error) {
      console.error('Failed to update saas user:', error);
      throw error;
    }
  },

  // 切換啟用狀態
  toggleActive: async (id: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'saas_users', id));
      
      if (!userDoc.exists()) {
        throw new Error('用戶不存在');
      }

      const currentStatus = userDoc.data().isActive;
      
      await updateDoc(doc(db, 'saas_users', id), {
        isActive: !currentStatus,
        updatedAt: serverTimestamp(),
      });

      return { data: { success: true } };
    } catch (error) {
      console.error('Failed to toggle saas user active status:', error);
      throw error;
    }
  },

  // 刪除用戶（同時刪除 Firebase Auth 和 Firestore）
  delete: async (id: string) => {
    try {
      // 注意：需要 Firebase Admin SDK 才能刪除 Auth 用戶
      // 前端只能刪除 Firestore 記錄，或將 isActive 設為 false
      
      // 軟刪除：將 isActive 設為 false
      await updateDoc(doc(db, 'saas_users', id), {
        isActive: false,
        updatedAt: serverTimestamp(),
      });

      return { data: { success: true } };
    } catch (error) {
      console.error('Failed to delete saas user:', error);
      throw error;
    }
  },

  // 重設密碼（需要 Firebase Admin SDK，前端無法直接執行）
  // 此方法保留作為介面，實際需要透過 Cloud Function 實現
  resetPassword: async (_id: string, _newPassword: string) => {
    throw new Error('重設密碼功能需要透過後端 API 實現');
  },
};
