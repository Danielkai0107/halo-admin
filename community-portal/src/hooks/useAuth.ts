import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import type { SaasUser, Tenant } from '../types';

export const useAuth = () => {
  const { user, tenant, loading, setUser, setTenant, setLoading, clear } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        clear();
        return;
      }

      try {
        // 透過 firebaseUid 獲取 saas_users 記錄（文件 ID 就是 Firebase UID）
        const userDoc = await getDoc(doc(db, 'saas_users', firebaseUser.uid));

        if (!userDoc.exists()) {
          console.error('找不到用戶記錄');
          clear();
          return;
        }

        const userData = userDoc.data();
        const saasUser: SaasUser = {
          id: userDoc.id,
          firebaseUid: userData.firebaseUid,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          avatar: userData.avatar,
          tenantId: userData.tenantId,
          role: userData.role,
          isActive: userData.isActive,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        };

        // 檢查帳號狀態
        if (!saasUser.isActive) {
          console.error('您的帳號已被停用');
          await auth.signOut();
          clear();
          return;
        }

        // 檢查是否有社區 ID
        if (!saasUser.tenantId) {
          console.error('您尚未被分配到任何社區');
          await auth.signOut();
          clear();
          return;
        }

        // 獲取社區資料
        const tenantDoc = await getDoc(doc(db, 'tenants', saasUser.tenantId));

        if (!tenantDoc.exists()) {
          console.error('找不到社區資料');
          await auth.signOut();
          clear();
          return;
        }

        const tenantData: Tenant = {
          id: tenantDoc.id,
          ...tenantDoc.data(),
        } as Tenant;

        setUser(saasUser);
        setTenant(tenantData);
        setLoading(false);
      } catch (error) {
        console.error('認證錯誤:', error);
        clear();
      }
    });

    return () => unsubscribe();
  }, [setUser, setTenant, setLoading, clear]);

  return {
    user,
    tenant,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    tenantId: user?.tenantId,
  };
};
