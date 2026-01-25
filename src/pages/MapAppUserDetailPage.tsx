import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  Edit,
  Bell,
  BellOff,
  UserCheck,
  UserX,
  MapPin,
  Clock,
  Signal,
  LinkIcon,
  Unlink,
} from "lucide-react";
import { mapAppUserService } from "../services/mapAppUserService";
import { deviceService } from "../services/deviceService";
import { formatDistanceToNow, format } from "date-fns";
import { zhTW } from "date-fns/locale";
import type { MapAppUser, Device } from "../types";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";

interface MapUserActivity {
  id: string;
  timestamp: any;
  gatewayId: string;
  gatewayName?: string;
  gatewayType?: string;
  latitude?: number;
  longitude?: number;
  rssi?: number;
  triggeredNotification?: boolean;
  notificationPointId?: string;
}

export const MapAppUserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<MapAppUser | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [activities, setActivities] = useState<MapUserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<24 | 168 | 720>(24); // 24h, 7d, 30d

  // 安全的日期格式化函數
  const safeFormatDate = (
    timestamp: any,
    formatStr: string = "yyyy/MM/dd HH:mm",
  ): string => {
    if (!timestamp) return "-";

    try {
      let date: Date;

      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) {
        return "-";
      }

      return format(date, formatStr, { locale: zhTW });
    } catch (error) {
      console.error("Date format error:", error);
      return "-";
    }
  };

  // 安全的日期轉換函數
  const safeToDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;

    try {
      let date: Date;

      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) {
        return null;
      }

      return date;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // 載入用戶資料
        const userRes: any = await mapAppUserService.getOne(id);
        console.log('Loaded user:', userRes.data);
        setUser(userRes.data);

        // 如果用戶有綁定設備，載入設備資訊
        if (userRes.data.boundDeviceId) {
          try {
            const deviceRes: any = await deviceService.getOne(
              userRes.data.boundDeviceId,
            );
            console.log('Loaded device:', deviceRes.data);
            setDevice(deviceRes.data);
          } catch (error) {
            console.error("Failed to load device:", error);
          }
        }

        // 載入活動記錄（傳遞 boundDeviceId）
        await loadActivities(userRes.data.boundDeviceId);
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, timeRange]);

  const loadActivities = async (boundDeviceId: string | undefined) => {
    try {
      if (!boundDeviceId) {
        console.log('No bound device, skipping activities load');
        setActivities([]);
        return;
      }

      console.log('Loading activities for device:', boundDeviceId);

      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - timeRange);
      console.log('Time range:', { timeRange, hoursAgo });

      let activitiesData: MapUserActivity[] = [];

      // 從設備的子集合查詢活動記錄
      try {
        console.log('Querying activities subcollection...');
        const activitiesQuery = query(
          collection(db, "devices", boundDeviceId, "activities"),
          orderBy("timestamp", "desc"),
          limit(100),
        );

        const snapshot = await getDocs(activitiesQuery);
        console.log(`Found ${snapshot.docs.length} total activities for device`);

        // 在客戶端過濾
        activitiesData = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            console.log('Activity data:', {
              id: doc.id,
              bindingType: data.bindingType,
              timestamp: data.timestamp,
              gatewayName: data.gatewayName
            });
            return {
              id: doc.id,
              gatewayId: data.gatewayId,
              gatewayName: data.gatewayName,
              gatewayType: data.gatewayType,
              latitude: data.latitude,
              longitude: data.longitude,
              rssi: data.rssi,
              timestamp: data.timestamp,
              triggeredNotification: data.triggeredNotification || false,
              notificationPointId: data.notificationPointId,
              bindingType: data.bindingType,
            };
          })
          .filter((activity: any) => {
            // 客戶端過濾：只顯示 MAP_USER 類型的活動
            if (activity.bindingType !== 'MAP_USER') {
              console.log('Filtered out non-MAP_USER activity:', activity.id);
              return false;
            }
            
            // 客戶端過濾：時間範圍
            const activityDate = safeToDate(activity.timestamp);
            if (!activityDate) {
              console.log('Invalid timestamp:', activity.timestamp);
              return false;
            }
            const inRange = activityDate >= hoursAgo;
            if (!inRange) {
              console.log('Activity outside time range:', activityDate, hoursAgo);
            }
            return inRange;
          }) as MapUserActivity[];

        console.log(`After filtering: ${activitiesData.length} MAP_USER activities`);
      } catch (error: any) {
        console.error('Error loading activities:', error);
        activitiesData = [];
      }

      console.log(`Final: Loaded ${activitiesData.length} activities for device ${boundDeviceId}`);
      setActivities(activitiesData);
    } catch (error) {
      console.error("Failed to load activities:", error);
      setActivities([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">找不到用戶資料</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/map-app-users")}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            地圖 App 用戶詳情
          </h1>
        </div>
        <button
          onClick={() => navigate(`/map-app-users?edit=${id}`)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <Edit className="w-4 h-4" />
          <span>編輯資料</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：用戶基本資料 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 基本資料卡片 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col items-center mb-6">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 mb-4"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-gray-100 mb-4">
                  <span className="text-4xl font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {user.name}
              </h2>

              <div className="flex items-center space-x-2">
                {user.isActive ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <UserCheck className="w-4 h-4 mr-1" />
                    啟用中
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <UserX className="w-4 h-4 mr-1" />
                    已停用
                  </span>
                )}
                {user.notificationEnabled ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <Bell className="w-4 h-4 mr-1" />
                    通知開啟
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    <BellOff className="w-4 h-4 mr-1" />
                    通知關閉
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {user.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a
                    href={`mailto:${user.email}`}
                    className="text-gray-700 hover:text-primary-600"
                  >
                    {user.email}
                  </a>
                </div>
              )}

              {user.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a
                    href={`tel:${user.phone}`}
                    className="text-gray-700 hover:text-primary-600"
                  >
                    {user.phone}
                  </a>
                </div>
              )}

              {user.fcmToken && (
                <div className="pt-4 border-t">
                  <div className="text-xs text-gray-500 mb-1">FCM Token</div>
                  <code className="text-xs font-mono bg-gray-50 text-gray-700 px-2 py-1 rounded block break-all">
                    {user.fcmToken.substring(0, 40)}...
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* 綁定設備資訊 */}
          {device ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-2 mb-4">
                <LinkIcon className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  綁定設備
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">設備名稱</div>
                  <div className="font-medium text-gray-900">
                    {device.mapUserNickname || device.deviceName || "未命名"}
                  </div>
                  {device.mapUserAge && (
                    <div className="text-sm text-gray-600">
                      年齡：{device.mapUserAge} 歲
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">設備序號</div>
                  <code className="text-sm font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded">
                    {device.major}-{device.minor}
                  </code>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">UUID</div>
                  <code className="text-xs font-mono bg-blue-50 text-blue-800 px-2 py-1 rounded block break-all">
                    {device.uuid}
                  </code>
                </div>

                {device.batteryLevel && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm text-gray-600">電量</span>
                    <span
                      className={`text-sm font-medium ${
                        device.batteryLevel > 60
                          ? "text-green-600"
                          : device.batteryLevel > 20
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {device.batteryLevel}%
                    </span>
                  </div>
                )}

                {device.lastSeen &&
                  (() => {
                    const lastSeenDate = safeToDate(device.lastSeen);
                    if (!lastSeenDate) return null;

                    return (
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        最後上線：
                        {formatDistanceToNow(lastSeenDate, {
                          addSuffix: true,
                          locale: zhTW,
                        })}
                      </div>
                    );
                  })()}

                <button
                  onClick={() => navigate(`/devices/${device.id}`)}
                  className="w-full mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition text-sm font-medium"
                >
                  查看設備詳情
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Unlink className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700">
                  未綁定設備
                </h3>
              </div>
              <p className="text-sm text-gray-500">此用戶目前未綁定任何設備</p>
            </div>
          )}

          {/* 系統資訊 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              系統資訊
            </h3>
            <div className="space-y-3 text-sm">
              {user.createdAt && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">建立時間</span>
                  <span className="text-gray-900 font-medium">
                    {safeFormatDate(user.createdAt)}
                  </span>
                </div>
              )}
              {user.updatedAt && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">最後更新</span>
                  <span className="text-gray-900 font-medium">
                    {safeFormatDate(user.updatedAt)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t">
                <span className="text-gray-600">用戶 ID</span>
                <code className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {user.id}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* 右側：活動記錄 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 活動足跡 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-6 h-6 text-gray-600" />
                <h3 className="text-xl font-semibold text-gray-900">
                  活動足跡
                </h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTimeRange(24)}
                  className={`px-4 py-2 text-sm rounded-lg transition ${
                    timeRange === 24
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  今天
                </button>
                <button
                  onClick={() => setTimeRange(168)}
                  className={`px-4 py-2 text-sm rounded-lg transition ${
                    timeRange === 168
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  7天
                </button>
                <button
                  onClick={() => setTimeRange(720)}
                  className={`px-4 py-2 text-sm rounded-lg transition ${
                    timeRange === 720
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  30天
                </button>
              </div>
            </div>

            {/* 活動統計 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 mb-1">總活動次數</div>
                <div className="text-2xl font-bold text-blue-900">
                  {activities.length}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 mb-1">觸發通知</div>
                <div className="text-2xl font-bold text-green-900">
                  {activities.filter((a) => a.triggeredNotification).length}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 mb-1">不同地點</div>
                <div className="text-2xl font-bold text-purple-900">
                  {new Set(activities.map((a) => a.gatewayId)).size}
                </div>
              </div>
            </div>

            {/* 活動時間軸 */}
            {activities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>此時間範圍內沒有活動記錄</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {activities.map((activity) => {
                  const activityDate = safeToDate(activity.timestamp);

                  return (
                    <div
                      key={activity.id}
                      className={`border-l-4 pl-6 pb-4 relative ${
                        activity.triggeredNotification
                          ? "border-green-400 bg-green-50"
                          : "border-blue-300"
                      }`}
                    >
                      <div
                        className={`absolute left-0 top-0 w-4 h-4 rounded-full -ml-2 ${
                          activity.triggeredNotification
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                      ></div>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPin
                              className={`w-5 h-5 ${
                                activity.triggeredNotification
                                  ? "text-green-600"
                                  : "text-blue-600"
                              }`}
                            />
                            <span className="font-semibold text-gray-900">
                              {activity.gatewayName ||
                                activity.gatewayId ||
                                "未知位置"}
                            </span>
                            {activity.gatewayType && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  activity.gatewayType === "SCHOOL_ZONE"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : activity.gatewayType === "SAFE_ZONE"
                                      ? "bg-green-100 text-green-700"
                                      : activity.gatewayType === "OBSERVE_ZONE"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {activity.gatewayType}
                              </span>
                            )}
                            {activity.triggeredNotification && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Bell className="w-3 h-3 mr-1" />
                                已通知
                              </span>
                            )}
                          </div>
                          {activity.latitude && activity.longitude && (
                            <a
                              href={`https://www.google.com/maps?q=${activity.latitude},${activity.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline font-mono bg-white px-2 py-1 rounded inline-block"
                            >
                              📍 {activity.latitude.toFixed(6)},{" "}
                              {activity.longitude.toFixed(6)}
                            </a>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {activityDate &&
                              format(activityDate, "MM/dd HH:mm", {
                                locale: zhTW,
                              })}
                          </p>
                          {activity.rssi && (
                            <p className="text-xs text-gray-500 flex items-center justify-end space-x-1">
                              <Signal className="w-3 h-3" />
                              <span>{activity.rssi} dBm</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 使用說明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">活動記錄說明</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>
                • <strong>綠色標記</strong>
                ：觸發了通知點位，已發送推播通知給用戶
              </li>
              <li>
                • <strong>藍色標記</strong>：一般活動記錄，未觸發通知
              </li>
              <li>• 點擊座標可以在 Google 地圖中查看位置</li>
              <li>• RSSI 值代表訊號強度，數值越接近 0 表示訊號越強</li>
              <li>• 活動記錄會保留 30 天</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
