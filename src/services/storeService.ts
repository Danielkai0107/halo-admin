import {
  where,
  orderBy,
  doc,
  getDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  getDocument,
  getAllDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  subscribeToDocument,
  toPaginatedResponse,
} from "../lib/firestore";
import { db } from "../config/firebase";
import type { Store, ShopUser, Gateway } from "../types";

export const storeService = {
  // 訂閱商店列表（即時監聽）
  subscribe: (callback: (data: Store[]) => void) => {
    const constraints = [orderBy("createdAt", "desc")];
    return subscribeToCollection<Store>("stores", constraints, callback);
  },

  // 獲取所有商店（分頁）
  getAll: async (page: number = 1, limit: number = 10) => {
    try {
      const constraints = [orderBy("createdAt", "desc")];
      const allStores = await getAllDocuments<Store>("stores", constraints);

      // 手動實現分頁
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = allStores.slice(startIndex, endIndex);

      const response = toPaginatedResponse(
        paginatedData,
        page,
        limit,
        allStores.length,
      );
      return { data: response };
    } catch (error) {
      console.error("Failed to get stores:", error);
      throw error;
    }
  },

  // 獲取單個商店
  getOne: async (id: string) => {
    try {
      const store = await getDocument<Store>("stores", id);
      return { data: store };
    } catch (error) {
      console.error("Failed to get store:", error);
      throw error;
    }
  },

  // 訂閱單個商店（即時監聽）
  subscribeToOne: (id: string, callback: (data: Store | null) => void) => {
    return subscribeToDocument<Store>("stores", id, callback);
  },

  // 新增商店
  create: async (data: Partial<Store>) => {
    try {
      const storeData = {
        name: data.name || "",
        storeLogo: data.storeLogo || null,
        imageLink: data.imageLink || null,
        websiteLink: data.websiteLink || null,
        activityTitle: data.activityTitle || null,
        activityContent: data.activityContent || null,
        storePassword: data.storePassword || null,
        adminIds: data.adminIds || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
      };

      const id = await createDocument("stores", storeData);
      const store = await getDocument<Store>("stores", id);
      return { data: store };
    } catch (error) {
      console.error("Failed to create store:", error);
      throw error;
    }
  },

  // 更新商店
  update: async (id: string, data: Partial<Store>) => {
    try {
      await updateDocument("stores", id, data);
      const store = await getDocument<Store>("stores", id);
      return { data: store };
    } catch (error) {
      console.error("Failed to update store:", error);
      throw error;
    }
  },

  // 刪除商店
  delete: async (id: string) => {
    try {
      // 先檢查是否有 Gateway 綁定到此商店
      const gateways = await getAllDocuments<Gateway>("gateways", [
        where("storeId", "==", id),
      ]);

      if (gateways.length > 0) {
        throw new Error(
          `無法刪除商店，還有 ${gateways.length} 個 Gateway 綁定到此商店。請先解除綁定。`,
        );
      }

      await deleteDocument("stores", id);
      return { data: { success: true } };
    } catch (error) {
      console.error("Failed to delete store:", error);
      throw error;
    }
  },

  // 分配管理員到商店
  assignAdmin: async (storeId: string, shopUserId: string) => {
    try {
      const storeRef = doc(db, "stores", storeId);
      const storeDoc = await getDoc(storeRef);

      if (!storeDoc.exists()) {
        throw new Error("商店不存在");
      }

      const storeData = storeDoc.data();
      const adminIds = storeData.adminIds || [];

      if (adminIds.includes(shopUserId)) {
        throw new Error("此管理員已經被分配到這個商店");
      }

      await updateDocument("stores", storeId, {
        adminIds: arrayUnion(shopUserId),
      });

      const store = await getDocument<Store>("stores", storeId);
      return { data: store };
    } catch (error) {
      console.error("Failed to assign admin:", error);
      throw error;
    }
  },

  // 移除商店管理員
  removeAdmin: async (storeId: string, shopUserId: string) => {
    try {
      await updateDocument("stores", storeId, {
        adminIds: arrayRemove(shopUserId),
      });

      const store = await getDocument<Store>("stores", storeId);
      return { data: store };
    } catch (error) {
      console.error("Failed to remove admin:", error);
      throw error;
    }
  },

  // 獲取商店的管理員列表
  getAdmins: async (storeId: string) => {
    try {
      const store = await getDocument<Store>("stores", storeId);
      if (!store || !store.adminIds || store.adminIds.length === 0) {
        return { data: [] };
      }

      // 獲取所有管理員資料
      const admins = await Promise.all(
        store.adminIds.map(async (adminId) => {
          const admin = await getDocument<ShopUser>("shop_users", adminId);
          return admin;
        }),
      );

      return { data: admins.filter((admin) => admin !== null) };
    } catch (error) {
      console.error("Failed to get store admins:", error);
      throw error;
    }
  },

  // 綁定 Gateway 到商店
  assignGateway: async (storeId: string, gatewayId: string) => {
    try {
      // 檢查商店是否存在
      const store = await getDocument<Store>("stores", storeId);
      if (!store) {
        throw new Error("商店不存在");
      }

      // 更新 Gateway 的 storeId
      await updateDocument("gateways", gatewayId, {
        storeId: storeId,
      });

      return { data: { success: true } };
    } catch (error) {
      console.error("Failed to assign gateway:", error);
      throw error;
    }
  },

  // 解除 Gateway 綁定
  removeGateway: async (gatewayId: string) => {
    try {
      await updateDocument("gateways", gatewayId, {
        storeId: null,
      });

      return { data: { success: true } };
    } catch (error) {
      console.error("Failed to remove gateway:", error);
      throw error;
    }
  },

  // 獲取商店綁定的所有 Gateway
  getGateways: async (storeId: string) => {
    try {
      const gateways = await getAllDocuments<Gateway>("gateways", [
        where("storeId", "==", storeId),
        orderBy("createdAt", "desc"),
      ]);

      return { data: gateways };
    } catch (error) {
      console.error("Failed to get store gateways:", error);
      throw error;
    }
  },

  // 獲取未綁定商店的 Gateway 列表（供選擇器使用）
  getUnassignedGateways: async () => {
    try {
      const gateways = await getAllDocuments<Gateway>("gateways", [
        where("storeId", "==", null),
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
      ]);

      return { data: gateways };
    } catch (error) {
      console.error("Failed to get unassigned gateways:", error);
      throw error;
    }
  },
};
