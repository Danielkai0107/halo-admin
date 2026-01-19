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
} from '../lib/firestore';
import type { Elder, Activity } from '../types';

export const elderService = {
  // 獲取社區的所有長者
  getAll: async (tenantId: string) => {
    try {
      const constraints: any[] = [
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
      ];
      const elders = await getAllDocuments<Elder>('elders', constraints);
      return { data: elders };
    } catch (error) {
      console.error('Failed to get elders:', error);
      throw error;
    }
  },

  // 訂閱長者列表（即時監聽）
  subscribe: (tenantId: string, callback: (data: Elder[]) => void) => {
    const constraints: any[] = [
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    ];
    return subscribeToCollection<Elder>('elders', constraints, callback);
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
  getActivities: async (elderId: string, hours: number = 24) => {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);
      
      const activitiesQuery = query(
        collection(db, 'latest_locations', elderId, 'history'),
        where('timestamp', '>=', Timestamp.fromDate(startTime)),
        orderBy('timestamp', 'desc')
      );
      
      const activitiesSnap = await getDocs(activitiesQuery);
      const activities = activitiesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];

      return { data: activities };
    } catch (error) {
      console.error('Failed to get elder activities:', error);
      // 如果查詢失敗，返回空陣列而不是拋出錯誤
      console.error('Returning empty array due to error');
      return { data: [] };
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
      const devicesQuery = query(
        collection(db, 'devices'),
        where('tenantId', '==', tenantId)
      );
      
      const devicesSnap = await getDocs(devicesQuery);
      const allDevices = devicesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

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
