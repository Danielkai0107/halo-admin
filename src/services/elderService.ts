import {
  query,
  where,
  orderBy,
  collection,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  getDocument,
  getAllDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  toPaginatedResponse,
} from '../lib/firestore';
import type { Elder } from '../types';

export const elderService = {
  // 獲取所有長者（分頁）
  getAll: async (page: number = 1, limit: number = 10, tenantId?: string) => {
    try {
      const constraints = [];
      if (tenantId) {
        constraints.push(where('tenantId', '==', tenantId));
      }
      // 不強制排序，以免遺漏缺少 createdAt 的舊資料
      
      const allElders = await getAllDocuments<Elder>('elders', constraints);
      
      // 在記憶體中排序
      allElders.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      // 手動實現分頁
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = allElders.slice(startIndex, endIndex);
      
      const response = toPaginatedResponse(paginatedData, page, limit, allElders.length);
      return { data: response };
    } catch (error) {
      console.error('Failed to get elders:', error);
      throw error;
    }
  },

  // 訂閱長者列表（即時監聽）
  subscribe: (callback: (data: Elder[]) => void, tenantId?: string) => {
    const constraints = [];
    if (tenantId) {
      constraints.push(where('tenantId', '==', tenantId));
    }
    // 移除 orderBy 以免過濾掉缺少 createdAt 的舊資料
    
    return subscribeToCollection<Elder>('elders', constraints, (data) => {
      // 在記憶體中排序
      const sortedData = [...data].sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      callback(sortedData);
    });
  },

  // 獲取單個長者
  getOne: async (id: string) => {
    try {
      const elder = await getDocument<Elder>('elders', id);
      return { data: elder };
    } catch (error) {
      console.error('Failed to get elder:', error);
      throw error;
    }
  },

  // 獲取長者活動記錄（從 latest_locations/history 讀取）
  getActivity: async (id: string, hours: number = 24) => {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);
      
      const activityQuery = query(
        collection(db, 'latest_locations', id, 'history'),
        where('timestamp', '>=', Timestamp.fromDate(startTime)),
        orderBy('timestamp', 'desc')
      );
      
      const activitySnap = await getDocs(activityQuery);
      const activities = activitySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { data: activities };
    } catch (error) {
      console.error('Failed to get elder activity:', error);
      throw error;
    }
  },

  // 獲取長者位置記錄
  getLocation: async (id: string, limitCount: number = 50) => {
    try {
      const locationQuery = query(
        collection(db, 'elders', id, 'locations'),
        orderBy('timestamp', 'desc')
      );
      
      const locationSnap = await getDocs(locationQuery);
      const locations = locationSnap.docs
        .slice(0, limitCount)
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

      return { data: locations };
    } catch (error) {
      console.error('Failed to get elder location:', error);
      throw error;
    }
  },

  // 新增長者
  create: async (data: Partial<Elder>) => {
    try {
      const id = await createDocument('elders', {
        ...data,
        status: data.status || 'ACTIVE',
        inactiveThresholdHours: data.inactiveThresholdHours || 24,
        isActive: data.isActive !== undefined ? data.isActive : true,
        deviceId: data.deviceId || null,
      });
      const elder = await getDocument<Elder>('elders', id);
      return { data: elder };
    } catch (error) {
      console.error('Failed to create elder:', error);
      throw error;
    }
  },

  // 更新長者
  update: async (id: string, data: Partial<Elder>) => {
    try {
      await updateDocument('elders', id, data);
      const elder = await getDocument<Elder>('elders', id);
      return { data: elder };
    } catch (error) {
      console.error('Failed to update elder:', error);
      throw error;
    }
  },

  // 刪除長者
  delete: async (id: string) => {
    try {
      await deleteDocument('elders', id);
      return { data: { success: true } };
    } catch (error) {
      console.error('Failed to delete elder:', error);
      throw error;
    }
  },

  // 獲取可用設備（該社區未綁定的設備）
  getAvailableDevices: async (tenantId: string) => {
    try {
      // 查詢屬於該社區的所有設備
      const devicesQuery = query(
        collection(db, 'devices'),
        where('tenantId', '==', tenantId)
      );
      
      const devicesSnap = await getDocs(devicesQuery);
      const allDevices = devicesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 在客戶端過濾未綁定長者的設備（elderId 為 null 或 undefined）
      const availableDevices = allDevices.filter((device: any) => !device.elderId);

      return { data: availableDevices };
    } catch (error) {
      console.error('Failed to get available devices:', error);
      throw error;
    }
  },

  // 獲取長者最新位置
  getLatestLocation: async (elderId: string) => {
    try {
      const locationDoc = await getDocument<any>('latest_locations', elderId);
      return { data: locationDoc };
    } catch (error) {
      console.error('Failed to get latest location:', error);
      return { data: null };
    }
  },
};
