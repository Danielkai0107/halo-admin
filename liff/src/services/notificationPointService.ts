import { Gateway } from "../types";

// Cloud Functions 的 Base URL
const API_BASE_URL = import.meta.env.VITE_FUNCTIONS_BASE_URL || "https://us-central1-safe-net-tw.cloudfunctions.net";

interface AddNotificationPointResponse {
  success: boolean;
  message?: string;
  gatewayId?: string;
  gatewayName?: string;
  error?: string;
}

interface RemoveNotificationPointResponse {
  success: boolean;
  message?: string;
  gatewayId?: string;
  error?: string;
}

interface GetNotificationPointsResponse {
  success: boolean;
  deviceId?: string | null;
  notificationPoints?: Gateway[];
  error?: string;
}

/**
 * Add notification point for LINE user
 */
export const addNotificationPoint = async (
  lineUserId: string,
  gatewayId: string,
): Promise<AddNotificationPointResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/addLineUserNotificationPoint`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineUserId,
          gatewayId,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to add notification point");
    }

    return data;
  } catch (error: any) {
    console.error("Error adding notification point:", error);
    return {
      success: false,
      error: error.message || "Failed to add notification point",
    };
  }
};

/**
 * Remove notification point for LINE user
 */
export const removeNotificationPoint = async (
  lineUserId: string,
  gatewayId: string,
): Promise<RemoveNotificationPointResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/removeLineUserNotificationPoint`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineUserId,
          gatewayId,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to remove notification point");
    }

    return data;
  } catch (error: any) {
    console.error("Error removing notification point:", error);
    return {
      success: false,
      error: error.message || "Failed to remove notification point",
    };
  }
};

/**
 * Get all notification points for LINE user
 */
export const getNotificationPoints = async (
  lineUserId: string,
): Promise<GetNotificationPointsResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/getLineUserNotificationPoints?lineUserId=${encodeURIComponent(lineUserId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get notification points");
    }

    return data;
  } catch (error: any) {
    console.error("Error getting notification points:", error);
    return {
      success: false,
      error: error.message || "Failed to get notification points",
    };
  }
};

/**
 * Check if a gateway is a notification point for LINE user
 */
export const isNotificationPoint = async (
  lineUserId: string,
  gatewayId: string,
): Promise<boolean> => {
  try {
    const response = await getNotificationPoints(lineUserId);

    if (!response.success || !response.notificationPoints) {
      return false;
    }

    return response.notificationPoints.some((point) => point.id === gatewayId);
  } catch (error) {
    console.error("Error checking if notification point:", error);
    return false;
  }
};
