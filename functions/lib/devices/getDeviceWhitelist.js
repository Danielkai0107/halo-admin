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
exports.getDeviceWhitelist = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
/**
 * Get Device Whitelist
 *
 * Returns a list of ALL active devices in the system.
 * Used by Android receiver apps to filter which beacons to upload.
 *
 * No authentication required - public endpoint.
 */
exports.getDeviceWhitelist = (0, https_1.onRequest)({
    cors: true, // Enable CORS for all origins
    timeoutSeconds: 30,
    memory: '256MiB',
}, async (req, res) => {
    // Support both GET and POST requests
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.status(405).json({
            success: false,
            devices: [],
            count: 0,
            timestamp: Date.now(),
            error: 'Method not allowed. Use GET or POST.',
        });
        return;
    }
    try {
        console.log('Fetching global device whitelist');
        const db = admin.firestore();
        // Get ALL active devices across all tenants
        const devicesQuery = await db
            .collection('devices')
            .where('isActive', '==', true)
            .get();
        console.log(`Found ${devicesQuery.docs.length} active devices`);
        // Format device list
        const devices = devicesQuery.docs
            .map(doc => {
            const data = doc.data();
            return {
                uuid: data.uuid || '',
                major: data.major || 0,
                minor: data.minor || 0,
                deviceName: data.deviceName,
                macAddress: data.macAddress || '',
            };
        })
            .filter(device => device.uuid); // Only include devices with UUID
        console.log(`Returning ${devices.length} devices with valid UUID`);
        // Return response
        const response = {
            success: true,
            devices: devices,
            count: devices.length,
            timestamp: Date.now(),
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error in getDeviceWhitelist:', error);
        res.status(500).json({
            success: false,
            devices: [],
            count: 0,
            timestamp: Date.now(),
            error: 'Internal server error',
        });
    }
});
//# sourceMappingURL=getDeviceWhitelist.js.map