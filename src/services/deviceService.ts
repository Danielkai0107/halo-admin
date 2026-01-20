import {
  query,
  where,
  orderBy,
  collection,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
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
import type { Device } from '../types';

export const deviceService = {
  // 獲取所有設備
  getAll: async (page: number = 1, limit: number = 10, tenantId?: string) => {
    try {
      const constraints = [];
      if (tenantId) {
        constraints.push(where('tenantId', '==', tenantId));
      }
      
      const allDevices = await getAllDocuments<Device>('devices', constraints);
      
      // 在記憶體中排序
      allDevices.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      // 手動分頁
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = allDevices.slice(startIndex, endIndex);
      
      const response = toPaginatedResponse(paginatedData, page, limit, allDevices.length);
      return { data: response };
    } catch (error) {
      console.error('Failed to get devices:', error);
      throw error;
    }
  },

  // 訂閱設備列表（即時監聽）
  subscribe: (callback: (data: Device[]) => void, tenantId?: string) => {
    const constraints = [];
    if (tenantId) {
      constraints.push(where('tenantId', '==', tenantId));
    }
    
    return subscribeToCollection<Device>('devices', constraints, (data) => {
      // 在記憶體中排序
      const sortedData = [...data].sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      callback(sortedData);
    });
  },

  // 獲取單個設備
  getOne: async (id: string) => {
    try {
      const device = await getDocument<Device>('devices', id);
      return { data: device };
    } catch (error) {
      console.error('Failed to get device:', error);
      throw error;
    }
  },

  // 根據 UUID 獲取設備（主要判定指標）
  getByUuid: async (uuid: string) => {
    try {
      const devicesQuery = query(
        collection(db, 'devices'),
        where('uuid', '==', uuid)
      );
      
      const devicesSnap = await getDocs(devicesQuery);
      if (devicesSnap.empty) {
        return { data: null };
      }
      
      const device = {
        id: devicesSnap.docs[0].id,
        ...devicesSnap.docs[0].data(),
      };

      return { data: device };
    } catch (error) {
      console.error('Failed to get device by UUID:', error);
      throw error;
    }
  },

  // 根據 MAC Address 獲取設備（輔助查詢）
  getByMacAddress: async (macAddress: string) => {
    try {
      const devicesQuery = query(
        collection(db, 'devices'),
        where('macAddress', '==', macAddress)
      );
      
      const devicesSnap = await getDocs(devicesQuery);
      if (devicesSnap.empty) {
        return { data: null };
      }
      
      const device = {
        id: devicesSnap.docs[0].id,
        ...devicesSnap.docs[0].data(),
      };

      return { data: device };
    } catch (error) {
      console.error('Failed to get device by MAC address:', error);
      throw error;
    }
  },

  // 根據 UUID + Major + Minor 獲取設備（Beacon 主要查詢方式）
  getByMajorMinor: async (uuid: string, major: number, minor: number) => {
    try {
      const devicesQuery = query(
        collection(db, 'devices'),
        where('uuid', '==', uuid),
        where('major', '==', major),
        where('minor', '==', minor)
      );
      
      const devicesSnap = await getDocs(devicesQuery);
      if (devicesSnap.empty) {
        return { data: null };
      }
      
      const device = {
        id: devicesSnap.docs[0].id,
        ...devicesSnap.docs[0].data(),
      };

      return { data: device };
    } catch (error) {
      console.error('Failed to get device by UUID/Major/Minor:', error);
      throw error;
    }
  },

  // 新增設備（初始登記，不綁定社區和長者）
  create: async (data: Partial<Device>) => {
    try {
      const id = await createDocument('devices', {
        ...data,
        type: data.type || 'GENERIC_BLE',
        tenantId: null, // 初始登記時不分配社區
        elderId: null, // 初始登記時不綁定長者
        isActive: data.isActive !== undefined ? data.isActive : true,
      });
      const device = await getDocument<Device>('devices', id);
      return { data: device };
    } catch (error) {
      console.error('Failed to create device:', error);
      throw error;
    }
  },

  // 更新設備
  update: async (id: string, data: Partial<Device>) => {
    try {
      await updateDocument('devices', id, data);
      const device = await getDocument<Device>('devices', id);
      return { data: device };
    } catch (error) {
      console.error('Failed to update device:', error);
      throw error;
    }
  },

  // 刪除設備
  delete: async (id: string) => {
    try {
      await deleteDocument('devices', id);
      return { data: { success: true } };
    } catch (error) {
      console.error('Failed to delete device:', error);
      throw error;
    }
  },

  // 關聯設備到長者（需要設備已分配到社區）- 雙向同步版本
  assignToElder: async (deviceId: string, elderId: string | null) => {
    try {
      const batch = writeBatch(db);
      const timestamp = serverTimestamp();
      
      // 1. 處理 Device 端
      const deviceRef = doc(db, 'devices', deviceId);
      
      // 如果要解綁
      if (!elderId) {
        // 找出原本綁定這個設備的所有長者（預防萬一，正常應該只有一個）
        const eldersQuery = query(collection(db, 'elders'), where('deviceId', '==', deviceId));
        const eldersSnap = await getDocs(eldersQuery);
        eldersSnap.forEach((elderDoc) => {
          batch.update(elderDoc.ref, { deviceId: null, updatedAt: timestamp });
        });

        batch.update(deviceRef, { elderId: null, updatedAt: timestamp });
      } else {
        // 如果要綁定
        
        // A. 先解除該長者原本可能綁定的「任何」設備
        const oldDevicesQuery = query(collection(db, 'devices'), where('elderId', '==', elderId));
        const oldDevicesSnap = await getDocs(oldDevicesQuery);
        oldDevicesSnap.forEach((deviceDoc) => {
          // 排除當前要綁定的設備，避免衝突
          if (deviceDoc.id !== deviceId) {
            batch.update(deviceDoc.ref, { elderId: null, updatedAt: timestamp });
          }
        });

        // B. 解除該設備原本可能綁定的「任何」長者
        const oldEldersQuery = query(collection(db, 'elders'), where('deviceId', '==', deviceId));
        const oldEldersSnap = await getDocs(oldEldersQuery);
        oldEldersSnap.forEach((elderDoc) => {
          if (elderDoc.id !== elderId) {
            batch.update(elderDoc.ref, { deviceId: null, updatedAt: timestamp });
          }
        });

        // C. 更新長者本身的 deviceId (處理可能沒被 query 抓到的情況)
        const elderRef = doc(db, 'elders', elderId);
        batch.update(elderRef, { deviceId: deviceId, updatedAt: timestamp });

        // D. 執行新的綁定
        batch.update(deviceRef, { elderId: elderId, updatedAt: timestamp });
      }
      
      await batch.commit();
      const updatedDevice = await getDocument<Device>('devices', deviceId);
      return { data: updatedDevice };
    } catch (error) {
      console.error('Failed to assign device to elder:', error);
      throw error;
    }
  },

  // 獲取未分配社區的設備（設備池）
  getUnassignedDevices: async () => {
    try {
      const constraints = [
        where('tenantId', '==', null),
        orderBy('createdAt', 'desc'),
      ];
      const devices = await getAllDocuments<Device>('devices', constraints);
      return { data: devices };
    } catch (error) {
      console.error('Failed to get unassigned devices:', error);
      throw error;
    }
  },

  // 獲取已分配社區但未綁定長者的設備
  getAvailableDevicesInTenant: async (tenantId: string) => {
    try {
      const constraints = [
        where('tenantId', '==', tenantId),
        where('elderId', '==', null),
        orderBy('createdAt', 'desc'),
      ];
      const devices = await getAllDocuments<Device>('devices', constraints);
      return { data: devices };
    } catch (error) {
      console.error('Failed to get available devices in tenant:', error);
      throw error;
    }
  },
};
