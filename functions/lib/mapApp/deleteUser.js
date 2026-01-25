"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMapAppUser = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
// 標準錯誤碼定義
const ErrorCodes = {
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    ACCOUNT_DELETED: 'ACCOUNT_DELETED',
};
/**
 * Delete Map App User (完整刪除流程)
 * POST /deleteMapAppUser
 *
 * 此 API 會執行完整的用戶刪除流程：
 * 0. 發送 FCM 推送通知（ACCOUNT_DELETED）
 * 1. 檢查並解綁設備（如果有綁定）
 * 2. 刪除用戶的通知點位
 * 3. 刪除 Firestore 中的用戶文檔
 * 4. 刪除 Firebase Auth 中的用戶帳號
 *
 * Request Body:
 * - userId: string (要刪除的用戶 ID)
 *
 * Headers:
 * - Authorization: Bearer {FIREBASE_ID_TOKEN}
 */
exports.deleteMapAppUser = (0, https_1.onRequest)(async (req, res) => {
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
        }
        catch (tokenError) {
            res.status(401).json({
                success: false,
                error: '未授權：認證令牌無效或已過期',
                errorCode: ErrorCodes.UNAUTHORIZED,
            });
            return;
        }
        const authenticatedUserId = decodedToken.uid;
        const body = req.body;
        // Validate request
        if (!body.userId) {
            res.status(400).json({
                success: false,
                error: '參數驗證失敗',
                errorCode: ErrorCodes.VALIDATION_ERROR,
                errorDetails: {
                    fields: {
                        userId: '缺少必填欄位 userId'
                    }
                }
            });
            return;
        }
        const db = admin.firestore();
        // 權限檢查：只有管理員或用戶本人可以刪除帳號
        if (body.userId !== authenticatedUserId) {
            // 檢查是否為管理員
            const adminDoc = await db.collection('admin_users').doc(authenticatedUserId).get();
            const adminData = adminDoc.data();
            if (!adminData || (adminData.role !== 'SUPER_ADMIN' && adminData.role !== 'TENANT_ADMIN')) {
                res.status(403).json({
                    success: false,
                    error: '禁止操作：無法刪除其他用戶',
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
        // Step 0: 發送 FCM 推送通知（如果用戶有 FCM token）
        let fcmNotificationSent = false;
        if (userData === null || userData === void 0 ? void 0 : userData.fcmToken) {
            try {
                await admin.messaging().send({
                    token: userData.fcmToken,
                    notification: {
                        title: '帳號已被刪除',
                        body: '您的帳號已被管理員刪除，請重新登入或聯繫客服。',
                    },
                    data: {
                        type: 'ACCOUNT_DELETED',
                        userId: body.userId,
                        timestamp: new Date().toISOString(),
                    },
                    // Android 特定設定
                    android: {
                        priority: 'high',
                        notification: {
                            channelId: 'account_management',
                            priority: 'high',
                            sound: 'default',
                        },
                    },
                    // iOS 特定設定
                    apns: {
                        payload: {
                            aps: {
                                alert: {
                                    title: '帳號已被刪除',
                                    body: '您的帳號已被管理員刪除，請重新登入或聯繫客服。',
                                },
                                sound: 'default',
                                badge: 1,
                            },
                        },
                    },
                });
                fcmNotificationSent = true;
                console.log(`FCM notification sent to user ${body.userId} before account deletion`);
            }
            catch (fcmError) {
                console.error(`Failed to send FCM notification to user ${body.userId}:`, fcmError);
                // 發送失敗不影響刪除流程，繼續執行
            }
        }
        else {
            console.log(`User ${body.userId} has no FCM token, skipping notification`);
        }
        // Step 1: 如果用戶有綁定設備，先解綁
        if (userData === null || userData === void 0 ? void 0 : userData.boundDeviceId) {
            console.log(`User ${body.userId} has bound device ${userData.boundDeviceId}, unbinding...`);
            const deviceId = userData.boundDeviceId;
            const timestamp = admin.firestore.FieldValue.serverTimestamp();
            // 生成唯一的歸檔批次 ID
            const archiveSessionId = db.collection('_').doc().id;
            // 1.1 複製 activities 到全域 anonymousActivities collection，然後刪除原記錄
            const activitiesRef = db.collection('devices').doc(deviceId).collection('activities');
            const anonymousRef = db.collection('anonymousActivities');
            const archiveAndDeleteActivities = async (snapshot) => {
                if (snapshot.empty)
                    return;
                const batch = db.batch();
                snapshot.docs.forEach((doc) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                    const data = doc.data();
                    // 複製到全域 anonymousActivities
                    const anonymousDoc = anonymousRef.doc();
                    batch.set(anonymousDoc, {
                        deviceId: deviceId,
                        timestamp: (_a = data.timestamp) !== null && _a !== void 0 ? _a : null,
                        gatewayId: (_b = data.gatewayId) !== null && _b !== void 0 ? _b : null,
                        gatewayName: (_c = data.gatewayName) !== null && _c !== void 0 ? _c : null,
                        gatewayType: (_d = data.gatewayType) !== null && _d !== void 0 ? _d : null,
                        latitude: (_e = data.latitude) !== null && _e !== void 0 ? _e : null,
                        longitude: (_f = data.longitude) !== null && _f !== void 0 ? _f : null,
                        rssi: (_g = data.rssi) !== null && _g !== void 0 ? _g : null,
                        triggeredNotification: (_h = data.triggeredNotification) !== null && _h !== void 0 ? _h : false,
                        notificationType: (_j = data.notificationType) !== null && _j !== void 0 ? _j : null,
                        notificationPointId: (_k = data.notificationPointId) !== null && _k !== void 0 ? _k : null,
                        bindingType: 'ANONYMOUS',
                        boundTo: null,
                        anonymizedAt: timestamp,
                        archiveSessionId: archiveSessionId,
                        originalActivityId: doc.id,
                    });
                    // 刪除原記錄
                    batch.delete(doc.ref);
                });
                await batch.commit();
            };
            // 處理 activities（分批處理）
            let activitiesSnapshot = await activitiesRef.limit(500).get();
            await archiveAndDeleteActivities(activitiesSnapshot);
            while (activitiesSnapshot.size === 500) {
                activitiesSnapshot = await activitiesRef.limit(500).get();
                await archiveAndDeleteActivities(activitiesSnapshot);
            }
            // 1.2 解綁設備
            await db.collection('devices').doc(deviceId).update({
                bindingType: 'UNBOUND',
                boundTo: null,
                boundAt: null,
                mapUserNickname: null,
                mapUserAge: null,
                mapUserGender: null,
                updatedAt: timestamp,
            });
            console.log(`Device ${deviceId} unbound successfully`);
        }
        // Step 2: 刪除用戶的通知點位
        const notificationPointsQuery = await db.collection('appUserNotificationPoints')
            .where('mapAppUserId', '==', body.userId)
            .get();
        if (!notificationPointsQuery.empty) {
            console.log(`Deleting ${notificationPointsQuery.size} notification points for user ${body.userId}`);
            const batch = db.batch();
            notificationPointsQuery.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }
        // Step 3: 刪除 Firestore 中的用戶文檔
        await db.collection('app_users').doc(body.userId).delete();
        console.log(`Firestore user document deleted for ${body.userId}`);
        // Step 4: 刪除 Firebase Auth 中的用戶帳號
        try {
            await admin.auth().deleteUser(body.userId);
            console.log(`Firebase Auth user deleted for ${body.userId}`);
        }
        catch (authError) {
            console.error(`Failed to delete Auth user ${body.userId}:`, authError);
            // 如果 Auth 用戶不存在，記錄警告但不影響整體刪除流程
            if (authError.code !== 'auth/user-not-found') {
                throw authError;
            }
            else {
                console.warn(`Auth user ${body.userId} not found, skipping Auth deletion`);
            }
        }
        res.json({
            success: true,
            message: '用戶帳號刪除成功',
            details: {
                fcmNotificationSent: fcmNotificationSent,
                firestoreDeleted: true,
                authDeleted: true,
                deviceUnbound: !!(userData === null || userData === void 0 ? void 0 : userData.boundDeviceId),
                notificationPointsDeleted: notificationPointsQuery.size,
            },
        });
    }
    catch (error) {
        console.error('Error in deleteMapAppUser:', error);
        res.status(500).json({
            success: false,
            error: '伺服器內部錯誤',
            errorCode: ErrorCodes.INTERNAL_ERROR,
        });
    }
});
//# sourceMappingURL=deleteUser.js.map