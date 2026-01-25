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

/**
 * Get Map App User Profile
 * GET /getMapUserProfile?userId={userId}
 * 
 * Returns complete user profile including:
 * - User information
 * - Bound device details (if any)
 * - Notification points list
 * 
 * Headers:
 * - Authorization: Bearer {FIREBASE_ID_TOKEN}
 */
export const getMapUserProfile = onRequest(async (req, res) => {
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

    // Verify user can only access their own profile
    if (userId !== authenticatedUserId) {
      res.status(403).json({ 
        success: false, 
        error: '禁止存取：無法查看其他用戶的資料',
        errorCode: ErrorCodes.UNAUTHORIZED,
      });
      return;
    }

    const db = admin.firestore();

    // 1. Get user data
    const userDoc = await db.collection('app_users').doc(userId).get();
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

    // 2. Prepare user info response
    const userInfo = {
      id: userId,
      email: userData?.email || null,
      name: userData?.name || 'Unknown User',
      phone: userData?.phone || null,
      avatar: userData?.avatar || null,
      notificationEnabled: userData?.notificationEnabled ?? true,
    };

    // 3. Get bound device details (if any)
    let boundDevice = null;
    if (userData?.boundDeviceId) {
      const deviceDoc = await db.collection('devices').doc(userData.boundDeviceId).get();
      if (deviceDoc.exists) {
        const deviceData = deviceDoc.data();
        boundDevice = {
          id: userData.boundDeviceId,
          deviceName: deviceData?.deviceName || `${deviceData?.major}-${deviceData?.minor}`,
          nickname: deviceData?.mapUserNickname || null,  // 從 Device 取得
          age: deviceData?.mapUserAge || null,            // 從 Device 取得
          uuid: deviceData?.uuid,
          major: deviceData?.major,
          minor: deviceData?.minor,
          boundAt: deviceData?.boundAt?.toDate?.() ? deviceData.boundAt.toDate().toISOString() : null,  // 從 Device 取得
        };
      }
    }

    // 4. Get notification points
    const notifPointsSnapshot = await db
      .collection('appUserNotificationPoints')
      .where('mapAppUserId', '==', userId)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const notificationPoints = await Promise.all(
      notifPointsSnapshot.docs.map(async (doc) => {
        const pointData = doc.data();
        
        // Get gateway info
        let gatewayInfo = null;
        if (pointData.gatewayId) {
          const gatewayDoc = await db.collection('gateways').doc(pointData.gatewayId).get();
          if (gatewayDoc.exists) {
            const gw = gatewayDoc.data();
            gatewayInfo = {
              name: gw?.name || 'Unknown Gateway',
              location: gw?.location || null,
              latitude: gw?.latitude || null,
              longitude: gw?.longitude || null,
            };
          }
        }

        return {
          id: doc.id,
          name: pointData.name,
          gatewayId: pointData.gatewayId,
          notificationMessage: pointData.notificationMessage || null,
          isActive: pointData.isActive,
          createdAt: pointData.createdAt?.toDate()?.toISOString() || null,
          gateway: gatewayInfo,
        };
      })
    );

    // 5. Return complete profile
    res.json({
      success: true,
      user: userInfo,
      boundDevice: boundDevice,
      notificationPoints: notificationPoints,
      timestamp: Date.now(),
    });

  } catch (error: any) {
    console.error('Error in getMapUserProfile:', error);
    res.status(500).json({ 
      success: false, 
      error: '伺服器內部錯誤',
      errorCode: ErrorCodes.INTERNAL_ERROR,
    });
  }
});
