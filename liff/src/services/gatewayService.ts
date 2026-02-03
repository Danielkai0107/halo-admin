import {
  query,
  where,
  orderBy,
  collection,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { getAllDocuments, subscribeToCollection } from "../lib/firestore";
import { MOCK_MODE, MOCK_DATA } from "../config/mockMode";
import type { Gateway, Store } from "../types";

// Helper function to join Store data
const joinStoreData = async (gateway: Gateway): Promise<Gateway> => {
  if (gateway.storeId) {
    try {
      const storeDoc = await getDoc(doc(db, "stores", gateway.storeId));
      if (storeDoc.exists()) {
        gateway.store = {
          id: storeDoc.id,
          ...storeDoc.data(),
        } as Store;
      }
    } catch (error) {
      console.error(`Failed to join store for gateway ${gateway.id}:`, error);
    }
  }
  return gateway;
};

export const gatewayService = {
  // 獲取所有啟用的 gateway
  getAll: async () => {
    // 切版模式：返回假資料
    if (MOCK_MODE) {
      return { data: MOCK_DATA.gateways as Gateway[] };
    }

    try {
      const constraints: any[] = [
        where("isActive", "==", true),
        orderBy("name", "asc"),
      ];
      const gateways = await getAllDocuments<Gateway>("gateways", constraints);

      // Join Store data
      const gatewaysWithStore = await Promise.all(
        gateways.map((gateway) => joinStoreData(gateway)),
      );

      return { data: gatewaysWithStore };
    } catch (error) {
      console.error("Failed to get gateways:", error);
      throw error;
    }
  },

  // 訂閱所有啟用的 gateway（即時更新）
  subscribe: (callback: (data: Gateway[]) => void) => {
    // 切版模式：返回假資料
    if (MOCK_MODE) {
      setTimeout(() => {
        callback(MOCK_DATA.gateways as Gateway[]);
      }, 100);
      return () => {};
    }

    const constraints: any[] = [
      where("isActive", "==", true),
      orderBy("name", "asc"),
    ];

    return subscribeToCollection<Gateway>(
      "gateways",
      constraints,
      async (gateways) => {
        // Join Store data for each gateway
        const gatewaysWithStore = await Promise.all(
          gateways.map((gateway) => joinStoreData(gateway)),
        );
        callback(gatewaysWithStore);
      },
    );
  },

  // 訂閱特定社區的 gateway
  subscribeByTenant: (
    tenantId: string,
    callback: (data: Gateway[]) => void,
  ) => {
    // 切版模式：返回假資料
    if (MOCK_MODE) {
      setTimeout(() => {
        callback(MOCK_DATA.gateways as Gateway[]);
      }, 100);
      return () => {};
    }

    const gatewaysRef = collection(db, "gateways");
    const q = query(
      gatewaysRef,
      where("isActive", "==", true),
      orderBy("name", "asc"),
    );

    return onSnapshot(q, async (snapshot) => {
      const gateways = snapshot.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Gateway),
        )
        .filter(
          (gateway) => !gateway.tenantId || gateway.tenantId === tenantId,
        );

      // Join Store data for each gateway
      const gatewaysWithStore = await Promise.all(
        gateways.map((gateway) => joinStoreData(gateway)),
      );

      callback(gatewaysWithStore);
    });
  },
};
