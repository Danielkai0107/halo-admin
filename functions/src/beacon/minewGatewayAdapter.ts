import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';

/**
 * Minew Gateway Adapter
 * 
 * 此服務接收 Minew MG6 gateway（JSON-LONG 格式）的資料，
 * 轉換後呼叫現有的 beacon 處理邏輯。
 * 
 * Minew JSON-LONG 格式範例：
 * [
 *   {
 *     "timestamp": "2018-01-22T11:10:28Z",
 *     "type": "iBeacon",
 *     "mac": "AC233F23FFCE",
 *     "rssi": -59,
 *     "rawData": "0201061AFF4C000215E2C56DB5DFFB48D2B060D0F5A71096E000010001C5"
 *   }
 * ]
 * 
 * 轉換後呼叫 processBeacon 處理
 */

// Type definitions
interface MinewJsonLongItem {
  timestamp: string;           // ISO 8601 format: "2018-01-22T11:10:28Z"
  type: string;                // "iBeacon", "Unknown", etc.
  mac: string;                 // Beacon MAC: "AC233F23FFCE"
  bleName?: string;            // Bluetooth name (optional)
  rssi: number;                // Signal strength: -59
  rawData: string;             // Raw BLE advertising data in hex
}

interface ParsedIBeacon {
  uuid: string;
  major: number;
  minor: number;
  txPower: number;
  batteryLevel?: number;
}

interface GatewayInfo {
  id: string;
  tenantId: string | null;
  serialNumber: string;
  macAddress?: string;
  name: string;
  location?: string;
  type: 'SCHOOL_ZONE' | 'SAFE_ZONE' | 'OBSERVE_ZONE' | 'INACTIVE';
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

interface ProcessingResult {
  mac: string;
  status: 'processed' | 'skipped' | 'error';
  reason?: string;
}

/**
 * Log error to Firestore error_logs collection
 */
async function logError(
  functionName: string,
  errorMessage: string,
  errorStack: string | undefined,
  payload: any
): Promise<void> {
  try {
    const db = admin.firestore();
    await db.collection('error_logs').add({
      function_name: functionName,
      error_message: errorMessage,
      error_stack: errorStack || 'No stack trace available',
      payload: payload,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (logError) {
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
function parseIBeaconFromRawData(rawData: string): ParsedIBeacon | null {
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
  } catch (error) {
    console.error('Error parsing iBeacon data:', error);
    return null;
  }
}

/**
 * Parse battery level from Minew beacon rawData (if available)
 * Minew beacons may include battery info in their advertising data
 */
function parseBatteryFromRawData(_rawData: string): number | undefined {
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
async function getAllowedUuids(
  db: admin.firestore.Firestore
): Promise<Set<string>> {
  try {
    const uuidsQuery = await db
      .collection('uuids')
      .where('isActive', '==', true)
      .get();

    const allowedUuids = new Set<string>();
    
    for (const doc of uuidsQuery.docs) {
      const data = doc.data();
      if (data.uuid && typeof data.uuid === 'string') {
        // Normalize UUID to uppercase for consistent matching
        allowedUuids.add(data.uuid.toUpperCase());
      }
    }

    console.log(`Loaded ${allowedUuids.size} allowed UUIDs from beacon_uuids`);
    return allowedUuids;
  } catch (error) {
    console.error('Error fetching allowed UUIDs:', error);
    throw error;
  }
}

/**
 * Query gateway information from Firestore by MAC address
 */
async function getGatewayByMac(
  macAddress: string,
  db: admin.firestore.Firestore
): Promise<GatewayInfo | null> {
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
    return {
      id: gatewayDoc.id,
      ...gatewayDoc.data(),
    } as GatewayInfo;
  } catch (error) {
    console.error('Error querying gateway:', error);
    throw error;
  }
}

/**
 * Process a single beacon and update device status
 */
async function processBeaconData(
  beacon: ParsedIBeacon,
  rssi: number,
  gateway: GatewayInfo,
  timestamp: number,
  db: admin.firestore.Firestore
): Promise<{ status: 'updated' | 'ignored'; deviceId?: string }> {
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
    const updateData: any = {
      lastSeen: new Date(timestamp).toISOString(),
      lastRssi: rssi,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (beacon.batteryLevel !== undefined) {
      updateData.batteryLevel = beacon.batteryLevel;
    }

    await deviceDoc.ref.update(updateData);

    // Record activity
    const lat = gateway.latitude ?? 0;
    const lng = gateway.longitude ?? 0;

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
  } catch (error) {
    console.error(`Error processing beacon:`, error);
    throw error;
  }
}

/**
 * Extract gateway MAC from request headers
 * Minew gateways typically send their MAC in the headers
 */
function extractGatewayMac(req: any): string | null {
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
  if (req.query?.gateway_mac) {
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
export const minewGateway = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (req, res) => {
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
      if (!gatewayMac && req.body?.gatewayMac) {
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
      let beaconItems: MinewJsonLongItem[] = [];

      if (Array.isArray(req.body)) {
        // Direct array format
        beaconItems = req.body;
      } else if (req.body?.data && Array.isArray(req.body.data)) {
        // Wrapped format: { data: [...] }
        beaconItems = req.body.data;
      } else if (typeof req.body === 'object' && req.body !== null) {
        // Single item format
        beaconItems = [req.body as MinewJsonLongItem];
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
      const results: ProcessingResult[] = [];
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
        let timestamp: number;
        if (item.timestamp) {
          const parsed = Date.parse(item.timestamp);
          timestamp = isNaN(parsed) ? Date.now() : parsed;
        } else {
          timestamp = Date.now();
        }

        // Process the beacon
        try {
          const result = await processBeaconData(
            parsedBeacon,
            item.rssi || -100,
            gateway,
            timestamp,
            db
          );

          if (result.status === 'updated') {
            results.push({
              mac: item.mac || 'unknown',
              status: 'processed',
            });
            processedCount++;
          } else {
            results.push({
              mac: item.mac || 'unknown',
              status: 'skipped',
              reason: 'Device not found',
            });
            skippedCount++;
          }
        } catch (error) {
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

    } catch (error) {
      console.error('Unexpected error in minewGateway:', error);

      await logError(
        'minewGateway',
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
        req.body
      );

      res.status(500).json({
        success: false,
        error: 'Internal server error. Please check logs.',
      });
    }
  }
);
