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
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { db } from "../config/firebase";
import type { ShopUser, Store } from "../types";

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
    secondaryApp = initializeApp(firebaseConfig, "SecondaryShopUser");
    secondaryAuth = getAuth(secondaryApp);
  }
  return { app: secondaryApp, auth: secondaryAuth };
};

export const shopUserService = {
  // 訂閱所有商店用戶（即時監聽）
  subscribe: (callback: (data: ShopUser[]) => void) => {
    const q = query(collection(db, "shop_users"), orderBy("createdAt", "desc"));

    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((userDoc) => {
        const userData = userDoc.data();
        return {
          id: userDoc.id,
          ...userData,
        } as ShopUser;
      });

      callback(users);
    });
  },

  // 獲取所有商店用戶（非即時）
  getAll: async () => {
    try {
      const q = query(
        collection(db, "shop_users"),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((userDoc) => {
        const userData = userDoc.data();
        return {
          id: userDoc.id,
          ...userData,
        } as ShopUser;
      });

      return { data: users };
    } catch (error) {
      console.error("Failed to get shop users:", error);
      throw error;
    }
  },

  // 獲取單個商店用戶
  getOne: async (id: string) => {
    try {
      const userDoc = await getDoc(doc(db, "shop_users", id));

      if (!userDoc.exists()) {
        throw new Error("商店用戶不存在");
      }

      const userData = userDoc.data();

      return {
        data: {
          id: userDoc.id,
          ...userData,
        } as ShopUser,
      };
    } catch (error) {
      console.error("Failed to get shop user:", error);
      throw error;
    }
  },

  // 建立商店用戶（同時建立 Firebase Auth 和 Firestore 記錄）
  create: async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: "OWNER" | "STAFF";
  }) => {
    try {
      // 使用第二個 Firebase App 實例建立用戶，不影響當前登入狀態
      const { auth: secondAuth } = getSecondaryApp();

      // 1. 在 Firebase Auth 建立用戶
      const userCredential = await createUserWithEmailAndPassword(
        secondAuth,
        data.email,
        data.password,
      );

      const firebaseUid = userCredential.user.uid;

      // 2. 立即登出新建立的用戶（在第二個 App 實例）
      await signOut(secondAuth);

      // 3. 在 Firestore 建立 shop_users 記錄（使用主要 db 實例）
      const shopUserData = {
        firebaseUid: firebaseUid,
        email: data.email,
        name: data.name,
        phone: data.phone || null,
        avatar: null,
        role: data.role,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "shop_users", firebaseUid), shopUserData);

      return {
        data: {
          id: firebaseUid,
          ...shopUserData,
        },
      };
    } catch (error: any) {
      console.error("Failed to create shop user:", error);

      // 提供友善的錯誤訊息
      if (error.code === "auth/email-already-in-use") {
        throw new Error("此 Email 已被使用");
      } else if (error.code === "auth/weak-password") {
        throw new Error("密碼強度不足（至少 6 個字元）");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("無效的 Email 格式");
      }

      throw error;
    }
  },

  // 更新商店用戶
  update: async (id: string, data: Partial<ShopUser>) => {
    try {
      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      // 移除不應該更新的欄位
      delete updateData.id;
      delete updateData.firebaseUid;
      delete updateData.createdAt;

      await updateDoc(doc(db, "shop_users", id), updateData);

      return { data: { success: true } };
    } catch (error) {
      console.error("Failed to update shop user:", error);
      throw error;
    }
  },

  // 切換啟用狀態
  toggleActive: async (id: string) => {
    try {
      const userDoc = await getDoc(doc(db, "shop_users", id));

      if (!userDoc.exists()) {
        throw new Error("商店用戶不存在");
      }

      const currentStatus = userDoc.data().isActive;

      await updateDoc(doc(db, "shop_users", id), {
        isActive: !currentStatus,
        updatedAt: serverTimestamp(),
      });

      return { data: { success: true } };
    } catch (error) {
      console.error("Failed to toggle shop user active status:", error);
      throw error;
    }
  },

  // 刪除商店用戶（軟刪除）
  delete: async (id: string) => {
    try {
      // 檢查此用戶是否還管理任何商店
      const storesQuery = query(
        collection(db, "stores"),
        where("adminIds", "array-contains", id),
      );
      const storesSnapshot = await getDocs(storesQuery);

      if (!storesSnapshot.empty) {
        throw new Error(
          `無法刪除此用戶，該用戶還管理 ${storesSnapshot.size} 個商店。請先移除商店的管理員分配。`,
        );
      }

      // 軟刪除：將 isActive 設為 false
      await updateDoc(doc(db, "shop_users", id), {
        isActive: false,
        updatedAt: serverTimestamp(),
      });

      return { data: { success: true } };
    } catch (error) {
      console.error("Failed to delete shop user:", error);
      throw error;
    }
  },

  // 獲取未分配的商店用戶（供選擇器使用）
  getUnassigned: async () => {
    try {
      const q = query(
        collection(db, "shop_users"),
        where("isActive", "==", true),
        orderBy("name", "asc"),
      );

      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((userDoc) => {
        const userData = userDoc.data();
        return {
          id: userDoc.id,
          ...userData,
        } as ShopUser;
      });

      return { data: users };
    } catch (error) {
      console.error("Failed to get unassigned shop users:", error);
      throw error;
    }
  },

  // 獲取用戶管理的所有商店
  getManagedStores: async (userId: string) => {
    try {
      const storesQuery = query(
        collection(db, "stores"),
        where("adminIds", "array-contains", userId),
      );
      const storesSnapshot = await getDocs(storesQuery);

      const stores = storesSnapshot.docs.map((storeDoc) => ({
        id: storeDoc.id,
        ...storeDoc.data(),
      })) as Store[];

      return { data: stores };
    } catch (error) {
      console.error("Failed to get managed stores:", error);
      throw error;
    }
  },
};
