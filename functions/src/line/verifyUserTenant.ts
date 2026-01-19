import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Client } from '@line/bot-sdk';

// 驗證用戶是否屬於某個社區的 LINE OA 好友
export const verifyUserTenant = functions.https.onCall(async (data, context) => {
  try {
    const { lineUserId } = data;
    
    if (!lineUserId) {
      throw new functions.https.HttpsError('invalid-argument', 'lineUserId is required');
    }

    const db = admin.firestore();
    const tenantsSnap = await db.collection('tenants').get();
    
    const matchedTenants: string[] = [];
    
    // 遍歷所有社區，使用每個社區的 Channel Access Token 驗證用戶是否是好友
    for (const tenantDoc of tenantsSnap.docs) {
      const tenantData = tenantDoc.data();
      const channelAccessToken = tenantData.lineChannelAccessToken;
      
      if (!channelAccessToken) {
        continue; // 跳過沒有設置 Channel Access Token 的社區
      }
      
      try {
        const client = new Client({
          channelAccessToken,
          channelSecret: tenantData.lineChannelSecret || '',
        });
        
        // 嘗試獲取用戶的 profile，如果成功則表示用戶是該社區的好友
        const profile = await client.getProfile(lineUserId);
        
        if (profile) {
          matchedTenants.push(tenantDoc.id);
          console.log(`User ${lineUserId} is a friend of tenant ${tenantDoc.id}`);
        }
      } catch (error: any) {
        // 如果獲取失敗（例如用戶不是好友），繼續下一個社區
        if (error.statusCode === 404 || error.message?.includes('not found')) {
          // 用戶不是該社區的好友，繼續
          continue;
        }
        console.warn(`Error checking tenant ${tenantDoc.id}:`, error.message);
      }
    }
    
    return { matchedTenants };
  } catch (error: any) {
    console.error('Error in verifyUserTenant:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
