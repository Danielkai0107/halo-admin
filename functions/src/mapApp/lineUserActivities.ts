import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";

/**
 * Get Activities for LINE User's Device
 * GET /getLineUserActivities
 *
 * Query Parameters:
 * - lineUserId: string (必填，Line 用戶管理 ID)
 * - limit?: number (選填，返回的活動數量，預設 100)
 * - startDate?: string (選填，開始日期，ISO 8601 格式)
 * - endDate?: string (選填，結束日期，ISO 8601 格式)
 */
export const getLineUserActivities = onRequest(async (req, res) => {
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

  try {
    const lineUserId = req.query.lineUserId as string;
    const limit = parseInt(req.query.limit as string) || 100;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // Validate request
    if (!lineUserId) {
      res.status(400).json({
        success: false,
        error: "Missing required parameter: lineUserId",
      });
      return;
    }

    const db = admin.firestore();

    // Check if LINE user exists
    const lineUsersQuery = await db
      .collection("line_users")
      .where("lineUserId", "==", lineUserId)
      .limit(1)
      .get();

    if (lineUsersQuery.empty) {
      res.status(404).json({
        success: false,
        error: "LINE user not found",
      });
      return;
    }

    const lineUserDoc = lineUsersQuery.docs[0];
    const lineUserData = lineUserDoc.data();

    // Check if user has bound device
    if (!lineUserData?.boundDeviceId) {
      res.json({
        success: true,
        activities: [],
        stats: {
          totalActivities: 0,
          todayActivities: 0,
          lastActivity: null,
        },
        deviceId: null,
      });
      return;
    }

    const deviceId = lineUserData.boundDeviceId;

    // Build query
    let activitiesQuery = db
      .collection("devices")
      .doc(deviceId)
      .collection("activities")
      .orderBy("timestamp", "desc");

    // Add date filters if provided
    if (startDate) {
      activitiesQuery = activitiesQuery.where(
        "timestamp",
        ">=",
        admin.firestore.Timestamp.fromDate(new Date(startDate)),
      );
    }

    if (endDate) {
      activitiesQuery = activitiesQuery.where(
        "timestamp",
        "<=",
        admin.firestore.Timestamp.fromDate(new Date(endDate)),
      );
    }

    // Apply limit
    activitiesQuery = activitiesQuery.limit(limit);

    // Get activities
    const activitiesSnapshot = await activitiesQuery.get();

    const activities = activitiesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.timestamp?.toDate().toISOString() || null,
        gatewayId: data.gatewayId || null,
        gatewayName: data.gatewayName || null,
        gatewayType: data.gatewayType || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        rssi: data.rssi || null,
        triggeredNotification: data.triggeredNotification || false,
        notificationType: data.notificationType || null,
        notificationPointId: data.notificationPointId || null,
      };
    });

    // Calculate stats
    const totalActivities = activities.length;

    // Get today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Count today's activities
    const todayActivitiesQuery = await db
      .collection("devices")
      .doc(deviceId)
      .collection("activities")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(todayStart))
      .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(todayEnd))
      .get();

    const todayActivities = todayActivitiesQuery.size;

    // Get last activity
    const lastActivityQuery = await db
      .collection("devices")
      .doc(deviceId)
      .collection("activities")
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    let lastActivity = null;
    if (!lastActivityQuery.empty) {
      const lastActivityData = lastActivityQuery.docs[0].data();
      lastActivity = lastActivityData.timestamp?.toDate().toISOString() || null;
    }

    res.json({
      success: true,
      deviceId: deviceId,
      activities: activities,
      stats: {
        totalActivities: totalActivities,
        todayActivities: todayActivities,
        lastActivity: lastActivity,
      },
    });
  } catch (error: any) {
    console.error("Error in getLineUserActivities:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});
