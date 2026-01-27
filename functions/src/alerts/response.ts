import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendNotification } from '../line/sendMessage';

interface ResponseData {
  alertId: string;
  memberId: string;  // appUser ID
  reason?: string;
}

// 接受警報分配
export const acceptAlertAssignment = functions.https.onCall(async (data: ResponseData, context) => {
  try {
    const { alertId, memberId } = data;

    if (!alertId || !memberId) {
      throw new functions.https.HttpsError('invalid-argument', '缺少必要參數');
    }

    const db = admin.firestore();

    // 1. 獲取警報資料
    const alertDoc = await db.collection('alerts').doc(alertId).get();
    if (!alertDoc.exists) {
      throw new functions.https.HttpsError('not-found', '找不到警報');
    }

    const alert = alertDoc.data();

    // 2. 驗證是否為被分配者
    if (alert?.assignedTo !== memberId) {
      throw new functions.https.HttpsError('permission-denied', '您不是此警報的處理人員');
    }

    // 3. 更新警報狀態
    await db.collection('alerts').doc(alertId).update({
      assignmentStatus: 'ACCEPTED',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4. 通知管理員（可選）
    // 可以在這裡添加通知管理員的邏輯

    return {
      success: true,
      message: '已接受處理此警報',
    };
  } catch (error: any) {
    console.error('Error in acceptAlertAssignment:', error);
    throw error;
  }
});

// 拒絕警報分配
export const declineAlertAssignment = functions.https.onCall(async (data: ResponseData, context) => {
  try {
    const { alertId, memberId, reason } = data;

    if (!alertId || !memberId) {
      throw new functions.https.HttpsError('invalid-argument', '缺少必要參數');
    }

    const db = admin.firestore();

    // 1. 獲取警報資料
    const alertDoc = await db.collection('alerts').doc(alertId).get();
    if (!alertDoc.exists) {
      throw new functions.https.HttpsError('not-found', '找不到警報');
    }

    const alert = alertDoc.data();
    const tenantId = alert?.tenantId;

    // 2. 驗證是否為被分配者
    if (alert?.assignedTo !== memberId) {
      throw new functions.https.HttpsError('permission-denied', '您不是此警報的處理人員');
    }

    // 3. 更新警報狀態
    await db.collection('alerts').doc(alertId).update({
      assignmentStatus: 'DECLINED',
      declineReason: reason || '無法處理',
      status: 'PENDING', // 重新設為待處理
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4. 通知管理員
    if (tenantId) {
      const tenantDoc = await db.collection('tenants').doc(tenantId).get();
      const tenant = tenantDoc.data();

      if (tenant?.lineChannelAccessToken) {
        // 獲取所有管理員
        const adminsQuery = await db
          .collection('tenants').doc(tenantId)
          .collection('members')
          .where('role', '==', 'ADMIN')
          .where('status', '==', 'APPROVED')
          .get();

        // 獲取拒絕者資料
        const memberDoc = await db.collection('appUsers').doc(memberId).get();
        const memberName = memberDoc.exists ? memberDoc.data()?.name : '成員';

        // 通知所有管理員
        const notificationPromises = adminsQuery.docs.map(async (doc) => {
          const adminData = doc.data();
          const adminUserDoc = await db.collection('appUsers').doc(adminData.appUserId).get();
          const adminUser = adminUserDoc.data();

          if (adminUser?.lineUserId) {
            const message = `警報分配被拒絕\n\n${memberName} 拒絕處理警報「${alert?.title}」\n${reason ? `原因：${reason}` : ''}\n\n請重新分配處理人員`;
            
            await sendNotification(
              adminUser.lineUserId,
              tenant.lineChannelAccessToken,
              message
            );
          }
        });

        await Promise.all(notificationPromises);
      }
    }

    return {
      success: true,
      message: '已拒絕處理，已通知管理員',
    };
  } catch (error: any) {
    console.error('Error in declineAlertAssignment:', error);
    throw error;
  }
});
