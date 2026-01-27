import { DeviceActivity } from "../services/activityService";

export interface HourlyActivity {
  hour: number;
  count: number;
}

export interface DailyActivity {
  date: string;
  count: number;
}

export interface HotspotData {
  gatewayId: string;
  gatewayName: string;
  count: number;
  percentage: number;
}

/**
 * Calculate hourly activity distribution (24 hours)
 */
export const calculateHourlyActivity = (
  activities: DeviceActivity[],
): HourlyActivity[] => {
  const hourlyCount: { [hour: number]: number } = {};

  // Initialize all hours to 0
  for (let i = 0; i < 24; i++) {
    hourlyCount[i] = 0;
  }

  // Count activities by hour
  activities.forEach((activity) => {
    const date = new Date(activity.timestamp);
    const hour = date.getHours();
    hourlyCount[hour]++;
  });

  // Convert to array
  return Object.entries(hourlyCount).map(([hour, count]) => ({
    hour: parseInt(hour),
    count,
  }));
};

/**
 * Calculate daily activity for the last 7 days
 */
export const calculateDailyActivity = (
  activities: DeviceActivity[],
): DailyActivity[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyCount: { [date: string]: number } = {};

  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toLocaleDateString("zh-TW", {
      month: "2-digit",
      day: "2-digit",
    });
    dailyCount[dateKey] = 0;
  }

  // Count activities by day
  activities.forEach((activity) => {
    const activityDate = new Date(activity.timestamp);
    activityDate.setHours(0, 0, 0, 0);

    // Only count last 7 days
    const daysDiff = Math.floor(
      (today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff >= 0 && daysDiff < 7) {
      const dateKey = activityDate.toLocaleDateString("zh-TW", {
        month: "2-digit",
        day: "2-digit",
      });
      if (dailyCount[dateKey] !== undefined) {
        dailyCount[dateKey]++;
      }
    }
  });

  // Convert to array
  return Object.entries(dailyCount).map(([date, count]) => ({
    date,
    count,
  }));
};

/**
 * Calculate hotspot data (most visited gateways)
 */
export const calculateHotspots = (
  activities: DeviceActivity[],
  topN: number = 5,
): HotspotData[] => {
  const gatewayCount: {
    [gatewayId: string]: { name: string; count: number };
  } = {};

  // Count activities by gateway
  activities.forEach((activity) => {
    if (!gatewayCount[activity.gatewayId]) {
      gatewayCount[activity.gatewayId] = {
        name: activity.gatewayName,
        count: 0,
      };
    }
    gatewayCount[activity.gatewayId].count++;
  });

  // Convert to array and sort by count
  const sortedGateways = Object.entries(gatewayCount)
    .map(([gatewayId, data]) => ({
      gatewayId,
      gatewayName: data.name,
      count: data.count,
      percentage: 0, // Will be calculated below
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  // Calculate percentages
  const total = activities.length;
  sortedGateways.forEach((gateway) => {
    gateway.percentage = total > 0 ? (gateway.count / total) * 100 : 0;
  });

  return sortedGateways;
};

/**
 * Get peak activity time
 */
export const getPeakActivityTime = (activities: DeviceActivity[]): string => {
  const hourlyData = calculateHourlyActivity(activities);
  const peakHour = hourlyData.reduce(
    (max, current) => (current.count > max.count ? current : max),
    hourlyData[0],
  );

  return `${peakHour.hour.toString().padStart(2, "0")}:00`;
};

/**
 * Get most visited gateway
 */
export const getMostVisitedGateway = (
  activities: DeviceActivity[],
): string => {
  const hotspots = calculateHotspots(activities, 1);
  return hotspots.length > 0 ? hotspots[0].gatewayName : "無";
};

/**
 * Calculate average activities per day
 */
export const getAverageActivitiesPerDay = (
  activities: DeviceActivity[],
): number => {
  const dailyData = calculateDailyActivity(activities);
  const total = dailyData.reduce((sum, day) => sum + day.count, 0);
  return Math.round(total / 7);
};
