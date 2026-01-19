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
exports.getTenantFollowers = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const bot_sdk_1 = require("@line/bot-sdk");
// 獲取指定社區的 LINE OA 好友列表
exports.getTenantFollowers = functions.https.onCall(async (data, context) => {
    var _a;
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
        const channelAccessToken = tenantData === null || tenantData === void 0 ? void 0 : tenantData.lineChannelAccessToken;
        const channelSecret = tenantData === null || tenantData === void 0 ? void 0 : tenantData.lineChannelSecret;
        if (!channelAccessToken) {
            throw new functions.https.HttpsError('failed-precondition', 'Channel Access Token not configured');
        }
        // LINE Messaging API 沒有直接獲取好友列表的 API
        // 方法：獲取所有啟用的 appUsers，然後使用該社區的 Channel Access Token 驗證他們是否是該社區的好友
        const appUsersSnap = await db
            .collection('appUsers')
            .where('isActive', '==', true)
            .get();
        const client = new bot_sdk_1.Client({
            channelAccessToken,
            channelSecret: channelSecret || '',
        });
        const followers = [];
        // 驗證每個用戶是否是該社區的好友
        for (const appUserDoc of appUsersSnap.docs) {
            const appUserData = appUserDoc.data();
            const lineUserId = appUserData.lineUserId;
            if (!lineUserId)
                continue;
            try {
                // 嘗試獲取用戶的 profile，如果成功則表示用戶是該社區的好友
                const profile = await client.getProfile(lineUserId);
                if (profile) {
                    followers.push(Object.assign({ id: appUserDoc.id }, appUserData));
                }
            }
            catch (error) {
                // 如果獲取失敗（例如用戶不是好友），跳過
                if (error.statusCode === 404 || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('not found'))) {
                    continue;
                }
                console.warn(`Error checking user ${lineUserId}:`, error.message);
            }
        }
        return { followers };
    }
    catch (error) {
        console.error('Error in getTenantFollowers:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=getTenantFollowers.js.map