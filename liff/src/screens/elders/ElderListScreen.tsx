import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Battery, Signal, Calendar } from "lucide-react";
import { elderService } from "../../services/elderService";
import { useAuth } from "../../hooks/useAuth";
import { useTenantStore } from "../../store/tenantStore";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import type { Elder } from "../../types";

export const ElderListScreen = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const tenant = useTenantStore((state) => state.selectedTenant);
  const [elders, setElders] = useState<Elder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;

    setLoading(true);
    const unsubscribe = elderService.subscribe(tenant.id, (data) => {
      setElders(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenant]);

  const getStatusLabel = (status: string) => {
    const labels = {
      ACTIVE: "正常",
      INACTIVE: "不活躍",
      HOSPITALIZED: "住院",
      DECEASED: "已故",
      MOVED_OUT: "遷出",
    };
    return labels[status as keyof typeof labels];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: "bg-green-100 text-green-700",
      INACTIVE: "bg-gray-100 text-gray-700",
      HOSPITALIZED: "bg-yellow-100 text-yellow-700",
      DECEASED: "bg-red-100 text-red-700",
      MOVED_OUT: "bg-blue-100 text-blue-700",
    };
    return colors[status as keyof typeof colors];
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return "text-gray-400";
    if (level > 60) return "text-green-500";
    if (level > 20) return "text-yellow-500";
    return "text-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">長輩管理</h2>
          {isAdmin && (
            <button
              onClick={() => navigate("/elders/add")}
              className="h-10 px-6 bg-primary-500 text-white font-semibold shadow-app-md active:scale-[0.98] transition flex items-center justify-center"
              style={{ borderRadius: "40px" }}
            >
              新增
            </button>
          )}
        </div>

        {/* Elders List */}
        {elders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-app-sm p-12 text-center">
            <p className="text-gray-500">暫無長者資料</p>
          </div>
        ) : (
          <div className="space-y-3">
            {elders.map((elder) => (
              <div
                key={elder.id}
                onClick={() => navigate(`/elders/${elder.id}`)}
                className="bg-white rounded-xl shadow-app-sm p-4 active:scale-[0.98] transition cursor-pointer"
              >
                {/* 標題區域 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {elder.name}
                    </h3>
                    {/* 性別和年齡 */}
                    {(elder.gender || elder.age) && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        {elder.gender && (
                          <span>
                            {elder.gender === "MALE"
                              ? "男"
                              : elder.gender === "FEMALE"
                                ? "女"
                                : "其他"}
                          </span>
                        )}
                        {elder.gender && elder.age && <span>·</span>}
                        {elder.age && (
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{elder.age}歲</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(elder.status)}`}
                  >
                    {getStatusLabel(elder.status)}
                  </span>
                </div>

                {/* 設備資訊 */}
                {elder.device ? (
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg mb-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Signal className="w-4 h-4 text-gray-400" />
                      <span className="font-mono text-xs text-gray-700">
                        {elder.device.deviceName ||
                          elder.device.uuid ||
                          elder.device.macAddress}
                      </span>
                    </div>
                    {elder.device.batteryLevel && (
                      <div className="flex items-center space-x-1 text-sm">
                        <Battery
                          className={`w-4 h-4 ${getBatteryColor(elder.device.batteryLevel)}`}
                        />
                        <span className="text-xs">
                          {elder.device.batteryLevel}%
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg mb-2 text-sm text-gray-500">
                    <Signal className="w-4 h-4" />
                    <span>尚未綁定設備</span>
                  </div>
                )}

                {/* 最後活動 */}
                {elder.lastActivityAt && (
                  <div className="text-xs text-gray-400">
                    最後活動:{" "}
                    {formatDistanceToNow(new Date(elder.lastActivityAt), {
                      addSuffix: true,
                      locale: zhTW,
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
