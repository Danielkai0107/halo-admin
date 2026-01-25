import { where, orderBy } from 'firebase/firestore';
import { subscribeToCollection } from '../lib/firestore';
import type { Device } from '../types';

export const deviceService = {
  // 訂閱社區設備列表（根據 tags 篩選）
  // 注意：tags 陣列直接包含 tenantId，不是 "tenant_{id}" 格式
  subscribe: (tenantId: string, callback: (devices: Device[]) => void) => {
    const constraints: any[] = [
      where('tags', 'array-contains', tenantId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    ];
    
    return subscribeToCollection<Device>('devices', constraints, callback);
  },

  // 獲取社區設備（非即時）
  // 目前主要使用 subscribe，此方法保留以備未來使用
  getByTenant: async (_tenantId: string) => {
    return { data: [] };
  },
};
