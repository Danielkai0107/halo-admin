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
exports.removeMapUserNotificationPoint = exports.updateMapUserNotificationPoint = exports.getMapUserNotificationPoints = exports.addMapUserNotificationPoint = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
// 標準錯誤碼定義
const ErrorCodes = {
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    GATEWAY_NOT_FOUND: 'GATEWAY_NOT_FOUND',
    NOTIFICATION_POINT_NOT_FOUND: 'NOTIFICATION_POINT_NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    ACCOUNT_DELETED: 'ACCOUNT_DELETED',
};
/**
 * Add Map User Notification Point
 * POST /addMapUserNotificationPoint
 */
exports.addMapUserNotificationPoint = (0, https_1.onRequest)(async (req, res) => {
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
        const validationErrors = {};
        if (!body.userId) {
            validationErrors.userId = '缺少必填欄位 userId';
        }
        if (!body.gatewayId) {
            validationErrors.gatewayId = '缺少必填欄位 gatewayId';
        }
        if (!body.name) {
            validationErrors.name = '缺少必填欄位 name';
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
        // Verify user can only add their own notification points
        if (body.userId !== authenticatedUserId) {
            res.status(403).json({
                success: false,
                error: '禁止操作：無法為其他用戶新增通知點位',
                errorCode: ErrorCodes.UNAUTHORIZED,
            });
            return;
        }
        const db = admin.firestore();
        // Verify user exists
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
        if (userData === null || userData === void 0 ? void 0 : userData.isDeleted) {
            res.status(410).json({
                success: false,
                error: '帳號已被刪除',
                errorCode: ErrorCodes.ACCOUNT_DELETED,
            });
            return;
        }
        // Verify gateway exists (allow both public and tenant gateways)
        const gatewayDoc = await db.collection('gateways').doc(body.gatewayId).get();
        if (!gatewayDoc.exists) {
            res.status(404).json({
                success: false,
                error: '接收器不存在',
                errorCode: ErrorCodes.GATEWAY_NOT_FOUND,
            });
            return;
        }
        // All active gateways can be used for notifications
        // Create notification point
        const notificationPoint = {
            mapAppUserId: body.userId,
            gatewayId: body.gatewayId,
            name: body.name,
            notificationMessage: body.notificationMessage || null,
            isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await db.collection('appUserNotificationPoints').add(notificationPoint);
        res.json({
            success: true,
            notificationPoint: Object.assign(Object.assign({ id: docRef.id }, notificationPoint), { createdAt: new Date().toISOString() }),
        });
    }
    catch (error) {
        console.error('Error in addMapUserNotificationPoint:', error);
        res.status(500).json({
            success: false,
            error: '伺服器內部錯誤',
            errorCode: ErrorCodes.INTERNAL_ERROR,
        });
    }
});
/**
 * Get Map User Notification Points
 * GET /getMapUserNotificationPoints?userId=xxx
 */
exports.getMapUserNotificationPoints = (0, https_1.onRequest)(async (req, res) => {
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
        const userId = req.query.userId;
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
        // Verify user can only access their own notification points
        if (userId !== authenticatedUserId) {
            res.status(403).json({
                success: false,
                error: '禁止操作：無法查看其他用戶的通知點位',
                errorCode: ErrorCodes.UNAUTHORIZED,
            });
            return;
        }
        const db = admin.firestore();
        // Verify user exists
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
        if (userData === null || userData === void 0 ? void 0 : userData.isDeleted) {
            res.status(410).json({
                success: false,
                error: '帳號已被刪除',
                errorCode: ErrorCodes.ACCOUNT_DELETED,
            });
            return;
        }
        // Get notification points
        const pointsSnapshot = await db
            .collection('appUserNotificationPoints')
            .where('mapAppUserId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        const points = await Promise.all(pointsSnapshot.docs.map(async (doc) => {
            var _a;
            const data = doc.data();
            // Get gateway info
            let gatewayInfo = null;
            if (data.gatewayId) {
                const gatewayDoc = await db.collection('gateways').doc(data.gatewayId).get();
                if (gatewayDoc.exists) {
                    const gw = gatewayDoc.data();
                    gatewayInfo = {
                        id: gatewayDoc.id,
                        name: gw === null || gw === void 0 ? void 0 : gw.name,
                        location: gw === null || gw === void 0 ? void 0 : gw.location,
                        latitude: gw === null || gw === void 0 ? void 0 : gw.latitude,
                        longitude: gw === null || gw === void 0 ? void 0 : gw.longitude,
                    };
                }
            }
            return {
                id: doc.id,
                name: data.name,
                gatewayId: data.gatewayId,
                notificationMessage: data.notificationMessage,
                isActive: data.isActive,
                createdAt: (_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate().toISOString(),
                gateway: gatewayInfo,
            };
        }));
        res.json({
            success: true,
            notificationPoints: points,
            count: points.length,
        });
    }
    catch (error) {
        console.error('Error in getMapUserNotificationPoints:', error);
        res.status(500).json({
            success: false,
            error: '伺服器內部錯誤',
            errorCode: ErrorCodes.INTERNAL_ERROR,
        });
    }
});
/**
 * Update Map User Notification Point
 * PUT /updateMapUserNotificationPoint
 */
