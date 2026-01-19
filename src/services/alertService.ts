import {
  where,
  Timestamp,
} from 'firebase/firestore';
import {
  getDocument,
  getAllDocuments,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  toPaginatedResponse,
} from '../lib/firestore';
import type { Alert, AlertType, AlertStatus } from '../types';

export const alertService = {
  // 獲取所有警報（分頁）
  getAll: async (
    page: number = 1,
    limit: number = 10,
    tenantId?: string,
    elderId?: string,
    type?: AlertType,
    status?: AlertStatus
  ) => {
    try {
      const constraints = [];
      
      if (tenantId) {
        constraints.push(where('tenantId', '==', tenantId));
      }
      if (elderId) {
        constraints.push(where('elderId', '==', elderId));
      }
      if (type) {
        constraints.push(where('type', '==', type));
      }
      if (status) {
        constraints.push(where('status', '==', status));
      }
      
      // 移除 orderBy，改在客戶端排序
      const allAlerts = await getAllDocuments<Alert>('alerts', constraints);
      
      // 在記憶體中排序
      allAlerts.sort((a: any, b: any) => {
        const timeA = a.triggeredAt?.seconds || 0;
        const timeB = b.triggeredAt?.seconds || 0;
        return timeB - timeA;
      });
      
      // 手動實現分頁
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = allAlerts.slice(startIndex, endIndex);
      
      const response = toPaginatedResponse(paginatedData, page, limit, allAlerts.length);
      return { data: response };
    } catch (error) {
      console.error('Failed to get alerts:', error);
      throw error;
    }
  },

  // 訂閱警報列表（即時監聽）
  subscribe: (
    callback: (data: Alert[]) => void,
    tenantId?: string,
    elderId?: string,
    type?: AlertType,
    status?: AlertStatus
  ) => {
    const constraints = [];
    
    if (tenantId) {
      constraints.push(where('tenantId', '==', tenantId));
    }
    if (elderId) {
      constraints.push(where('elderId', '==', elderId));
    }
    if (type) {
      constraints.push(where('type', '==', type));
    }
    if (status) {
      constraints.push(where('status', '==', status));
    }
    
    // 移除 orderBy 以避免索引問題，改在客戶端排序
    return subscribeToCollection<Alert>('alerts', constraints, (data) => {
      // 在記憶體中排序
      const sortedData = [...data].sort((a: any, b: any) => {
        const timeA = a.triggeredAt?.seconds || 0;
        const timeB = b.triggeredAt?.seconds || 0;
        return timeB - timeA; // 降序排列
      });
      callback(sortedData);
    });
  },

  // 獲取單個警報
  getOne: async (id: string) => {
    try {
      const alert = await getDocument<Alert>('alerts', id);
      return { data: alert };
    } catch (error) {
      console.error('Failed to get alert:', error);
      throw error;
    }
  },

  // 獲取警報統計
  getStats: async (tenantId?: string) => {
    try {
      const constraints = [];
      if (tenantId) {
        constraints.push(where('tenantId', '==', tenantId));
      }

      const allAlerts = await getAllDocuments<Alert>('alerts', constraints);
      
      // 統計各狀態的警報數量
      const pending = allAlerts.filter(a => a.status === 'PENDING').length;
      const notified = allAlerts.filter(a => a.status === 'NOTIFIED').length;
      const resolved = allAlerts.filter(a => a.status === 'RESOLVED').length;
      const dismissed = allAlerts.filter(a => a.status === 'DISMISSED').length;
      
      // 統計今天的警報
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayAlerts = allAlerts.filter(a => {
        const triggeredAt = new Date(a.triggeredAt);
        return triggeredAt >= today;
      });

      return {
        data: {
          pending,
          notified,
          resolved,
          dismissed,
          total: allAlerts.length,
          today: todayAlerts.length,
        },
      };
    } catch (error) {
      console.error('Failed to get alert stats:', error);
      throw error;
    }
  },

  // 解決警報
  resolve: async (id: string, resolvedBy: string, resolution: string) => {
    try {
      await updateDocument('alerts', id, {
        status: 'RESOLVED',
        resolvedBy,
        resolution,
        resolvedAt: Timestamp.now().toDate().toISOString(),
      });
      const alert = await getDocument<Alert>('alerts', id);
      return { data: alert };
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      throw error;
    }
  },

  // 忽略警報
  dismiss: async (id: string) => {
    try {
      await updateDocument('alerts', id, {
        status: 'DISMISSED',
        resolvedAt: Timestamp.now().toDate().toISOString(),
      });
      const alert = await getDocument<Alert>('alerts', id);
      return { data: alert };
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      throw error;
    }
  },

  // 刪除警報
  delete: async (id: string) => {
    try {
      await deleteDocument('alerts', id);
      return { data: { success: true } };
    } catch (error) {
      console.error('Failed to delete alert:', error);
      throw error;
    }
  },
};
