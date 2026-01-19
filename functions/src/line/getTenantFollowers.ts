import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Client } from '@line/bot-sdk';

// 獲取指定社區的 LINE OA 好友列表
export const getTenantFollowers = functions.https.onCall(async (data, context) => {
  try {
    const { tenantId } = data;
    
    if (!tenantId) {
      throw new functions.https.HttpsError('invalid-argument', 'tenantId is required');
    }

    const db = admin.firestore();
    
    // 獲取社區資料
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Tenant not found');
    }
    
    const tenantData = tenantDoc.data();
    const channelAccessToken = tenantData?.lineChannelAccessToken;
    const channelSecret = tenantData?.lineChannelSecret;
    
    if (!channelAccessToken) {
      throw new functions.https.HttpsError('failed-precondition', 'Channel Access Token not configured');
    }

    // LINE Messaging API 沒有直接獲取好友列表的 API
    // 方法：獲取所有啟用的 appUsers，然後使用該社區的 Channel Access Token 驗證他們是否是該社區的好友
    const appUsersSnap = await db
      .collection('appUsers')
      .where('isActive', '==', true)
      .get();
    
    const client = new Client({
      channelAccessToken,
      channelSecret: channelSecret || '',
    });
    
    const followers: any[] = [];
    
    // 驗證每個用戶是否是該社區的好友
    for (const appUserDoc of appUsersSnap.docs) {
      const appUserData = appUserDoc.data();
      const lineUserId = appUserData.lineUserId;
      
      if (!lineUserId) continue;
      
      try {
        // 嘗試獲取用戶的 profile，如果成功則表示用戶是該社區的好友
        const profile = await client.getProfile(lineUserId);
        
        if (profile) {
          followers.push({
            id: appUserDoc.id,
            ...appUserData,
          });
        }
      } catch (error: any) {
        // 如果獲取失敗（例如用戶不是好友），跳過
        if (error.statusCode === 404 || error.message?.includes('not found')) {
          continue;
        }
        console.warn(`Error checking user ${lineUserId}:`, error.message);
      }
    }
    
    return { followers };
  } catch (error: any) {
    console.error('Error in getTenantFollowers:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
