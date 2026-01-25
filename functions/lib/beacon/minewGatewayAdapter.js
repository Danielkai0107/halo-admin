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
exports.minewGateway = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
/**
 * Log error to Firestore error_logs collection
 */
async function logError(functionName, errorMessage, errorStack, payload) {
    try {
        const db = admin.firestore();
        await db.collection('error_logs').add({
            function_name: functionName,
            error_message: errorMessage,
            error_stack: errorStack || 'No stack trace available',
            payload: payload,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (logError) {
        console.error('Failed to log error to Firestore:', logError);
    }
}
/**
 * Parse iBeacon data from rawData hex string
 *
 * iBeacon rawData structure:
 * - Prefix varies, but iBeacon identifier is: 4C000215
 * - UUID: 16 bytes (32 hex chars)
 * - Major: 2 bytes (4 hex chars)
 * - Minor: 2 bytes (4 hex chars)
 * - TX Power: 1 byte (2 hex chars, signed)
 */
function parseIBeaconFromRawData(rawData) {
    if (!rawData || rawData.length < 50) {
        return null;
    }
    // Convert to uppercase for consistent matching
    const data = rawData.toUpperCase();
    // Find iBeacon identifier: 4C000215 (Apple Company ID + iBeacon type + length)
    // 4C00 = Apple Company ID (little endian)
    // 02 = iBeacon type
    // 15 = length (21 bytes = 0x15)
    const iBeaconMarker = '4C000215';
    const markerIndex = data.indexOf(iBeaconMarker);
    if (markerIndex === -1) {
        return null;
    }
    // iBeacon data starts after the marker
    const iBeaconDataStart = markerIndex + iBeaconMarker.length;
    // We need at least 42 characters after marker (16 bytes UUID + 2 bytes Major + 2 bytes Minor + 1 byte TX)
    if (data.length < iBeaconDataStart + 42) {
        return null;
    }
    try {
        // Extract UUID (32 hex chars = 16 bytes)
        const uuidHex = data.substring(iBeaconDataStart, iBeaconDataStart + 32);
        // Format UUID with dashes: 8-4-4-4-12
        const uuid = `${uuidHex.substring(0, 8)}-${uuidHex.substring(8, 12)}-${uuidHex.substring(12, 16)}-${uuidHex.substring(16, 20)}-${uuidHex.substring(20, 32)}`;
        // Extract Major (4 hex chars = 2 bytes, big endian)
        const majorHex = data.substring(iBeaconDataStart + 32, iBeaconDataStart + 36);
        const major = parseInt(majorHex, 16);
        // Extract Minor (4 hex chars = 2 bytes, big endian)
        const minorHex = data.substring(iBeaconDataStart + 36, iBeaconDataStart + 40);
        const minor = parseInt(minorHex, 16);
        // Extract TX Power (2 hex chars = 1 byte, signed)
        const txPowerHex = data.substring(iBeaconDataStart + 40, iBeaconDataStart + 42);
        let txPower = parseInt(txPowerHex, 16);
        // Convert to signed value
        if (txPower > 127) {
            txPower = txPower - 256;
        }
        return {
            uuid,
            major,
            minor,
            txPower,
        };
    }
    catch (error) {
        console.error('Error parsing iBeacon data:', error);
        return null;
    }
}
/**
 * Parse battery level from Minew beacon rawData (if available)
 * Minew beacons may include battery info in their advertising data
 */
function parseBatteryFromRawData(_rawData) {
    // Minew battery format varies, this is a simplified implementation
    // You may need to adjust based on your specific beacon model
    // Look for Minew specific data (Company ID: 0x0059 or similar patterns)
    // This is beacon-model specific and may need adjustment
    // For now, return undefined as battery parsing is optional
    return undefined;
}
/**
 * Get allowed UUIDs from beacon_uuids collection
 * Returns a Set of uppercase UUIDs for fast lookup
 */
async function getAllowedUuids(db) {
    try {
        const uuidsQuery = await db
            .collection('uuids')
            .where('isActive', '==', true)
            .get();
        const allowedUuids = new Set();
        for (const doc of uuidsQuery.docs) {
            const data = doc.data();
            if (data.uuid && typeof data.uuid === 'string') {
                // Normalize UUID to uppercase for consistent matching
                allowedUuids.add(data.uuid.toUpperCase());
            }
        }
        console.log(`Loaded ${allowedUuids.size} allowed UUIDs from beacon_uuids`);
        return allowedUuids;
    }
    catch (error) {
        console.error('Error fetching allowed UUIDs:', error);
        throw error;
    }
}
/**
 * Query gateway information from Firestore by MAC address
 */
async function getGatewayByMac(macAddress, db) {
    try {
        // Normalize MAC address (remove colons, uppercase)
        const normalizedMac = macAddress.replace(/:/g, '').toUpperCase();
        // Try to find gateway by macAddress
        const gatewayQuery = await db
            .collection('gateways')
            .where('macAddress', '==', normalizedMac)
            .where('isActive', '==', true)
            .limit(1)
            .get();
        if (gatewayQuery.empty) {
            return null;
        }
        const gatewayDoc = gatewayQuery.docs[0];
        return Object.assign({ id: gatewayDoc.id }, gatewayDoc.data());
    }
    catch (error) {
        console.error('Error querying gateway:', error);
        throw error;
    }
}
/**
 * Process a single beacon and update device status
 */
async function processBeaconData(beacon, rssi, gateway, timestamp, db) {
    var _a, _b;
    // Normalize UUID to lowercase for case-insensitive matching
    const normalizedUuid = beacon.uuid.toLowerCase();
    try {
        // Find device by UUID + Major + Minor
        // Note: UUID is normalized to lowercase for case-insensitive matching
        const deviceQuery = await db
            .collection('devices')
            .where('uuid', '==', normalizedUuid)
            .where('major', '==', beacon.major)
            .where('minor', '==', beacon.minor)
            .where('isActive', '==', true)
            .limit(1)
            .get();
        if (deviceQuery.empty) {
            console.log(`No active device found for UUID ${normalizedUuid}, Major ${beacon.major}, Minor ${beacon.minor}`);
            return { status: 'ignored' };
        }
        const deviceDoc = deviceQuery.docs[0];
        const deviceId = deviceDoc.id;
        // Update device status
        const updateData = {
            lastSeen: new Date(timestamp).toISOString(),
            lastRssi: rssi,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (beacon.batteryLevel !== undefined) {
            updateData.batteryLevel = beacon.batteryLevel;
        }
        await deviceDoc.ref.update(updateData);
        // Record activity
        const lat = (_a = gateway.latitude) !== null && _a !== void 0 ? _a : 0;
        const lng = (_b = gateway.longitude) !== null && _b !== void 0 ? _b : 0;
        await db.collection('devices').doc(deviceId)
            .collection('activities')
            .add({
            timestamp: admin.firestore.Timestamp.fromMillis(timestamp),
            gatewayId: gateway.id,
            gatewayName: gateway.name,
            gatewayType: gateway.type,
            latitude: lat,
            longitude: lng,
            rssi: rssi,
            triggeredNotification: false,
            notificationType: null,
            notificationDetails: null,
        });
        console.log(`Updated device ${deviceId} via Minew adapter`);
        return { status: 'updated', deviceId };
    }
    catch (error) {
        console.error(`Error processing beacon:`, error);
        throw error;
    }
}
/**
 * Extract gateway MAC from request headers
 * Minew gateways typically send their MAC in the headers
 */
function extractGatewayMac(req) {
    var _a;
    // Try common header names used by Minew gateways
    const possibleHeaders = [
        'x-gateway-mac',
        'gateway-mac',
        'x-minew-gateway',
        'mac',
        'device-mac',
    ];
    for (const header of possibleHeaders) {
        const value = req.headers[header];
        if (value && typeof value === 'string') {
            return value.replace(/:/g, '').toUpperCase();
        }
    }
    // Try to get from query parameter
    if ((_a = req.query) === null || _a === void 0 ? void 0 : _a.gateway_mac) {
        return String(req.query.gateway_mac).replace(/:/g, '').toUpperCase();
    }
    return null;
}
/**
 * Main Cloud Function: Minew Gateway Adapter
 *
 * 接收 Minew MG6 gateway 的 JSON-LONG 格式資料，
 * 解析後更新 device 狀態和記錄活動。
 *
 * Gateway 設定：
 * - URL: https://minewgateway-xxxxx.a.run.app?gateway_mac=YOUR_MAC
 * - Data Format: JSON-LONG
 * - Upload Interval: 1 second (recommended)
 */
exports.minewGateway = (0, https_1.onRequest)({
    cors: true,
    timeoutSeconds: 60,
    memory: '256MiB',
}, async (req, res) => {
    var _a, _b;
    const startTime = Date.now();
    // Only accept POST requests
    if (req.method !== 'POST') {
        res.status(405).json({
            success: false,
            error: 'Method not allowed. Use POST.',
        });
        return;
    }
    try {
        const db = admin.firestore();
        // Step 1: Extract gateway MAC
        let gatewayMac = extractGatewayMac(req);
        // If not in headers, try to get from request body wrapper
        if (!gatewayMac && ((_a = req.body) === null || _a === void 0 ? void 0 : _a.gatewayMac)) {
            gatewayMac = String(req.body.gatewayMac).replace(/:/g, '').toUpperCase();
        }
        if (!gatewayMac) {
            console.warn('No gateway MAC provided');
            res.status(400).json({
                success: false,
                error: 'Missing gateway MAC address. Please set gateway_mac query parameter or x-gateway-mac header.',
            });
            return;
        }
        console.log(`Received data from gateway: ${gatewayMac}`);
        // Step 2: Get gateway info from database
        const gateway = await getGatewayByMac(gatewayMac, db);
        if (!gateway) {
            console.warn(`Gateway not found: ${gatewayMac}`);
            res.status(404).json({
                success: false,
                error: `Gateway not registered: ${gatewayMac}. Please register the gateway first.`,
            });
            return;
        }
        console.log(`Gateway found: ${gateway.name} (${gateway.type}) - lat: ${gateway.latitude}, lng: ${gateway.longitude}`);
        // Step 3: Parse request body
        let beaconItems = [];
        if (Array.isArray(req.body)) {
            // Direct array format
            beaconItems = req.body;
        }
        else if (((_b = req.body) === null || _b === void 0 ? void 0 : _b.data) && Array.isArray(req.body.data)) {
            // Wrapped format: { data: [...] }
            beaconItems = req.body.data;
        }
        else if (typeof req.body === 'object' && req.body !== null) {
            // Single item format
            beaconItems = [req.body];
        }
        if (beaconItems.length === 0) {
            console.log('No beacon data received');
            res.status(200).json({
                success: true,
                message: 'No beacon data to process',
                processed: 0,
            });
            return;
        }
        console.log(`Processing ${beaconItems.length} beacon items`);
        // Step 4: Load allowed UUIDs from beacon_uuids collection
        const allowedUuids = await getAllowedUuids(db);
        if (allowedUuids.size === 0) {
            console.warn('No allowed UUIDs found in beacon_uuids collection');
            res.status(200).json({
                success: true,
                message: 'No allowed UUIDs configured. Please add UUIDs to beacon_uuids collection.',
                processed: 0,
                skipped: beaconItems.length,
            });
            return;
        }
        // Step 5: Process each beacon
        const results = [];
        let processedCount = 0;
        let skippedCount = 0;
        let filteredCount = 0;
        for (const item of beaconItems) {
            // Skip if no rawData
            if (!item.rawData) {
                results.push({
                    mac: item.mac || 'unknown',
                    status: 'skipped',
                    reason: 'No rawData',
                });
                skippedCount++;
                continue;
            }
            // Parse iBeacon data from rawData
            const parsedBeacon = parseIBeaconFromRawData(item.rawData);
            if (!parsedBeacon) {
                results.push({
                    mac: item.mac || 'unknown',
                    status: 'skipped',
                    reason: 'Not an iBeacon or invalid rawData',
                });
                skippedCount++;
                continue;
            }
            // Check if UUID is in the allowed list (beacon_uuids)
            if (!allowedUuids.has(parsedBeacon.uuid.toUpperCase())) {
                results.push({
                    mac: item.mac || 'unknown',
                    status: 'skipped',
                    reason: `UUID not in whitelist: ${parsedBeacon.uuid}`,
                });
                filteredCount++;
                continue;
            }
            // Add battery level if available
            parsedBeacon.batteryLevel = parseBatteryFromRawData(item.rawData);
            // Parse timestamp
            let timestamp;
            if (item.timestamp) {
                const parsed = Date.parse(item.timestamp);
                timestamp = isNaN(parsed) ? Date.now() : parsed;
            }
            else {
                timestamp = Date.now();
            }
            // Process the beacon
            try {
                const result = await processBeaconData(parsedBeacon, item.rssi || -100, gateway, timestamp, db);
                if (result.status === 'updated') {
                    results.push({
                        mac: item.mac || 'unknown',
                        status: 'processed',
                    });
                    processedCount++;
                }
                else {
                    results.push({
                        mac: item.mac || 'unknown',
                        status: 'skipped',
                        reason: 'Device not found',
                    });
                    skippedCount++;
                }
            }
            catch (error) {
                results.push({
                    mac: item.mac || 'unknown',
                    status: 'error',
                    reason: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        const processingTime = Date.now() - startTime;
        console.log(`Processing complete: ${processedCount} processed, ${skippedCount} skipped, ${filteredCount} filtered by UUID (${processingTime}ms)`);
        res.status(200).json({
            success: true,
            gateway: {
                mac: gatewayMac,
                name: gateway.name,
                type: gateway.type,
            },
            received: beaconItems.length,
            processed: processedCount,
            skipped: skippedCount,
            filteredByUuid: filteredCount,
            processingTime: processingTime,
        });
    }
    catch (error) {
        console.error('Unexpected error in minewGateway:', error);
        await logError('minewGateway', error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : undefined, req.body);
        res.status(500).json({
            success: false,
            error: 'Internal server error. Please check logs.',
        });
    }
});
//# sourceMappingURL=minewGatewayAdapter.js.map