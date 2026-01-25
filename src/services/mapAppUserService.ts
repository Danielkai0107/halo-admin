import {
  where,
  orderBy,
} from 'firebase/firestore';
import {
  getDocument,
  getAllDocuments,
  createDocument,
  updateDocument,
  subscribeToCollection,
  toPaginatedResponse,
} from '../lib/firestore';
import { auth } from '../config/firebase';

export const mapAppUserService = {
  // 獲取所有地圖 App 用戶（分頁）
  getAll: (page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
      try {
        const constraints = [orderBy('createdAt', 'desc')];
        const allMapAppUsers = await getAllDocuments('app_users', constraints);
        
        // 手動實現分頁
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = allMapAppUsers.slice(startIndex, endIndex);
        
        const response = toPaginatedResponse(paginatedData, page, limit, allMapAppUsers.length);
        resolve({ data: response });
      } catch (error) {
        console.error('Failed to get map app users:', error);
        reject(error);
      }
    });
  },

  // 訂閱地圖 App 用戶列表（即時監聽）
  subscribe: (callback: (data: any[]) => void) => {
    const constraints = [orderBy('createdAt', 'desc')];
    return subscribeToCollection('app_users', constraints, callback);
  },

  // 獲取所有啟用的用戶（用於選擇器）
  getAllForSelection: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const constraints = [
          where('isActive', '==', true),
          orderBy('name', 'asc'),
        ];
        const mapAppUsers = await getAllDocuments('app_users', constraints);
        resolve({ data: mapAppUsers });
      } catch (error) {
        console.error('Failed to get map app users for selection:', error);
        reject(error);
      }
    });
  },

  // 獲取單個地圖 App 用戶
  getOne: (id: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        const mapAppUser = await getDocument('app_users', id);
        resolve({ data: mapAppUser });
      } catch (error) {
        console.error('Failed to get map app user:', error);
        reject(error);
      }
    });
  },

  // 創建地圖 App 用戶
  create: (data: any) => {
    return new Promise(async (resolve, reject) => {
      try {
        const newMapAppUser = {
          ...data,
          notificationEnabled: data.notificationEnabled ?? true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const docId = await createDocument('app_users', newMapAppUser);
        const mapAppUser = await getDocument('app_users', docId);
        resolve({ data: mapAppUser });
      } catch (error) {
        console.error('Failed to create map app user:', error);
        reject(error);
      }
    });
  },

  // 更新地圖 App 用戶
  update: (id: string, data: any) => {
    return new Promise(async (resolve, reject) => {
      try {
        const updateData = {
          ...data,
          updatedAt: new Date().toISOString(),
        };
        await updateDocument('app_users', id, updateData);
        const mapAppUser = await getDocument('app_users', id);
        resolve({ data: mapAppUser });
      } catch (error) {
        console.error('Failed to update map app user:', error);
        reject(error);
      }
    });
  },

  // 切換用戶啟用狀態
  toggleActive: (id: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        const mapAppUser = await getDocument('app_users', id);
        if (!mapAppUser) {
          throw new Error('Map app user not found');
        }
        
        const isActive = (mapAppUser as any).isActive !== false;
        await updateDocument('app_users', id, { 
          isActive: !isActive,
          updatedAt: new Date().toISOString(),
        });
        
        const updatedMapAppUser = await getDocument('app_users', id);
        resolve({ data: updatedMapAppUser });
      } catch (error) {
        console.error('Failed to toggle map app user active:', error);
        reject(error);
      }
    });
  },

  // 切換通知狀態
  toggleNotification: (id: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        const mapAppUser = await getDocument('app_users', id);
        if (!mapAppUser) {
          throw new Error('Map app user not found');
        }
        
        const notificationEnabled = (mapAppUser as any).notificationEnabled !== false;
        await updateDocument('app_users', id, { 
          notificationEnabled: !notificationEnabled,
          updatedAt: new Date().toISOString(),
        });
        
        const updatedMapAppUser = await getDocument('app_users', id);
        resolve({ data: updatedMapAppUser });
      } catch (error) {
        console.error('Failed to toggle notification:', error);
        reject(error);
      }
    });
  },

  // 綁定設備（調用 Cloud Function API）
  bindDevice: (id: string, deviceId: string, deviceNickname?: string, deviceOwnerAge?: number, deviceOwnerGender?: 'MALE' | 'FEMALE' | 'OTHER') => {
    return new Promise(async (resolve, reject) => {
      try {
        // 獲取當前用戶的 ID Token
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }
        const idToken = await user.getIdToken();

        // 調用 Cloud Function API
        const response = await fetch('https://binddevicetomapuser-kmzfyt3t5a-uc.a.run.app', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            userId: id,
            deviceId: deviceId,
            nickname: deviceNickname,
            age: deviceOwnerAge,
            gender: deviceOwnerGender,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to bind device');
        }

        // 重新獲取用戶資料以確保前端數據同步
        const mapAppUser = await getDocument('app_users', id);
        resolve({ data: mapAppUser });
      } catch (error: any) {
        console.error('Failed to bind device:', error);
        reject(error);
      }
    });
  },

  // 解綁設備（調用 Cloud Function API）
  unbindDevice: (id: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        // 獲取當前用戶的 ID Token
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }
        const idToken = await user.getIdToken();

        // 調用 Cloud Function API
        const response = await fetch('https://unbinddevicefrommapuser-kmzfyt3t5a-uc.a.run.app', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            userId: id,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to unbind device');
        }

        // 重新獲取用戶資料以確保前端數據同步
        const mapAppUser = await getDocument('app_users', id);
        resolve({ data: mapAppUser });
      } catch (error: any) {
        console.error('Failed to unbind device:', error);
        reject(error);
      }
    });
  },

  // 刪除地圖 App 用戶（調用 Cloud Function 進行完整刪除）
  delete: (id: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        // 獲取當前用戶的 ID Token
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }
        const idToken = await user.getIdToken();

        // 調用 Cloud Function API 進行完整刪除（包含 Auth + Firestore + 解綁設備）
        const response = await fetch('https://us-central1-safe-net-tw.cloudfunctions.net/deleteMapAppUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            userId: id,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to delete map app user');
        }

        resolve({ data: { success: true, details: data.details } });
      } catch (error: any) {
        console.error('Failed to delete map app user:', error);
        reject(error);
      }
    });
  },
};
