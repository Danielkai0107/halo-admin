import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';

// 標準錯誤碼定義
const ErrorCodes = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED',
} as const;

interface UpdateAvatarRequest {
  userId: string;
  avatar: string;  // 頭像 URL
}

/**
 * Update Map App User Avatar
 * POST /updateMapUserAvatar
 * 
 * 更新地圖 App 用戶的頭像
 * 
 * Request Body:
 * - userId: string (用戶 ID)
 * - avatar: string (頭像 URL)
 * 
 * Headers:
 * - Authorization: Bearer {FIREBASE_ID_TOKEN}
 */
export const updateMapUserAvatar = onRequest(async (req, res) => {
  // CORS handling
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ 
      success: false, 
      error: '不支援此請求方法',
      errorCode: ErrorCodes.VALIDATION_ERROR,
    });
    return;
  }

  try {
    // Verify Firebase ID Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false, 
        error: '未授權：缺少或無效的認證令牌',
        errorCode: ErrorCodes.UNAUTHORIZED,
      });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (tokenError) {
      res.status(401).json({ 
        success: false, 
        error: '未授權：認證令牌無效或已過期',
        errorCode: ErrorCodes.UNAUTHORIZED,
      });
      return;
    }
    
    const authenticatedUserId = decodedToken.uid;

    const body: UpdateAvatarRequest = req.body;

    // Validate request
    const validationErrors: Record<string, string> = {};
    
    if (!body.userId) {
      validationErrors.userId = '缺少必填欄位 userId';
    }
    
    if (!body.avatar) {
      validationErrors.avatar = '缺少必填欄位 avatar';
    }

    if (Object.keys(validationErrors).length > 0) {
      res.status(400).json({ 
        success: false, 
        error: '參數驗證失敗',
        errorCode: ErrorCodes.VALIDATION_ERROR,
        errorDetails: {
          fields: validationErrors
        }
      });
      return;
    }

    const db = admin.firestore();

    // 權限檢查：用戶只能更新自己的頭像（管理員除外）
    if (body.userId !== authenticatedUserId) {
      // 檢查是否為管理員
      const adminDoc = await db.collection('admin_users').doc(authenticatedUserId).get();
      const adminData = adminDoc.data();
      
      if (!adminData || (adminData.role !== 'SUPER_ADMIN' && adminData.role !== 'TENANT_ADMIN')) {
        res.status(403).json({ 
          success: false, 
          error: '禁止操作：無法更新其他用戶的頭像',
          errorCode: ErrorCodes.UNAUTHORIZED,
        });
        return;
      }
    }

    // 檢查用戶是否存在
    const userDoc = await db.collection('app_users').doc(body.userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ 
        success: false, 
        error: '帳號不存在或已被刪除',
        errorCode: ErrorCodes.USER_NOT_FOUND,
      });
      return;
    }

    const userData = userDoc.data();

    // 檢查用戶是否已被刪除標記
    if (userData?.isDeleted) {
      res.status(410).json({ 
        success: false, 
        error: '帳號已被刪除',
        errorCode: ErrorCodes.ACCOUNT_DELETED,
      });
      return;
    }

    // 更新頭像
    await db.collection('app_users').doc(body.userId).update({
      avatar: body.avatar,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 獲取更新後的用戶資料
    const updatedUserDoc = await db.collection('app_users').doc(body.userId).get();
    const updatedUserData = updatedUserDoc.data();

    res.json({
      success: true,
      user: {
        id: body.userId,
        avatar: updatedUserData?.avatar,
        updatedAt: updatedUserData?.updatedAt,
      },
    });

  } catch (error: any) {
    console.error('Error in updateMapUserAvatar:', error);
    res.status(500).json({ 
      success: false, 
      error: '伺服器內部錯誤',
      errorCode: ErrorCodes.INTERNAL_ERROR,
    });
  }
});
