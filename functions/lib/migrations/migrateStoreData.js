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
exports.rollbackStoreMigration = exports.migrateStoreData = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
/**
 * Migration: Store Architecture Refactor
 *
 * 此腳本會將現有的 Gateway (isAD: true) 轉換成獨立的 Store
 *
 * 步驟：
 * 1. 查詢所有 isAD 為 true 的 Gateway
 * 2. 為每個 Gateway 建立對應的 Store
 * 3. 更新 Gateway 的 storeId 指向新建的 Store
 * 4. 清除 Gateway 上的舊商店欄位
 *
 * 使用方法：
 * 1. 部署此 function
 * 2. 透過 HTTP GET 請求執行：
 *    curl https://<region>-<project-id>.cloudfunctions.net/migrateStoreData
 * 3. 檢查回傳結果確認遷移成功
 */
exports.migrateStoreData = (0, https_1.onRequest)(async (req, res) => {
    // CORS handling
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    if (req.method !== "GET") {
        res.status(405).json({ success: false, error: "Method not allowed" });
        return;
    }
    const db = admin.firestore();
    const batch = db.batch();
    let batchCount = 0;
    try {
        console.log("=== Store Migration Started ===");
        // Step 1: 查詢所有 isAD 為 true 的 Gateway
        const adGatewaysSnapshot = await db
            .collection("gateways")
            .where("isAD", "==", true)
            .get();
        console.log(`Found ${adGatewaysSnapshot.size} gateways with isAD=true`);
        if (adGatewaysSnapshot.empty) {
            res.json({
                success: true,
                message: "No gateways to migrate (no isAD=true found)",
                migrated: 0,
            });
            return;
        }
        const migrationResults = [];
        // Step 2-4: 為每個 Gateway 建立 Store 並更新
        for (const gatewayDoc of adGatewaysSnapshot.docs) {
            const gatewayData = gatewayDoc.data();
            const gatewayId = gatewayDoc.id;
            // 建立 Store 資料
            const storeData = {
                name: gatewayData.location || gatewayData.name || "未命名商店",
                storeLogo: gatewayData.storeLogo || null,
                imageLink: gatewayData.imageLink || null,
                websiteLink: gatewayData.websiteLink || null,
                activityTitle: gatewayData.activityTitle || null,
                activityContent: gatewayData.activityContent || null,
                storePassword: gatewayData.storePassword || null,
                adminIds: [],
                isActive: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            // 建立新的 Store 文檔
            const storeRef = db.collection("stores").doc();
            batch.set(storeRef, storeData);
            batchCount++;
            // 更新 Gateway：設定 storeId，移除舊欄位
            const gatewayRef = db.collection("gateways").doc(gatewayId);
            batch.update(gatewayRef, {
                storeId: storeRef.id,
                // 移除舊欄位
                isAD: admin.firestore.FieldValue.delete(),
                storeLogo: admin.firestore.FieldValue.delete(),
                imageLink: admin.firestore.FieldValue.delete(),
                websiteLink: admin.firestore.FieldValue.delete(),
                activityTitle: admin.firestore.FieldValue.delete(),
                activityContent: admin.firestore.FieldValue.delete(),
                storePassword: admin.firestore.FieldValue.delete(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            batchCount++;
            migrationResults.push({
                gatewayId: gatewayId,
                gatewayName: gatewayData.name,
                storeId: storeRef.id,
                storeName: storeData.name,
            });
            // Firestore batch 限制為 500 個操作，每 400 個操作提交一次
            if (batchCount >= 400) {
                await batch.commit();
                console.log(`Committed batch of ${batchCount} operations`);
                batchCount = 0;
            }
        }
        // 提交剩餘的操作
        if (batchCount > 0) {
            await batch.commit();
            console.log(`Committed final batch of ${batchCount} operations`);
        }
        console.log("=== Store Migration Completed ===");
        console.log(`Migrated ${migrationResults.length} gateways to stores`);
        res.json({
            success: true,
            message: "Migration completed successfully",
            migrated: migrationResults.length,
            results: migrationResults,
        });
    }
    catch (error) {
        console.error("Error in migrateStoreData:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Internal server error",
        });
    }
});
/**
 * Rollback Migration (Optional)
 *
 * 將 Store 資料回寫到 Gateway，並刪除 Store 文檔
 * 僅在需要回退時使用
 */
exports.rollbackStoreMigration = (0, https_1.onRequest)(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    if (req.method !== "GET") {
        res.status(405).json({ success: false, error: "Method not allowed" });
        return;
    }
    const db = admin.firestore();
    const batch = db.batch();
    let batchCount = 0;
    try {
        console.log("=== Store Rollback Started ===");
        // 查詢所有有 storeId 的 Gateway
        const gatewaysSnapshot = await db
            .collection("gateways")
            .where("storeId", "!=", null)
            .get();
        console.log(`Found ${gatewaysSnapshot.size} gateways with storeId`);
        if (gatewaysSnapshot.empty) {
            res.json({
                success: true,
                message: "No gateways to rollback",
                rolled_back: 0,
            });
            return;
        }
        const rollbackResults = [];
        for (const gatewayDoc of gatewaysSnapshot.docs) {
            const gatewayData = gatewayDoc.data();
            const gatewayId = gatewayDoc.id;
            const storeId = gatewayData.storeId;
            if (!storeId)
                continue;
            // 載入 Store 資料
            const storeDoc = await db.collection("stores").doc(storeId).get();
            if (!storeDoc.exists) {
                console.warn(`Store ${storeId} not found, skipping gateway ${gatewayId}`);
                continue;
            }
            const storeData = storeDoc.data();
            // 更新 Gateway：回寫 Store 資料，移除 storeId
            const gatewayRef = db.collection("gateways").doc(gatewayId);
            batch.update(gatewayRef, {
                isAD: true,
                storeLogo: storeData.storeLogo || null,
                imageLink: storeData.imageLink || null,
                websiteLink: storeData.websiteLink || null,
                activityTitle: storeData.activityTitle || null,
                activityContent: storeData.activityContent || null,
                storePassword: storeData.storePassword || null,
                storeId: admin.firestore.FieldValue.delete(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            batchCount++;
            // 刪除 Store 文檔
            const storeRef = db.collection("stores").doc(storeId);
            batch.delete(storeRef);
            batchCount++;
            rollbackResults.push({
                gatewayId: gatewayId,
                storeId: storeId,
                storeName: storeData.name,
            });
            // Commit batch every 400 operations
            if (batchCount >= 400) {
                await batch.commit();
                console.log(`Committed batch of ${batchCount} operations`);
                batchCount = 0;
            }
        }
        // Commit remaining operations
        if (batchCount > 0) {
            await batch.commit();
            console.log(`Committed final batch of ${batchCount} operations`);
        }
        console.log("=== Store Rollback Completed ===");
        console.log(`Rolled back ${rollbackResults.length} stores to gateways`);
        res.json({
            success: true,
            message: "Rollback completed successfully",
            rolled_back: rollbackResults.length,
            results: rollbackResults,
        });
    }
    catch (error) {
        console.error("Error in rollbackStoreMigration:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Internal server error",
        });
    }
});
//# sourceMappingURL=migrateStoreData.js.map