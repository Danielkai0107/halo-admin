import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { WebhookEvent, FollowEvent, Client, validateSignature } from '@line/bot-sdk';

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
};

// LINE Webhook 處理器
export const lineWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const events: WebhookEvent[] = req.body.events;
    const signature = req.headers['x-line-signature'] as string;
    const body = JSON.stringify(req.body);

    // 查找匹配的社區（通過 Channel Secret 驗證）
    const db = admin.firestore();
    const tenantsSnap = await db.collection('tenants').get();
    
    let matchedTenant: { id: string; channelSecret: string; channelAccessToken: string } | null = null;
    
    // 嘗試找到匹配的社區（通過驗證簽名）
    for (const tenantDoc of tenantsSnap.docs) {
      const tenantData = tenantDoc.data();
      if (tenantData.lineChannelSecret && signature) {
        try {
          if (validateSignature(body, tenantData.lineChannelSecret, signature)) {
            matchedTenant = {
              id: tenantDoc.id,
              channelSecret: tenantData.lineChannelSecret,
              channelAccessToken: tenantData.lineChannelAccessToken || '',
            };
            console.log('Matched tenant:', tenantDoc.id);
            break;
          }
        } catch (e) {
          // 繼續嘗試下一個社區
          console.warn(`Failed to validate signature for tenant ${tenantDoc.id}:`, e);
        }
      }
    }

    // 如果找不到匹配的社區，使用全局配置（向後兼容）
    if (!matchedTenant && config.channelSecret && signature) {
      try {
        if (validateSignature(body, config.channelSecret, signature)) {
          console.log('Using global config');
        }
      } catch (e) {
        console.warn('Signature validation failed, continuing anyway');
      }
    }

    await Promise.all(
      events.map(async (event) => {
        // 處理用戶加入（Follow）事件
        if (event.type === 'follow') {
          await handleFollow(event as FollowEvent, matchedTenant);
        }
        
        // 處理用戶取消好友（Unfollow）事件
        if (event.type === 'unfollow') {
          await handleUnfollow(event);
        }
      })
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 處理用戶加入事件
async function handleFollow(
  event: FollowEvent,
  matchedTenant: { id: string; channelSecret: string; channelAccessToken: string } | null
) {
  const lineUserId = event.source.userId;
  if (!lineUserId) return;

  const db = admin.firestore();

  try {
    // 確定使用的 Channel Access Token
    const channelAccessToken = matchedTenant?.channelAccessToken || config.channelAccessToken;
    
    // 嘗試獲取用戶的 LINE profile 資訊
    let lineDisplayName = 'LINE 用戶';
    let linePictureUrl: string | null = null;
    
    if (channelAccessToken) {
      try {
        const client = new Client({
          channelAccessToken,
          channelSecret: matchedTenant?.channelSecret || config.channelSecret,
        });
        const profile = await client.getProfile(lineUserId);
        lineDisplayName = profile.displayName;
        linePictureUrl = profile.pictureUrl || null;
        console.log('Got LINE profile:', { lineDisplayName, linePictureUrl });
      } catch (profileError) {
        console.warn('Failed to get LINE profile, using defaults:', profileError);
        // 如果獲取 profile 失敗，使用預設值
      }
    }

    // 檢查用戶是否已存在
    const existingUserQuery = await db
      .collection('appUsers')
      .where('lineUserId', '==', lineUserId)
      .limit(1)
      .get();

    let appUserId: string;
    
    if (!existingUserQuery.empty) {
      console.log('User already exists:', lineUserId);
      appUserId = existingUserQuery.docs[0].id;
      // 更新 isActive 為 true，並更新 LINE 資訊（如果用戶曾經取消好友後又加回）
      const updateData: any = {
        isActive: true,
        lineDisplayName,
        linePictureUrl,
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      // 如果找到了匹配的社區，記錄用戶是從哪個社區加入的
      if (matchedTenant) {
        updateData.joinedFromTenantId = matchedTenant.id;
      }
      
      await db.collection('appUsers').doc(appUserId).update(updateData);
    } else {
      // 創建新用戶記錄
      const userData: any = {
        lineUserId,
        lineDisplayName,
        linePictureUrl,
        email: null,
        name: lineDisplayName,
        phone: null,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      // 如果找到了匹配的社區，記錄用戶是從哪個社區加入的
      if (matchedTenant) {
        userData.joinedFromTenantId = matchedTenant.id;
      }
      
      const docRef = await db.collection('appUsers').add(userData);
      appUserId = docRef.id;
      console.log('New user created:', lineUserId, lineDisplayName, matchedTenant ? `from tenant ${matchedTenant.id}` : '');
    }

    // 如果找到了匹配的社區，自動將用戶添加到該社區的 members 中
    if (matchedTenant) {
      try {
        // 檢查用戶是否已經是該社區的成員
        const membersQuery = await db
          .collection('tenants')
          .doc(matchedTenant.id)
          .collection('members')
          .where('appUserId', '==', appUserId)
          .limit(1)
          .get();

        if (membersQuery.empty) {
          // 自動添加用戶為社區成員（預設為 MEMBER 角色）
          await db
            .collection('tenants')
            .doc(matchedTenant.id)
            .collection('members')
            .add({
              appUserId,
              role: 'MEMBER',
              status: 'APPROVED',
              approvedAt: admin.firestore.FieldValue.serverTimestamp(),
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          console.log(`Auto-added user to tenant: ${matchedTenant.id}`);
        } else {
          console.log(`User already a member of tenant: ${matchedTenant.id}`);
        }
      } catch (memberError) {
        console.error('Error adding user to tenant:', memberError);
        // 不中斷流程，繼續執行
      }
    }
  } catch (error) {
    console.error('Error handling follow event:', error);
  }
}

// 處理用戶取消好友事件
async function handleUnfollow(event: WebhookEvent) {
  const lineUserId = (event.source as any).userId;
  if (!lineUserId) return;

  const db = admin.firestore();

  try {
    // 找到用戶並標記為不活躍（不刪除，保留歷史記錄）
    const userQuery = await db
      .collection('appUsers')
      .where('lineUserId', '==', lineUserId)
      .limit(1)
      .get();

    if (!userQuery.empty) {
      const userId = userQuery.docs[0].id;
      await db.collection('appUsers').doc(userId).update({
        isActive: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('User unfollowed:', lineUserId);
    }
  } catch (error) {
    console.error('Error handling unfollow event:', error);
  }
}
