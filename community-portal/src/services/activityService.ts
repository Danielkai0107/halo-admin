import {
  query,
  where,
  orderBy,
  limit,
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { NotificationLog } from '../types';

export const activityService = {
  // 取得有發送通知的活動記錄
  // 注意：活動記錄存在 devices/{deviceId}/activities，不是 elders/{elderId}/activities
  getNotificationLogs: async (
    elders: { id: string; name: string; deviceId?: string }[],
    startDate?: Date,
    endDate?: Date
  ): Promise<NotificationLog[]> => {
    const logs: any[] = [];

    try {
      // 只查詢有綁定設備的長者
      const eldersWithDevices = elders.filter(e => e.deviceId);
      
      if (eldersWithDevices.length === 0) {
        return [];
      }

      for (const elder of eldersWithDevices) {
        // 從設備的 activities 子集合查詢
        const activitiesRef = collection(db, 'devices', elder.deviceId!, 'activities');
        
        let q = query(
          activitiesRef,
          where('triggeredNotification', '==', true),
          where('notificationType', '==', 'LINE'),
          where('bindingType', '==', 'ELDER'),  // 只查詢綁定給長者時的記錄
          orderBy('timestamp', 'desc'),
          limit(100)
        );

        const snapshot = await getDocs(q);
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          
          // 檢查時間範圍
          let timestamp: Date;
          if (data.timestamp?.toDate && typeof data.timestamp.toDate === 'function') {
            timestamp = data.timestamp.toDate();
          } else if (data.timestamp?.seconds) {
            timestamp = new Date(data.timestamp.seconds * 1000);
          } else {
            timestamp = new Date(data.timestamp);
          }

          // 時間範圍過濾
          if (startDate && timestamp < startDate) return;
          if (endDate && timestamp > endDate) return;

          logs.push({
            id: doc.id,
            elderId: elder.id,
            elderName: elder.name,
            timestamp: data.timestamp,
            gatewayId: data.gatewayId,
            gatewayName: data.gatewayName || data.gateway?.name || '',
            gatewayType: data.gatewayType || data.gateway?.type || 'OBSERVE_ZONE',
            latitude: data.latitude,
            longitude: data.longitude,
            rssi: data.rssi,
            triggeredNotification: true,
            notificationType: 'LINE',
            notificationDetails: data.notificationDetails,
          });
        });
      }

      // 按時間排序（最新的在前）
      logs.sort((a, b) => {
        const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
        const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
        return bTime - aTime;
      });

      return logs;
    } catch (error) {
      console.error('Failed to get notification logs:', error);
      return [];
    }
  },
};
