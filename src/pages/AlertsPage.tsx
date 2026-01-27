import { useEffect, useState } from "react";
import {
  Search,
  AlertTriangle,
  Bell,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { alertService } from "../services/alertService";
import type { Alert, AlertStatus, AlertSeverity } from "../types";
import { formatDistanceToNow, format } from "date-fns";
import { zhTW } from "date-fns/locale";

export const AlertsPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>("");

  // 安全的時間轉換函數
  const safeToDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    return new Date(timestamp);
  };

  useEffect(() => {
    setLoading(true);
    
    // 訂閱警報列表（即時監聽）
    const statusParam = filterStatus && filterStatus !== '' ? (filterStatus as AlertStatus) : undefined;
    const unsubscribe = alertService.subscribe(
      (data) => {
        setAlerts(data);
        setTotal(data.length);
        setLoading(false);
      },
      undefined, // tenantId
      undefined, // elderId
      undefined, // type
      statusParam // status
    );

    // 清理訂閱
    return () => unsubscribe();
  }, [filterStatus]);

  const handleResolve = async (id: string) => {
    if (!confirm("確定要解決此警報嗎？")) return;

    try {
      await alertService.resolve(id, "admin-user-id", "已處理並確認");
      // 即時監聽會自動更新，不需要手動重新載入
    } catch (error) {
      console.error("Failed to resolve alert:", error);
      alert("解決警報失敗");
    }
  };

  const handleDismiss = async (id: string) => {
    if (!confirm("確定要忽略此警報嗎？")) return;

    try {
      await alertService.dismiss(id);
      // 即時監聽會自動更新，不需要手動重新載入
    } catch (error) {
      console.error("Failed to dismiss alert:", error);
      alert("忽略警報失敗");
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    const config = {
      PENDING: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: Clock,
        label: "待處理",
      },
      NOTIFIED: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: Bell,
        label: "已通知",
      },
      RESOLVED: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
        label: "已解決",
      },
      DISMISSED: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: XCircle,
        label: "已忽略",
      },
    };

    const { bg, text, icon: Icon, label } = config[status];

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </span>
    );
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    const config = {
      LOW: { bg: "bg-gray-100", text: "text-gray-700", label: "低" },
      MEDIUM: { bg: "bg-yellow-100", text: "text-yellow-700", label: "中" },
      HIGH: { bg: "bg-orange-100", text: "text-orange-700", label: "高" },
      CRITICAL: { bg: "bg-red-100", text: "text-red-700", label: "緊急" },
    };

    const { bg, text, label } = config[severity];

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}
      >
        {label}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      BOUNDARY: "邊界點警報",
      INACTIVE: "不活躍警報",
      FIRST_ACTIVITY: "首次活動",
      LOW_BATTERY: "低電量",
      EMERGENCY: "緊急求救",
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return <div className="text-center py-12">載入中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">警報管理</h2>
          <p className="text-sm text-gray-600 mt-1">查看和處理所有警報事件</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋長者名稱..."
            className="input pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">全部</option>
          <option value="PENDING">待處理</option>
          <option value="NOTIFIED">已通知</option>
          <option value="RESOLVED">已解決</option>
          <option value="DISMISSED">已忽略</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              {/* Left Side - Alert Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <AlertTriangle
                    className={`w-5 h-5 ${
                      alert.severity === "CRITICAL"
                        ? "text-red-500"
                        : alert.severity === "HIGH"
                        ? "text-orange-500"
                        : alert.severity === "MEDIUM"
                        ? "text-yellow-500"
                        : "text-gray-500"
                    }`}
                  />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {alert.title}
                  </h3>
                  {getStatusBadge(alert.status)}
                  {getSeverityBadge(alert.severity)}
                </div>

                <p className="text-gray-700 mb-3">{alert.message}</p>

                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">長者：</span>
                    {alert.elder?.name || "-"}
                  </div>
                  <div>
                    <span className="font-medium">類型：</span>
                    {getTypeLabel(alert.type)}
                  </div>
                  {alert.gateway && (
                    <div>
                      <span className="font-medium">接收點：</span>
                      {alert.gateway.name}
                    </div>
                  )}
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  觸發時間：
                  {format(safeToDate(alert.triggeredAt), "yyyy-MM-dd HH:mm:ss")} (
                  {formatDistanceToNow(safeToDate(alert.triggeredAt), {
                    addSuffix: true,
                    locale: zhTW,
                  })}
                  )
                </div>

                {alert.resolvedAt && alert.resolution && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-900">
                      <span className="font-medium">處理說明：</span>
                      {alert.resolution}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      處理時間：
                      {format(safeToDate(alert.resolvedAt), "yyyy-MM-dd HH:mm:ss")}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Side - Actions */}
              {alert.status === "PENDING" && (
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    解決
                  </button>
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition-colors"
                  >
                    忽略
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="card text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">目前沒有警報記錄</p>
          </div>
        )}
      </div>

      {/* Total Count */}
      {total > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">總共 {total} 筆警報（即時更新）</p>
        </div>
      )}
    </div>
  );
};
