import {
  query,
  where,
  collection,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Elder, Device } from '../types';

export interface DashboardStats {
  // 核心指標
  totalElders: number;
  activeElders: number;
  inactiveElders: number;
  devicesBound: number;
  devicesUnbound: number;
  
  // 通知統計
  notificationsToday: number;
  notificationsThisWeek: number;
  notificationPointsActive: number;
  
  // 設備健康
  lowBatteryDevices: number;
  offlineDevices: number;
  
  // 活動統計
  activitiesLast24h: number;
  activitiesLast7d: number;
}

export interface LocationHotspot {
  gatewayId: string;
  gatewayName: string;
  gatewayLocation?: string;
  count: number;
}

export interface InactiveElder {
  id: string;
  name: string;
  lastActivityAt?: string;
  hoursSinceLastActivity: number;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export const dashboardService = {
  // 獲取 Dashboard 統計資料
  getStats: async (tenantId: string): Promise<DashboardStats> => {
    try {
      // 查詢長者
      const eldersQuery = query(
        collection(db, 'elders'),
        where('tenantId', '==', tenantId),
        where('isActive', '==', true)
      );
      const eldersSnapshot = await getDocs(eldersQuery);
      const elders = eldersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Elder[];

      // 查詢設備
      const devicesQuery = query(
        collection(db, 'devices'),
        where('tags', 'array-contains', tenantId),
        where('isActive', '==', true)
      );
      const devicesSnapshot = await getDocs(devicesQuery);
      const devices = devicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Device[];

      // 查詢通知點
      const notificationPointsQuery = query(
        collection(db, 'tenantNotificationPoints'),
        where('tenantId', '==', tenantId),
        where('isActive', '==', true)
      );
      const notificationPointsSnapshot = await getDocs(notificationPointsQuery);

      // 計算不活躍長者（24小時無活動）
      const now = new Date();
      const inactiveThreshold = 24 * 60 * 60 * 1000; // 24 小時
      const inactiveElders = elders.filter(elder => {
        if (!elder.lastActivityAt) return true;
        const lastActivity = new Date(elder.lastActivityAt);
        return (now.getTime() - lastActivity.getTime()) > inactiveThreshold;
      });

      // 計算設備綁定狀態
      const boundDevices = devices.filter(d => d.bindingType === 'ELDER' || d.bindingType === 'MAP_USER');
      const unboundDevices = devices.filter(d => d.bindingType === 'UNBOUND');

      // 計算低電量設備
      const lowBatteryDevices = devices.filter(d => 
        d.batteryLevel !== undefined && d.batteryLevel < 20
      );

      // 計算離線設備（24小時未上線）
      const offlineDevices = devices.filter(d => {
        if (!d.lastSeen) return true;
        const lastSeen = new Date(d.lastSeen);
        return (now.getTime() - lastSeen.getTime()) > inactiveThreshold;
      });

      // 查詢最近的通知記錄（今日和本週）
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      let notificationsToday = 0;
      let notificationsThisWeek = 0;
      let activitiesLast24h = 0;
      let activitiesLast7d = 0;

      // 查詢所有有設備的長者的活動
      const eldersWithDevices = elders.filter(e => e.deviceId);
      
      for (const elder of eldersWithDevices.slice(0, 50)) { // 限制查詢數量，避免超時
        try {
          const activitiesQuery = query(
            collection(db, 'devices', elder.deviceId!, 'activities'),
            orderBy('timestamp', 'desc'),
            limit(100)
          );
          const activitiesSnapshot = await getDocs(activitiesQuery);
          
          activitiesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            let timestamp: Date;
            
            if (data.timestamp?.toDate) {
              timestamp = data.timestamp.toDate();
            } else if (data.timestamp?.seconds) {
              timestamp = new Date(data.timestamp.seconds * 1000);
            } else {
              timestamp = new Date(data.timestamp);
            }

            const hoursSince = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
            
            // 統計活動
            if (hoursSince <= 24) activitiesLast24h++;
            if (hoursSince <= 168) activitiesLast7d++; // 7天

            // 統計通知
            if (data.triggeredNotification && data.notificationType === 'LINE') {
              if (timestamp >= today) notificationsToday++;
              if (timestamp >= weekAgo) notificationsThisWeek++;
            }
          });
        } catch (error) {
          console.error(`Failed to query activities for elder ${elder.id}:`, error);
        }
      }

      return {
        totalElders: elders.length,
        activeElders: elders.length - inactiveElders.length,
        inactiveElders: inactiveElders.length,
        devicesBound: boundDevices.length,
        devicesUnbound: unboundDevices.length,
        notificationsToday,
        notificationsThisWeek,
        notificationPointsActive: notificationPointsSnapshot.size,
        lowBatteryDevices: lowBatteryDevices.length,
        offlineDevices: offlineDevices.length,
        activitiesLast24h,
        activitiesLast7d,
      };
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      throw error;
    }
  },

  // 獲取不活躍長者詳細列表
  getInactiveElders: async (tenantId: string, hoursThreshold: number = 24): Promise<InactiveElder[]> => {
    try {
      const eldersQuery = query(
        collection(db, 'elders'),
        where('tenantId', '==', tenantId),
        where('isActive', '==', true)
      );
      const eldersSnapshot = await getDocs(eldersQuery);
      const elders = eldersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Elder[];

      const now = new Date();
      const thresholdMs = hoursThreshold * 60 * 60 * 1000;

      const inactiveElders = elders
        .filter(elder => {
          if (!elder.lastActivityAt) return true;
          const lastActivity = new Date(elder.lastActivityAt);
          return (now.getTime() - lastActivity.getTime()) > thresholdMs;
        })
        .map(elder => {
          const hoursSince = elder.lastActivityAt
            ? Math.floor((now.getTime() - new Date(elder.lastActivityAt).getTime()) / (1000 * 60 * 60))
            : 9999;
          
          return {
            id: elder.id,
            name: elder.name,
            lastActivityAt: elder.lastActivityAt,
            hoursSinceLastActivity: hoursSince,
            phone: elder.phone,
            emergencyContact: elder.emergencyContact,
            emergencyPhone: elder.emergencyPhone,
          };
        })
        .sort((a, b) => b.hoursSinceLastActivity - a.hoursSinceLastActivity);

      return inactiveElders;
    } catch (error) {
      console.error('Failed to get inactive elders:', error);
      return [];
    }
  },

  // 獲取熱門點位統計
  getLocationHotspots: async (tenantId: string, days: number = 7): Promise<LocationHotspot[]> => {
    try {
      const eldersQuery = query(
        collection(db, 'elders'),
        where('tenantId', '==', tenantId),
        where('isActive', '==', true)
      );
      const eldersSnapshot = await getDocs(eldersQuery);
      const eldersWithDevices = eldersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Elder))
        .filter(e => e.deviceId);

      const locationCounts: Record<string, { name: string; location?: string; count: number }> = {};
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      for (const elder of eldersWithDevices.slice(0, 30)) { // 限制查詢數量
        try {
          const activitiesQuery = query(
            collection(db, 'devices', elder.deviceId!, 'activities'),
            where('bindingType', '==', 'ELDER'),
            orderBy('timestamp', 'desc'),
            limit(100)
          );
          const activitiesSnapshot = await getDocs(activitiesQuery);
          
          activitiesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            let timestamp: Date;
            
            if (data.timestamp?.toDate) {
              timestamp = data.timestamp.toDate();
            } else if (data.timestamp?.seconds) {
              timestamp = new Date(data.timestamp.seconds * 1000);
            } else {
              return;
            }

            if (timestamp < cutoffDate) return;

            const gatewayId = data.gatewayId;
            if (!gatewayId) return;

            if (!locationCounts[gatewayId]) {
              locationCounts[gatewayId] = {
                name: data.gatewayName || '未知位置',
                location: data.gatewayLocation,
                count: 0,
              };
            }
            locationCounts[gatewayId].count++;
          });
        } catch (error) {
          console.error(`Failed to query activities for elder ${elder.id}:`, error);
        }
      }

      // 轉換為陣列並排序
      const hotspots = Object.entries(locationCounts)
        .map(([gatewayId, data]) => ({
          gatewayId,
          gatewayName: data.name,
          gatewayLocation: data.location,
          count: data.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10

      return hotspots;
    } catch (error) {
      console.error('Failed to get location hotspots:', error);
      return [];
    }
  },
};
