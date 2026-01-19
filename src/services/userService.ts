import {
  where,
  orderBy,
} from 'firebase/firestore';
import {
  getDocument,
  getAllDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  toPaginatedResponse,
} from '../lib/firestore';
import type { User } from '../types';

export const userService = {
  // 獲取所有用戶（分頁）
  getAll: (page = 1, limit = 10, tenantId?: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        const constraints = [];
        
        if (tenantId) {
          constraints.push(where('tenantId', '==', tenantId));
        }
        
        constraints.push(orderBy('createdAt', 'desc'));
        
        const allUsers = await getAllDocuments<User>('users', constraints);
        
        // 手動實現分頁
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = allUsers.slice(startIndex, endIndex);
        
        const response = toPaginatedResponse(paginatedData, page, limit, allUsers.length);
        resolve({ data: response });
      } catch (error) {
        console.error('Failed to get users:', error);
        reject(error);
      }
    });
  },

  // 訂閱用戶列表（即時監聽）
  subscribe: (callback: (data: User[]) => void, tenantId?: string) => {
    const constraints = [];
    
    if (tenantId) {
      constraints.push(where('tenantId', '==', tenantId));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    
    return subscribeToCollection<User>('users', constraints, callback);
  },

  // 獲取單個用戶
  getOne: (id: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await getDocument<User>('users', id);
        resolve({ data: user });
      } catch (error) {
        console.error('Failed to get user:', error);
        reject(error);
      }
    });
  },

  // 創建用戶（注意：需要同時在 Firebase Auth 創建）
  create: (data: any) => {
    return new Promise(async (resolve, reject) => {
      try {
        // 在實際應用中，應該先在 Firebase Auth 創建用戶
        // 然後使用返回的 UID 作為文檔 ID
        const id = await createDocument('users', {
          email: data.email,
          name: data.name,
          role: data.role || 'STAFF',
          tenantId: data.tenantId || null,
          phone: data.phone,
          avatar: data.avatar,
          isActive: true,
        });
        const user = await getDocument<User>('users', id);
        resolve({ data: user });
      } catch (error) {
        console.error('Failed to create user:', error);
        reject(error);
      }
    });
  },

  // 更新用戶
  update: (id: string, data: any) => {
    return new Promise(async (resolve, reject) => {
      try {
        await updateDocument('users', id, data);
        const user = await getDocument<User>('users', id);
        resolve({ data: user });
      } catch (error) {
        console.error('Failed to update user:', error);
        reject(error);
      }
    });
  },

  // 刪除用戶
  delete: (id: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        await deleteDocument('users', id);
        resolve({ data: { success: true } });
      } catch (error) {
        console.error('Failed to delete user:', error);
        reject(error);
      }
    });
  },

  // 切換用戶啟用狀態
  toggleActive: (id: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await getDocument<User>('users', id);
        if (!user) {
          throw new Error('User not found');
        }
        
        // 假設有 isActive 字段
        const isActive = (user as any).isActive !== false;
        await updateDocument('users', id, { isActive: !isActive });
        
        const updatedUser = await getDocument<User>('users', id);
        resolve({ data: updatedUser });
      } catch (error) {
        console.error('Failed to toggle user active:', error);
        reject(error);
      }
    });
  },
};
