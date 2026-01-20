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
exports.getServiceUuids = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
/**
 * Get Service UUIDs
 *
 * Returns a list of ALL active service UUIDs (beacon_uuids).
 * Used by receiver apps to know which UUIDs to scan for.
 *
 * **用途：**
 * - 接收器 App 獲取應該掃描的 UUID 列表
 * - 只掃描這些 UUID 的 Beacon，忽略其他
 *
 * No authentication required - public endpoint.
 */
exports.getServiceUuids = (0, https_1.onRequest)({
    cors: true, // Enable CORS for all origins
    timeoutSeconds: 30,
    memory: '256MiB',
}, async (req, res) => {
    // Support both GET and POST requests
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.status(405).json({
            success: false,
            uuids: [],
            count: 0,
            timestamp: Date.now(),
            error: 'Method not allowed. Use GET or POST.',
        });
        return;
    }
    try {
        console.log('Fetching active service UUIDs');
        const db = admin.firestore();
        // Get ALL active UUIDs
        const uuidsQuery = await db
            .collection('beacon_uuids')
            .where('isActive', '==', true)
            .get();
        console.log(`Found ${uuidsQuery.docs.length} active service UUIDs`);
        // Format UUID list
        const uuids = uuidsQuery.docs
            .map(doc => {
            const data = doc.data();
            return {
                uuid: data.uuid || '',
                name: data.name || 'Unnamed',
                description: data.description,
            };
        })
            .filter(item => item.uuid); // Only include items with valid UUID
        console.log(`Returning ${uuids.length} valid service UUIDs`);
        // Return response
        const response = {
            success: true,
            uuids: uuids,
            count: uuids.length,
            timestamp: Date.now(),
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error in getServiceUuids:', error);
        res.status(500).json({
            success: false,
            uuids: [],
            count: 0,
            timestamp: Date.now(),
            error: 'Internal server error',
        });
    }
});
//# sourceMappingURL=getServiceUuids.js.map