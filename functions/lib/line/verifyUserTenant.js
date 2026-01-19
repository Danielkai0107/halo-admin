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
exports.verifyUserTenant = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const bot_sdk_1 = require("@line/bot-sdk");
// 驗證用戶是否屬於某個社區的 LINE OA 好友
exports.verifyUserTenant = functions.https.onCall(async (data, context) => {
    var _a;
    try {
        const { lineUserId } = data;
        if (!lineUserId) {
            throw new functions.https.HttpsError('invalid-argument', 'lineUserId is required');
        }
        const db = admin.firestore();
        const tenantsSnap = await db.collection('tenants').get();
        const matchedTenants = [];
        // 遍歷所有社區，使用每個社區的 Channel Access Token 驗證用戶是否是好友
        for (const tenantDoc of tenantsSnap.docs) {
            const tenantData = tenantDoc.data();
            const channelAccessToken = tenantData.lineChannelAccessToken;
            if (!channelAccessToken) {
                continue; // 跳過沒有設置 Channel Access Token 的社區
            }
            try {
                const client = new bot_sdk_1.Client({
                    channelAccessToken,
                    channelSecret: tenantData.lineChannelSecret || '',
                });
                // 嘗試獲取用戶的 profile，如果成功則表示用戶是該社區的好友
                const profile = await client.getProfile(lineUserId);
                if (profile) {
                    matchedTenants.push(tenantDoc.id);
                    console.log(`User ${lineUserId} is a friend of tenant ${tenantDoc.id}`);
                }
            }
            catch (error) {
                // 如果獲取失敗（例如用戶不是好友），繼續下一個社區
                if (error.statusCode === 404 || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('not found'))) {
                    // 用戶不是該社區的好友，繼續
                    continue;
                }
                console.warn(`Error checking tenant ${tenantDoc.id}:`, error.message);
            }
        }
        return { matchedTenants };
    }
    catch (error) {
        console.error('Error in verifyUserTenant:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=verifyUserTenant.js.map