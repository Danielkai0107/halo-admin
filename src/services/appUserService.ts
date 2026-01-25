import {
  where,
  orderBy,
} from 'firebase/firestore';
import {
  getDocument,
  getAllDocuments,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  toPaginatedResponse,
} from '../lib/firestore';

export const appUserService = {
  // 獲取所有 App 用戶（分頁）
  getAll: (page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
      try {
        const constraints = [orderBy('createdAt', 'desc')];
        const allAppUsers = await getAllDocuments('line_users', constraints);
        
        // 手動實現分頁
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = allAppUsers.slice(startIndex, endIndex);
        
        const response = toPaginatedResponse(paginatedData, page, limit, allAppUsers.length);
        resolve({ data: response });
      } catch (error) {
        console.error('Failed to get app users:', error);
        reject(error);
      }
    });
  },

  // 訂閱 App 用戶列表（即時監聽）
  subscribe: (callback: (data: any[]) => void) => {
    const constraints = [orderBy('createdAt', 'desc')];
    return subscribeToCollection('line_users', constraints, callback);
  },

  // 獲取所有啟用的用戶（用於選擇器）
  // 優先顯示 LINE OA 好友（有 lineUserId 的用戶）
  getAllForSelection: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const constraints = [
          where('isActive', '==', true),
          orderBy('name', 'asc'),
        ];
        const appUsers = await getAllDocuments('line_users', constraints);
        
        // 優先顯示 LINE OA 好友（有 lineUserId 的用戶）
        const sortedUsers = appUsers.sort((a: any, b: any) => {
          const aHasLine = !!a.lineUserId;
          const bHasLine = !!b.lineUserId;
          if (aHasLine && !bHasLine) return -1;
          if (!aHasLine && bHasLine) return 1;
          return 0;
        });
        
        resolve({ data: sortedUsers });
      } catch (error) {
        console.error('Failed to get app users for selection:', error);
        reject(error);
      }
    });
  },

  // 獲取單個 App 用戶
  getOne: (id: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        const appUser = await getDocument('line_users', id);
        resolve({ data: appUser });
      } catch (error) {
        console.error('Failed to get app user:', error);
        reject(error);
      }
    });
  },

  // 更新 App 用戶
  update: (id: string, data: any) => {
    return new Promise(async (resolve, reject) => {
      try {
        await updateDocument('line_users', id, data);
        const appUser = await getDocument('line_users', id);
        resolve({ data: appUser });
      } catch (error) {
        console.error('Failed to update app user:', error);
        reject(error);
      }
    });
  },

  // 切換用戶啟用狀態
  toggleActive: (id: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        const appUser = await getDocument('line_users', id);
        if (!appUser) {
          throw new Error('App user not found');
        }
        
        const isActive = (appUser as any).isActive !== false;
        await updateDocument('line_users', id, { isActive: !isActive });
        
        const updatedAppUser = await getDocument('line_users', id);
        resolve({ data: updatedAppUser });
      } catch (error) {
        console.error('Failed to toggle app user active:', error);
        reject(error);
      }
    });
  },

  // 刪除 App 用戶
  delete: (id: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        await deleteDocument('line_users', id);
        resolve({ data: { success: true } });
      } catch (error) {
        console.error('Failed to delete app user:', error);
        reject(error);
      }
    });
  },
};
