import { useState, useEffect } from "react";
import { Bell, MapPin, Clock, Filter } from "lucide-react";
import { activityService } from "../../services/activityService";
import { elderService } from "../../services/elderService";
import { useAuth } from "../../hooks/useAuth";
import { formatDistanceToNow, format } from "date-fns";
import { zhTW } from "date-fns/locale";
import type { NotificationLog, Elder } from "../../types";

export const NotificationLogsScreen = () => {
  const { tenantId } = useAuth();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [elders, setElders] = useState<Elder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElder, setSelectedElder] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  useEffect(() => {
    if (!tenantId) return;

    // 載入長者列表
    const unsubscribe = elderService.subscribe(tenantId, async (data) => {
      setElders(data);

      // 載入通知記錄
      await loadLogs(data);
    });

    return () => unsubscribe();
  }, [tenantId]);

  const loadLogs = async (eldersData: Elder[]) => {
    if (eldersData.length === 0) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const startDate = dateRange.start ? new Date(dateRange.start) : undefined;
      const endDate = dateRange.end ? new Date(dateRange.end) : undefined;

      // 傳遞長者資料（包含 id, name, deviceId）
      const eldersInfo = eldersData.map((e) => ({
        id: e.id,
        name: e.name,
        deviceId: e.deviceId,
      }));

      const data = await activityService.getNotificationLogs(
        eldersInfo,
        startDate,
        endDate,
      );
      setLogs(data);
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    const filteredElders = selectedElder
      ? elders.filter((e) => e.id === selectedElder)
      : elders;

    loadLogs(filteredElders);
  };

  const handleReset = () => {
    setSelectedElder("");
    setDateRange({ start: "", end: "" });
    loadLogs(elders);
  };

  const getGatewayTypeLabel = (type: string) => {
    const labels = {
      SCHOOL_ZONE: "學校區域",
      SAFE_ZONE: "安全區域",
      OBSERVE_ZONE: "觀察區域",
      INACTIVE: "未啟用",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getGatewayTypeColor = (type: string) => {
    const colors = {
      SCHOOL_ZONE: "bg-blue-100 text-blue-800",
      SAFE_ZONE: "bg-green-100 text-green-800",
      OBSERVE_ZONE: "bg-yellow-100 text-yellow-800",
      INACTIVE: "bg-gray-100 text-gray-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const safeToDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      return timestamp.toDate();
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    return new Date(timestamp);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">通知記錄</h2>
        <div className="text-sm text-gray-500">共 {logs.length} 筆記錄</div>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">篩選條件</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">長者</label>
            <select
              className="input"
              value={selectedElder}
              onChange={(e) => setSelectedElder(e.target.value)}
            >
              <option value="">全部</option>
              {elders.map((elder) => (
                <option key={elder.id} value={elder.id}>
                  {elder.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">開始日期</label>
            <input
              type="date"
              className="input"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="label">結束日期</label>
            <input
              type="date"
              className="input"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 mt-4">
          <button onClick={handleReset} className="btn btn-secondary">
            重置
          </button>
          <button onClick={handleFilter} className="btn btn-primary">
            套用篩選
          </button>
        </div>
      </div>

      {/* Logs List */}
      {logs.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-gray-500">暫無通知記錄</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={`${log.elderId}-${log.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Bell className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {log.elderName || "未知長者"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(safeToDate(log.timestamp), "yyyy/MM/dd HH:mm:ss")}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGatewayTypeColor(log.gatewayType)}`}
                >
                  {getGatewayTypeLabel(log.gatewayType)}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{log.gatewayName || "未知位置"}</span>
                </div>

                {log.rssi && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span>信號強度: {log.rssi} dBm</span>
                  </div>
                )}

                {/* {log.notificationDetails && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    <p>發送時間: {log.notificationDetails.sentAt ? format(new Date(log.notificationDetails.sentAt), 'HH:mm:ss') : '未知'}</p>
                    {log.notificationDetails.recipientCount && (
                      <p>接收人數: {log.notificationDetails.recipientCount} 人</p>
                    )}
                  </div>
                )} */}

                <div className="flex items-center space-x-1 text-gray-500 text-xs mt-2">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(safeToDate(log.timestamp), {
                      addSuffix: true,
                      locale: zhTW,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
