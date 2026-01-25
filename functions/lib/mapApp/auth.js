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
exports.mapUserAuth = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
// 標準錯誤碼定義
const ErrorCodes = {
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    UNAUTHORIZED: 'UNAUTHORIZED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
};
/**
 * Map App User Authentication
 * POST /mapUserAuth
 *
 * Request Body:
 * - action: 'register' | 'login'
 * - email?: string
 * - name?: string
 * - phone?: string
 *
 * Headers:
 * - Authorization: Bearer {FIREBASE_ID_TOKEN}
 */
exports.mapUserAuth = (0, https_1.onRequest)(async (req, res) => {
    var _a, _b, _c;
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
        const userId = decodedToken.uid;
        const body = req.body;
        const db = admin.firestore();
        // 驗證 action 參數
        if (!body.action || (body.action !== 'register' && body.action !== 'login')) {
            res.status(400).json({
                success: false,
                error: '參數驗證失敗',
                errorCode: ErrorCodes.VALIDATION_ERROR,
                errorDetails: {
                    fields: {
                        action: '操作類型必須為 "register" 或 "login"'
                    }
                }
            });
            return;
        }
        if (body.action === 'register') {
            // 驗證必填欄位
            const validationErrors = {};
            if (!body.name && !decodedToken.name) {
                validationErrors.name = '姓名不可為空';
            }
            if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
                validationErrors.email = '電子郵件格式不正確';
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
            // Check if user already exists
            const userDoc = await db.collection('app_users').doc(userId).get();
            if (userDoc.exists) {
                res.status(409).json({
                    success: false,
                    error: '此電子郵件已被註冊',
                    errorCode: ErrorCodes.USER_ALREADY_EXISTS,
                });
                return;
            }
            // Create new user
            const newUser = {
                id: userId,
                email: body.email || decodedToken.email || null,
                name: body.name || decodedToken.name || 'Unknown User',
                phone: body.phone || null,
                avatar: decodedToken.picture || null,
                boundDeviceId: null,
                boundAt: null,
                fcmToken: null,
                notificationEnabled: true,
                isActive: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            await db.collection('app_users').doc(userId).set(newUser);
            res.json({
                success: true,
                user: {
                    id: userId,
                    email: newUser.email,
                    name: newUser.name,
                    phone: newUser.phone,
                    createdAt: new Date().toISOString(),
                    isNewUser: true, // 新增：標示為新創建的用戶
                },
            });
        }
        else if (body.action === 'login') {
            // Update last login time
            const userDoc = await db.collection('app_users').doc(userId).get();
            if (!userDoc.exists) {
                res.status(404).json({
                    success: false,
                    error: '用戶不存在，請先註冊',
                    errorCode: ErrorCodes.USER_NOT_FOUND,
                });
                return;
            }
            // 檢查用戶是否已被刪除標記
            const userData = userDoc.data();
            if (userData === null || userData === void 0 ? void 0 : userData.isDeleted) {
                res.status(410).json({
                    success: false,
                    error: '帳號已被刪除',
                    errorCode: 'ACCOUNT_DELETED',
                });
                return;
            }
            await db.collection('app_users').doc(userId).update({
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            res.json({
                success: true,
                user: {
                    id: userId,
                    email: userData === null || userData === void 0 ? void 0 : userData.email,
                    name: userData === null || userData === void 0 ? void 0 : userData.name,
                    phone: userData === null || userData === void 0 ? void 0 : userData.phone,
                    boundDeviceId: userData === null || userData === void 0 ? void 0 : userData.boundDeviceId,
                    notificationEnabled: userData === null || userData === void 0 ? void 0 : userData.notificationEnabled,
                    isActive: userData === null || userData === void 0 ? void 0 : userData.isActive,
                    createdAt: ((_c = (_b = (_a = userData === null || userData === void 0 ? void 0 : userData.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || null,
                    isNewUser: false, // 新增：標示為現有用戶
                },
            });
        }
    }
    catch (error) {
        console.error('Error in mapUserAuth:', error);
        res.status(500).json({
            success: false,
            error: '伺服器內部錯誤',
            errorCode: ErrorCodes.INTERNAL_ERROR,
        });
    }
});
//# sourceMappingURL=auth.js.map