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
exports.checkMapUserStatus = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
// 標準錯誤碼定義
const ErrorCodes = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
};
// 用戶狀態定義
const UserStatus = {
    ACTIVE: 'ACTIVE',
    DELETED: 'DELETED',
    SUSPENDED: 'SUSPENDED',
    NOT_FOUND: 'NOT_FOUND',
};
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
exports.checkMapUserStatus = (0, https_1.onRequest)(async (req, res) => {
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
        let status;
        if (userData === null || userData === void 0 ? void 0 : userData.isDeleted) {
            status = UserStatus.DELETED;
        }
        else if (userData === null || userData === void 0 ? void 0 : userData.isSuspended) {
            status = UserStatus.SUSPENDED;
        }
        else if ((userData === null || userData === void 0 ? void 0 : userData.isActive) === false) {
            status = UserStatus.SUSPENDED;
        }
        else {
            status = UserStatus.ACTIVE;
        }
        res.json({
            success: true,
            exists: true,
            status: status,
            userId: userId,
        });
    }
    catch (error) {
        console.error('Error in checkMapUserStatus:', error);
        res.status(500).json({
            success: false,
            error: '伺服器內部錯誤',
            errorCode: ErrorCodes.INTERNAL_ERROR,
        });
    }
});
//# sourceMappingURL=userStatus.js.map