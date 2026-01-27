import {
  collection,
  query,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface DeviceActivity {
  id: string;
  timestamp: string;
  gatewayId: string;
  gatewayName: string;
  gatewayType: string;
  latitude: number;
  longitude: number;
  rssi: number;
  triggeredNotification: boolean;
  notificationType: "LINE" | "FCM" | null;
  notificationPointId?: string;
}

interface ActivityStats {
  totalActivities: number;
  todayActivities: number;
  lastActivity: string | null;
}

// Cloud Functions 的 Base URL
const API_BASE_URL = import.meta.env.VITE_FUNCTIONS_BASE_URL || "https://us-central1-safe-net-tw.cloudfunctions.net";

/**
 * Subscribe to device activities (real-time updates)
 */
export const subscribeActivities = (
  deviceId: string,
  callback: (activities: DeviceActivity[]) => void,
  limitCount: number = 100,
): Unsubscribe => {
  const activitiesRef = collection(db, "devices", deviceId, "activities");
  const activitiesQuery = query(
    activitiesRef,
    orderBy("timestamp", "desc"),
    firestoreLimit(limitCount),
  );

  return onSnapshot(
    activitiesQuery,
    (snapshot) => {
      const activities: DeviceActivity[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp as Timestamp;

        return {
          id: doc.id,
          timestamp: timestamp?.toDate().toISOString() || new Date().toISOString(),
          gatewayId: data.gatewayId || "",
          gatewayName: data.gatewayName || "",
          gatewayType: data.gatewayType || "",
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          rssi: data.rssi || 0,
          triggeredNotification: data.triggeredNotification || false,
          notificationType: data.notificationType || null,
          notificationPointId: data.notificationPointId || undefined,
        };
      });

      callback(activities);
    },
    (error) => {
      console.error("Error subscribing to activities:", error);
      callback([]);
    },
  );
};

/**
 * Get activities by date (from API)
 */
export const getActivitiesByDate = async (
  lineUserId: string,
  startDate?: string,
  endDate?: string,
): Promise<{
  success: boolean;
  activities?: DeviceActivity[];
  stats?: ActivityStats;
  error?: string;
}> => {
  try {
    const params = new URLSearchParams({
      lineUserId,
    });

    if (startDate) {
      params.append("startDate", startDate);
    }

    if (endDate) {
      params.append("endDate", endDate);
    }

    const response = await fetch(
      `${API_BASE_URL}/getLineUserActivities?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get activities");
    }

    return {
      success: true,
      activities: data.activities,
      stats: data.stats,
    };
  } catch (error: any) {
    console.error("Error getting activities by date:", error);
    return {
      success: false,
      error: error.message || "Failed to get activities",
    };
  }
};

/**
 * Group activities by date
 */
export const groupActivitiesByDate = (
  activities: DeviceActivity[],
): Map<string, DeviceActivity[]> => {
  const grouped = new Map<string, DeviceActivity[]>();

  activities.forEach((activity) => {
    const date = new Date(activity.timestamp);
    const dateKey = date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }

    grouped.get(dateKey)!.push(activity);
  });

  return grouped;
};

/**
 * Format time for display
 */
export const formatActivityTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

/**
 * Check if activity is today
 */
export const isToday = (timestamp: string): boolean => {
  const activityDate = new Date(timestamp);
  const today = new Date();

  return (
    activityDate.getDate() === today.getDate() &&
    activityDate.getMonth() === today.getMonth() &&
    activityDate.getFullYear() === today.getFullYear()
  );
};