exports.updateMapUserNotificationPoint = (0, https_1.onRequest)(async (req, res) => {
    // CORS handling
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'PUT, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'PUT') {
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
        if (!body.pointId) {
            res.status(400).json({
                success: false,
                error: '參數驗證失敗',
                errorCode: ErrorCodes.VALIDATION_ERROR,
                errorDetails: {
                    fields: {
                        pointId: '缺少必填欄位 pointId'
                    }
                }
            });
            return;
        }
        const db = admin.firestore();
        // Get notification point
        const pointDoc = await db.collection('appUserNotificationPoints').doc(body.pointId).get();
        if (!pointDoc.exists) {
            res.status(404).json({
                success: false,
                error: '通知點位不存在',
                errorCode: ErrorCodes.NOTIFICATION_POINT_NOT_FOUND,
            });
            return;
        }
        const pointData = pointDoc.data();
        // Verify ownership
        if ((pointData === null || pointData === void 0 ? void 0 : pointData.mapAppUserId) !== authenticatedUserId) {
            res.status(403).json({
                success: false,
                error: '禁止操作：無法修改其他用戶的通知點位',
                errorCode: ErrorCodes.UNAUTHORIZED,
            });
            return;
        }
        // Verify user still exists and is active
        const userDoc = await db.collection('app_users').doc(authenticatedUserId).get();
        if (!userDoc.exists) {
            res.status(404).json({
                success: false,
                error: '帳號不存在或已被刪除',
                errorCode: ErrorCodes.USER_NOT_FOUND,
            });
            return;
        }
        const userData = userDoc.data();
        if (userData === null || userData === void 0 ? void 0 : userData.isDeleted) {
            res.status(410).json({
                success: false,
                error: '帳號已被刪除',
                errorCode: ErrorCodes.ACCOUNT_DELETED,
            });
            return;
        }
        // Build update object
        const updateData = {};
        if (body.name !== undefined)
            updateData.name = body.name;
        if (body.notificationMessage !== undefined)
            updateData.notificationMessage = body.notificationMessage;
        if (body.isActive !== undefined)
            updateData.isActive = body.isActive;
        if (Object.keys(updateData).length === 0) {
            res.status(400).json({
                success: false,
                error: '參數驗證失敗',
                errorCode: ErrorCodes.VALIDATION_ERROR,
                errorDetails: {
                    fields: {
                        _general: '至少需要提供一個要更新的欄位'
                    }
                }
            });
            return;
        }
        await db.collection('appUserNotificationPoints').doc(body.pointId).update(updateData);
        res.json({
            success: true,
            message: '通知點位更新成功',
        });
    }
    catch (error) {
        console.error('Error in updateMapUserNotificationPoint:', error);
        res.status(500).json({
            success: false,
            error: '伺服器內部錯誤',
            errorCode: ErrorCodes.INTERNAL_ERROR,
        });
    }
});
/**
 * Remove Map User Notification Point
 * DELETE /removeMapUserNotificationPoint
 */
exports.removeMapUserNotificationPoint = (0, https_1.onRequest)(async (req, res) => {
    // CORS handling
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'DELETE, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'DELETE' && req.method !== 'POST') {
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
        if (!body.pointId) {
            res.status(400).json({
                success: false,
                error: '參數驗證失敗',
                errorCode: ErrorCodes.VALIDATION_ERROR,
                errorDetails: {
                    fields: {
                        pointId: '缺少必填欄位 pointId'
                    }
                }
            });
            return;
        }
        const db = admin.firestore();
        // Get notification point
        const pointDoc = await db.collection('appUserNotificationPoints').doc(body.pointId).get();
        if (!pointDoc.exists) {
            res.status(404).json({
                success: false,
                error: '通知點位不存在',
                errorCode: ErrorCodes.NOTIFICATION_POINT_NOT_FOUND,
            });
            return;
        }
        const pointData = pointDoc.data();
        // Verify ownership
        if ((pointData === null || pointData === void 0 ? void 0 : pointData.mapAppUserId) !== authenticatedUserId) {
            res.status(403).json({
                success: false,
                error: '禁止操作：無法刪除其他用戶的通知點位',
                errorCode: ErrorCodes.UNAUTHORIZED,
            });
            return;
        }
        // Delete notification point
        await db.collection('appUserNotificationPoints').doc(body.pointId).delete();
        res.json({
            success: true,
            message: '通知點位刪除成功',
        });
    }
    catch (error) {
        console.error('Error in removeMapUserNotificationPoint:', error);
        res.status(500).json({
            success: false,
            error: '伺服器內部錯誤',
            errorCode: ErrorCodes.INTERNAL_ERROR,
        });
    }
});
//# sourceMappingURL=notificationPoints.js.map