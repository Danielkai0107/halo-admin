import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';

// 標準錯誤碼定義
const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// 用戶狀態定義
const UserStatus = {
  ACTIVE: 'ACTIVE',
  DELETED: 'DELETED',
  SUSPENDED: 'SUSPENDED',
  NOT_FOUND: 'NOT_FOUND',
} as const;

/**
 * Check Map User Status
 * GET /checkMapUserStatus?userId={userId}
 * 
 * 輕量級 API，用於快速檢查用戶狀態，不返回完整用戶資料
 * 
 * Query Parameters:
 * - userId: string (required)
 * 
 * Headers:
 * - Authorization: Bearer {FIREBASE_ID_TOKEN}
 * 
 * Response - 用戶存在:
 * {
 *   "success": true,
 *   "exists": true,
 *   "status": "ACTIVE",
 *   "userId": "string"
 * }
 * 
 * Response - 用戶不存在:
 * {
 *   "success": true,
 *   "exists": false,
 *   "status": "NOT_FOUND"
 * }
 */
export const checkMapUserStatus = onRequest(async (req, res) => {
  // CORS handling
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
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

    const userId = req.query.userId as string;

    // Validate userId
    if (!userId) {
      res.status(400).json({ 
        success: false, 
        error: '參數驗證失敗',
        errorCode: ErrorCodes.VALIDATION_ERROR,
        errorDetails: {
          fields: {
            userId: '缺少必填參數 userId'
          }
        }
      });
      return;
    }

    // Verify user can only check their own status (or admin can check any)
    if (userId !== authenticatedUserId) {
      const db = admin.firestore();
      const adminDoc = await db.collection('admin_users').doc(authenticatedUserId).get();
      const adminData = adminDoc.data();
      
      if (!adminData || (adminData.role !== 'SUPER_ADMIN' && adminData.role !== 'TENANT_ADMIN')) {
        res.status(403).json({ 
          success: false, 
          error: '禁止操作：無法查看其他用戶的狀態',
          errorCode: ErrorCodes.UNAUTHORIZED,
        });
        return;
      }
    }

    const db = admin.firestore();

    // Check user existence and status
    const userDoc = await db.collection('app_users').doc(userId).get();
    
    if (!userDoc.exists) {
      res.json({
        success: true,
        exists: false,
        status: UserStatus.NOT_FOUND,
      });
      return;
    }

    const userData = userDoc.data();

    // 判斷用戶狀態
    let status: string;
    if (userData?.isDeleted) {
      status = UserStatus.DELETED;
    } else if (userData?.isSuspended) {
      status = UserStatus.SUSPENDED;
    } else if (userData?.isActive === false) {
      status = UserStatus.SUSPENDED;
    } else {
      status = UserStatus.ACTIVE;
    }

    res.json({
      success: true,
      exists: true,
      status: status,
      userId: userId,
    });

  } catch (error: any) {
    console.error('Error in checkMapUserStatus:', error);
    res.status(500).json({ 
      success: false, 
      error: '伺服器內部錯誤',
      errorCode: ErrorCodes.INTERNAL_ERROR,
    });
  }
});
