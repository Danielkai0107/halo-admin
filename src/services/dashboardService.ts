import {
  where,
} from 'firebase/firestore';
import {
  getAllDocuments,
} from '../lib/firestore';
import type { DashboardStats, Tenant, Elder, Device, Gateway, Alert } from '../types';

export const dashboardService = {
  // 獲取總覽統計
  getOverview: async () => {
    try {
      // 並行查詢所有集合的統計
      const [tenants, elders, devices, gateways, alerts] = await Promise.all([
        getAllDocuments<Tenant>('tenants'),
        getAllDocuments<Elder>('elders'),
        getAllDocuments<Device>('devices'),
        getAllDocuments<Gateway>('gateways'),
        getAllDocuments<Alert>('alerts'),
      ]);

      // 統計活躍的長者
      const activeElders = elders.filter(e => e.status === 'ACTIVE').length;

      // 統計待處理的警報
      const pendingAlerts = alerts.filter(a => a.status === 'PENDING').length;

      // 統計今天的警報
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayAlerts = alerts.filter(a => {
        const triggeredAt = new Date(a.triggeredAt);
        return triggeredAt >= today;
      }).length;

      // 統計今天的日誌（這裡簡化處理）
      const todayLogs = 0; // 實際應該從 logs 集合查詢

      const stats: DashboardStats = {
        tenants: { total: tenants.length },
        elders: { total: elders.length, active: activeElders },
        devices: { total: devices.length },
        gateways: { total: gateways.length },
        alerts: { pending: pendingAlerts, today: todayAlerts },
        logs: { today: todayLogs },
      };

      return { data: stats };
    } catch (error) {
      console.error('Failed to get dashboard overview:', error);
      throw error;
    }
  },

  // 獲取特定社區的統計
  getTenantStats: async (tenantId: string) => {
    try {
      const [elders, devices, gateways, alerts] = await Promise.all([
        getAllDocuments<Elder>('elders', [where('tenantId', '==', tenantId)]),
        getAllDocuments<Device>('devices', [where('tenantId', '==', tenantId)]),
        getAllDocuments<Gateway>('gateways', [where('tenantId', '==', tenantId)]),
        getAllDocuments<Alert>('alerts', [where('tenantId', '==', tenantId)]),
      ]);

      const activeElders = elders.filter(e => e.status === 'ACTIVE').length;
      const pendingAlerts = alerts.filter(a => a.status === 'PENDING').length;

      return {
        data: {
          elders: { total: elders.length, active: activeElders },
          devices: { total: devices.length },
          gateways: { total: gateways.length },
          alerts: { pending: pendingAlerts, total: alerts.length },
        },
      };
    } catch (error) {
      console.error('Failed to get tenant stats:', error);
      throw error;
    }
  },

  // 獲取活動統計（最近 N 天）
  getActivity: async (tenantId?: string, days: number = 7) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const constraints = [];
      if (tenantId) {
        constraints.push(where('tenantId', '==', tenantId));
      }
      constraints.push(where('triggeredAt', '>=', startDate.toISOString()));

      const alerts = await getAllDocuments<Alert>('alerts', constraints);

      // 按日期分組統計
      const activityByDay: { [key: string]: number } = {};
      alerts.forEach(alert => {
        const date = new Date(alert.triggeredAt).toISOString().split('T')[0];
        activityByDay[date] = (activityByDay[date] || 0) + 1;
      });

      // 轉換為陣列格式
      const activity = Object.entries(activityByDay).map(([date, count]) => ({
        date,
        count,
      }));

      return { data: activity };
    } catch (error) {
      console.error('Failed to get activity:', error);
      throw error;
    }
  },

  // 獲取警報摘要
  getAlertsSummary: async (tenantId?: string) => {
    try {
      const constraints = [];
      if (tenantId) {
        constraints.push(where('tenantId', '==', tenantId));
      }

      const alerts = await getAllDocuments<Alert>('alerts', constraints);

      // 按類型統計
      const byType: { [key: string]: number } = {};
      alerts.forEach(alert => {
        byType[alert.type] = (byType[alert.type] || 0) + 1;
      });

      // 按狀態統計
      const byStatus: { [key: string]: number } = {};
      alerts.forEach(alert => {
        byStatus[alert.status] = (byStatus[alert.status] || 0) + 1;
      });

      // 按嚴重程度統計
      const bySeverity: { [key: string]: number } = {};
      alerts.forEach(alert => {
        bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      });

      return {
        data: {
          total: alerts.length,
          byType,
          byStatus,
          bySeverity,
        },
      };
    } catch (error) {
      console.error('Failed to get alerts summary:', error);
      throw error;
    }
  },
};
