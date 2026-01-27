import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";

interface AddNotificationPointRequest {
  lineUserId: string;
  gatewayId: string;
}

interface RemoveNotificationPointRequest {
  lineUserId: string;
  gatewayId: string;
}

/**
 * Add Notification Point for LINE User
 * POST /addLineUserNotificationPoint
 *
 * Request Body:
 * - lineUserId: string (必填，Line 用戶管理 ID)
 * - gatewayId: string (必填，Gateway ID)
 */
export const addLineUserNotificationPoint = onRequest(async (req, res) => {
  // CORS handling
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  try {
    const body: AddNotificationPointRequest = req.body;

    // Validate request
    if (!body.lineUserId) {
      res.status(400).json({
        success: false,
        error: "Missing required field: lineUserId",
      });
      return;
    }

    if (!body.gatewayId) {
      res.status(400).json({
        success: false,
        error: "Missing required field: gatewayId",
      });
      return;
    }

    const db = admin.firestore();

    // Check if LINE user exists
    const lineUsersQuery = await db
      .collection("line_users")
      .where("lineUserId", "==", body.lineUserId)
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
      res.status(400).json({
        success: false,
        error: "User has no bound device",
      });
      return;
    }

    const deviceId = lineUserData.boundDeviceId;

    // Check if gateway exists
    const gatewayDoc = await db
      .collection("gateways")
      .doc(body.gatewayId)
      .get();

    if (!gatewayDoc.exists) {
      res.status(404).json({
        success: false,
        error: "Gateway not found",
      });
      return;
    }

    const gatewayData = gatewayDoc.data();

    // 驗證 gateway 類型（只允許 SAFE_ZONE 和 SCHOOL_ZONE）
    if (
      gatewayData?.type !== "SAFE_ZONE" &&
      gatewayData?.type !== "SCHOOL_ZONE"
    ) {
      res.status(400).json({
        success: false,
        error: `Cannot set ${gatewayData?.type} gateway as notification point. Only SAFE_ZONE and SCHOOL_ZONE are allowed.`,
      });
      return;
    }

    // Get device data
    const deviceDoc = await db.collection("devices").doc(deviceId).get();
    const deviceData = deviceDoc.data();

    // Check if gateway is already in notification points
    const currentNotificationPoints =
      (deviceData?.inheritedNotificationPointIds as string[]) || [];

    if (currentNotificationPoints.includes(body.gatewayId)) {
      res.status(400).json({
        success: false,
        error: "Gateway is already in notification points",
      });
      return;
    }

    // Add gateway to notification points
    await db
      .collection("devices")
      .doc(deviceId)
      .update({
        inheritedNotificationPointIds: admin.firestore.FieldValue.arrayUnion(
          body.gatewayId,
        ),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    res.json({
      success: true,
      message: "Notification point added successfully",
      gatewayId: body.gatewayId,
      gatewayName: gatewayData?.name,
    });
  } catch (error: any) {
    console.error("Error in addLineUserNotificationPoint:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

/**
 * Remove Notification Point for LINE User
 * POST /removeLineUserNotificationPoint
 *
 * Request Body:
 * - lineUserId: string (必填，Line 用戶管理 ID)
 * - gatewayId: string (必填，Gateway ID)
 */
export const removeLineUserNotificationPoint = onRequest(async (req, res) => {
  // CORS handling
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  try {
    const body: RemoveNotificationPointRequest = req.body;

    // Validate request
    if (!body.lineUserId) {
      res.status(400).json({
        success: false,
        error: "Missing required field: lineUserId",
      });
      return;
    }

    if (!body.gatewayId) {
      res.status(400).json({
        success: false,
        error: "Missing required field: gatewayId",
      });
      return;
    }

    const db = admin.firestore();

    // Check if LINE user exists
    const lineUsersQuery = await db
      .collection("line_users")
      .where("lineUserId", "==", body.lineUserId)
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
      res.status(400).json({
        success: false,
        error: "User has no bound device",
      });
      return;
    }

    const deviceId = lineUserData.boundDeviceId;

    // Remove gateway from notification points
    await db
      .collection("devices")
      .doc(deviceId)
      .update({
        inheritedNotificationPointIds: admin.firestore.FieldValue.arrayRemove(
          body.gatewayId,
        ),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    res.json({
      success: true,
      message: "Notification point removed successfully",
      gatewayId: body.gatewayId,
    });
  } catch (error: any) {
    console.error("Error in removeLineUserNotificationPoint:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

/**
 * Get Notification Points for LINE User
 * GET /getLineUserNotificationPoints
 *
 * Query Parameters:
 * - lineUserId: string (必填，Line 用戶管理 ID)
 */
export const getLineUserNotificationPoints = onRequest(async (req, res) => {
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
        notificationPoints: [],
        deviceId: null,
      });
      return;
    }

    const deviceId = lineUserData.boundDeviceId;

    // Get device data
    const deviceDoc = await db.collection("devices").doc(deviceId).get();
    const deviceData = deviceDoc.data();

    const notificationPointIds =
      (deviceData?.inheritedNotificationPointIds as string[]) || [];

    // Get gateway details for each notification point
    const notificationPoints = [];

    for (const gatewayId of notificationPointIds) {
      const gatewayDoc = await db.collection("gateways").doc(gatewayId).get();
      if (gatewayDoc.exists) {
        notificationPoints.push({
          id: gatewayDoc.id,
          ...gatewayDoc.data(),
        });
      }
    }

    res.json({
      success: true,
      deviceId: deviceId,
      notificationPoints: notificationPoints,
    });
  } catch (error: any) {
    console.error("Error in getLineUserNotificationPoints:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});
