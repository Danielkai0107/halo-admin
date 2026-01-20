import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';

interface UuidResponse {
  success: boolean;
  uuids: string[];
  count: number;
  timestamp: number;
  error?: string;
}

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
export const getServiceUuids = onRequest(
  {
    cors: true, // Enable CORS for all origins
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (req, res) => {
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

      // Extract UUID strings only
      const uuids: string[] = uuidsQuery.docs
        .map(doc => {
          const data = doc.data();
          return data.uuid || '';
        })
        .filter(uuid => uuid); // Only include non-empty UUIDs

      console.log(`Returning ${uuids.length} valid service UUIDs`);

      // Return response
      const response: UuidResponse = {
        success: true,
        uuids: uuids,
        count: uuids.length,
        timestamp: Date.now(),
      };

      res.status(200).json(response);

    } catch (error) {
      console.error('Error in getServiceUuids:', error);
      res.status(500).json({
        success: false,
        uuids: [],
        count: 0,
        timestamp: Date.now(),
        error: 'Internal server error',
      });
    }
  }
);
