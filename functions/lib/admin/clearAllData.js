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
exports.clearAllData = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
/**
 * 清空 Firestore 所有集合資料
 *
 * 警告：此 API 會刪除所有資料，僅供開發測試使用！
 *
 * 調用方式：
 * POST https://clearalldata-xxxxx.a.run.app
 * Header: x-admin-key: YOUR_SECRET_KEY
 */
// 需要清空的集合列表
const collectionsToDelete = [
    // 新的集合名稱
    'line_users',
    'app_users',
    'appUserNotificationPoints',
    'admin_users',
    'uuids',
    // 舊的集合名稱（確保完全清空）
    'appUsers',
    'mapAppUsers',
    'mapUserNotificationPoints',
    'users',
    'beacon_uuids',
    // 其他集合
    'tenants',
    'elders',
    'devices',
    'gateways',
    'alerts',
    'anonymousActivities',
    'error_logs',
    'latest_locations',
];
// 有子集合的集合
const collectionsWithSubcollections = {
    'tenants': ['members'],
    'devices': ['activities'],
};
async function deleteCollection(db, collectionPath) {
    console.log(`Deleting collection: ${collectionPath}`);
    const collectionRef = db.collection(collectionPath);
    let deleted = 0;
    while (true) {
        const snapshot = await collectionRef.limit(500).get();
        if (snapshot.size === 0) {
            break;
        }
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        deleted += snapshot.size;
        console.log(`  Deleted ${deleted} documents from ${collectionPath}...`);
    }
    console.log(`✓ Collection ${collectionPath} cleared (${deleted} total)`);
    return deleted;
}
async function deleteSubcollections(db, parentCollection, subcollections) {
    console.log(`\nProcessing subcollections of ${parentCollection}...`);
    let totalDeleted = 0;
    const parentDocs = await db.collection(parentCollection).get();
    for (const parentDoc of parentDocs.docs) {
        for (const subName of subcollections) {
            const subPath = `${parentCollection}/${parentDoc.id}/${subName}`;
            const count = await deleteCollection(db, subPath);
            totalDeleted += count;
        }
    }
    return totalDeleted;
}
exports.clearAllData = (0, https_1.onRequest)({
    cors: true,
    timeoutSeconds: 540, // 9 minutes
    memory: '512MiB',
}, async (req, res) => {
    // 僅允許 POST 請求
    if (req.method !== 'POST') {
        res.status(405).json({
            success: false,
            error: 'Method not allowed. Use POST.',
        });
        return;
    }
    // 簡單的安全檢查（建議在生產環境中使用更強的認證）
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'CLEAR_ALL_DATA_2024') {
        res.status(401).json({
            success: false,
            error: 'Unauthorized. Please provide valid x-admin-key header.',
        });
        return;
    }
    console.log('========================================');
    console.log('Starting to clear all Firestore data');
    console.log('WARNING: All data will be permanently deleted!');
    console.log('========================================\n');
    const db = admin.firestore();
    let totalDeleted = 0;
    try {
        // 1. 先刪除有子集合的集合的子集合
        for (const [parent, subs] of Object.entries(collectionsWithSubcollections)) {
            const count = await deleteSubcollections(db, parent, subs);
            totalDeleted += count;
        }
        // 2. 刪除所有主集合
        for (const collectionName of collectionsToDelete) {
            const count = await deleteCollection(db, collectionName);
            totalDeleted += count;
        }
        console.log('\n========================================');
        console.log(`✓ Clear complete! Total ${totalDeleted} documents deleted`);
        console.log('========================================');
        res.json({
            success: true,
            message: 'All data cleared successfully',
            totalDeleted,
            collections: collectionsToDelete,
        });
    }
    catch (error) {
        console.error('Error clearing data:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to clear data',
        });
    }
});
//# sourceMappingURL=clearAllData.js.map