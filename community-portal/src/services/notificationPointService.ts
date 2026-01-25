import {
  query,
  where,
  orderBy,
  collection,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  getAllDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
} from '../lib/firestore';
import type { TenantNotificationPoint, Gateway } from '../types';

export const notificationPointService = {
  // 訂閱通知點列表
  subscribe: (tenantId: string, callback: (data: TenantNotificationPoint[]) => void) => {
    const constraints: any[] = [
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    ];

    return subscribeToCollection<TenantNotificationPoint>(
      'tenantNotificationPoints',
      constraints,
      async (points) => {
        // 載入關聯的 gateway 資料
        const pointsWithGateway = await Promise.all(
          points.map(async (point) => {
            if (point.gatewayId) {
              const gateway = await getDoc(doc(db, 'gateways', point.gatewayId));
              if (gateway.exists()) {
                return {
                  ...point,
                  gateway: { id: gateway.id, ...gateway.data() } as Gateway,
                };
              }
            }
            return point;
          })
        );
        callback(pointsWithGateway);
      }
    );
  },

  // 獲取通知點列表（非即時）
  getAll: async (tenantId: string) => {
    try {
      const constraints: any[] = [
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
      ];
      const points = await getAllDocuments<TenantNotificationPoint>(
        'tenantNotificationPoints',
        constraints
      );
      return { data: points };
    } catch (error) {
      console.error('Failed to get notification points:', error);
      throw error;
    }
  },

  // 新增通知點
  create: async (data: Partial<TenantNotificationPoint>) => {
    try {
      const id = await createDocument('tenantNotificationPoints', {
        ...data,
        notifyOnElderActivity: data.notifyOnElderActivity !== false, // 預設為 true
        isActive: data.isActive !== false, // 預設為 true
      });
      return { data: { id } };
    } catch (error) {
      console.error('Failed to create notification point:', error);
      throw error;
    }
  },

  // 更新通知點
  update: async (id: string, data: Partial<TenantNotificationPoint>) => {
    try {
      await updateDocument('tenantNotificationPoints', id, data);
      return { data: { success: true } };
    } catch (error) {
      console.error('Failed to update notification point:', error);
      throw error;
    }
  },

  // 刪除通知點
  delete: async (id: string) => {
    try {
      await deleteDocument('tenantNotificationPoints', id);
      return { data: { success: true } };
    } catch (error) {
      console.error('Failed to delete notification point:', error);
      throw error;
    }
  },

  // 獲取所有可用的 gateways（不限社區，讓社區管理員自行選擇）
  getAvailableGateways: async (_tenantId?: string) => {
    try {
      const gatewaysQuery = query(
        collection(db, 'gateways'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(gatewaysQuery);
      const gateways = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Gateway[];

      return { data: gateways };
    } catch (error) {
      console.error('Failed to get available gateways:', error);
      throw error;
    }
  },
};
