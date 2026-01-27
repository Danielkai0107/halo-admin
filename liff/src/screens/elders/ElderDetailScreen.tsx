import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Phone,
  MapPin,
  User,
  AlertTriangle,
  Battery,
  Signal,
  Clock,
  MapPinned,
  Calendar,
  Trash2,
  X,
  Save,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { elderService } from "../../services/elderService";
import { useAuth } from "../../hooks/useAuth";
import { useTenantStore } from "../../store/tenantStore";
import { formatDistanceToNow, format } from "date-fns";
import { zhTW } from "date-fns/locale";
import type { Elder, Activity } from "../../types";

interface ElderFormData extends Partial<Elder> {
  deviceId?: string;
}

interface LatestLocation {
  elderId: string;
  deviceUuid: string;
  gateway_id: string;
  gateway_name: string;
  gateway_type: string;
  lat: number;
  lng: number;
  rssi: number;
  major: number;
  minor: number;
  last_seen: any;
}

export const ElderDetailScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const tenant = useTenantStore((state) => state.selectedTenant);
  const [elder, setElder] = useState<Elder | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [latestLocation, setLatestLocation] = useState<LatestLocation | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<24 | 168 | 720>(24); // 24h, 7d, 30d
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 編輯模式相關
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ElderFormData>();

  // 當進入編輯模式時，設定表單值
  useEffect(() => {
    if (isEditing && elder) {
      setValue("name", elder.name || "");
      setValue("gender", elder.gender || undefined);
      setValue("birthDate", elder.birthDate || "");
      setValue("age", elder.age);
      setValue("photo", elder.photo || "");
      setValue("phone", elder.phone || "");
      setValue("address", elder.address || "");
      setValue("emergencyContact", elder.emergencyContact || "");
      setValue("emergencyPhone", elder.emergencyPhone || "");
      setValue("status", elder.status || "ACTIVE");
      setValue("inactiveThresholdHours", elder.inactiveThresholdHours || 24);
      setValue("deviceId", elder.deviceId || "");
      setValue("notes", elder.notes || "");
    }
  }, [isEditing, elder, setValue]);

  // 安全的時間轉換函數
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

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [elderRes, activitiesRes, locationRes] = await Promise.all([
          elderService.getOne(id),
          elderService.getActivities(id, timeRange),
          elderService.getLatestLocation(id),
        ]);

        setElder(elderRes.data);
        setActivities(activitiesRes.data);
        setLatestLocation(locationRes.data);
      } catch (error) {
        console.error("Failed to load elder data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!elder) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">找不到長輩資料</p>
      </div>
    );
  }

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

  const handleDeleteElder = async () => {
    if (!id) return;

    setDeleting(true);
    try {
      await elderService.delete(id);
      // 刪除成功後導航回長輩列表
      navigate("/elders", { replace: true });
    } catch (error) {
      console.error("Failed to delete elder:", error);
      alert("移除長者失敗，請稍後再試");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 開始編輯
  const startEditing = async () => {
    if (!elder || !tenant) return;

    // 進入編輯模式（useEffect 會自動設定表單值）
    setIsEditing(true);

    // 載入可用設備
    try {
      const response = await elderService.getAvailableDevices(tenant.id);
      let devices = response.data || [];

      // 如果長者已有綁定設備，加入選單
      if (elder.device) {
        const deviceExists = devices.some(
          (d: any) => d.id === elder.device?.id,
        );
        if (!deviceExists) {
          devices = [elder.device, ...devices];
        }
      }

      setAvailableDevices(devices);
    } catch (error) {
      console.error("Failed to load available devices:", error);
      setAvailableDevices(elder.device ? [elder.device] : []);
    }
  };

  // 取消編輯
  const cancelEditing = () => {
    setIsEditing(false);
    reset();
  };

  // 儲存編輯
  const onSubmit = async (data: ElderFormData) => {
    if (!id) return;

    setSaving(true);
    try {
      await elderService.update(id, data);

      // 重新載入資料
      const elderRes = await elderService.getOne(id);
      setElder(elderRes.data);

      setIsEditing(false);
      window.alert("更新成功！");
    } catch (error: any) {
      console.error("Failed to update elder:", error);
      window.alert("更新失敗：" + (error.message || "未知錯誤"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with title and edit button */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? "編輯長輩" : "長輩詳情"}
          </h2>
          {isAdmin && !isEditing && (
            <button
              onClick={startEditing}
              className="h-10 px-5 bg-primary-500 text-white font-semibold active:scale-95 transition flex items-center justify-center"
              style={{ borderRadius: "40px" }}
            >
              編輯
            </button>
          )}
        </div>
      </div>

      {/* 編輯表單 */}
      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <div className="bg-white rounded-xl shadow-app-sm p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name", { required: "請輸入姓名" })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="陳阿公"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                性別
              </label>
              <select
                {...register("gender")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              >
                <option value="">請選擇</option>
                <option value="MALE">男</option>
                <option value="FEMALE">女</option>
                <option value="OTHER">其他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出生日期
              </label>
              <input
                type="date"
                {...register("birthDate")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                年齡
              </label>
              <input
                type="number"
                {...register("age")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="65"
                min="0"
                max="150"
              />
              <p className="text-xs text-gray-500 mt-1">或填寫出生日期</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                照片網址
              </label>
              <input
                type="url"
                {...register("photo")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="https://example.com/photo.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                輸入照片的網址（URL）
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電話
              </label>
              <input
                type="tel"
                {...register("phone")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="0912-345-678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                地址
              </label>
              <input
                {...register("address")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="社區 A 棟 3 樓"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                緊急聯絡人
              </label>
              <input
                {...register("emergencyContact")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="家屬姓名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                緊急聯絡電話
              </label>
              <input
                type="tel"
                {...register("emergencyPhone")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="0912-345-678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                狀態
              </label>
              <select
                {...register("status")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              >
                <option value="ACTIVE">正常</option>
                <option value="INACTIVE">不活躍</option>
                <option value="HOSPITALIZED">住院</option>
                <option value="DECEASED">已故</option>
                <option value="MOVED_OUT">遷出</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                不活躍警報閾值（小時）
              </label>
              <input
                type="number"
                {...register("inactiveThresholdHours")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                關聯設備（可選）
              </label>
              <select
                {...register("deviceId")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              >
                <option value="">暫不關聯設備</option>
                {availableDevices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.deviceName || device.uuid || device.macAddress}
                    {device.batteryLevel
                      ? ` - 電量 ${device.batteryLevel}%`
                      : ""}
                  </option>
                ))}
              </select>
              {availableDevices.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  此社區尚無可用設備
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                備註
              </label>
              <textarea
                {...register("notes")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition resize-none"
                rows={3}
                placeholder="特殊注意事項..."
              />
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="flex space-x-3 px-4">
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              className="flex-1 py-3 bg-white text-gray-700 rounded-xl font-semibold border-2 border-gray-300 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>取消</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-semibold active:scale-[0.98] transition disabled:bg-gray-400 flex items-center justify-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>儲存中...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>儲存</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 space-y-4">
          {/* 基本資料 */}
          <div className="bg-white rounded-xl shadow-app-sm p-5">
            <div className="flex items-start space-x-4 mb-4">
              {/* 頭像 */}
              <div className="flex-shrink-0">
                {elder.photo ? (
                  <img
                    src={elder.photo}
                    alt={elder.name}
                    className="w-20 h-20 rounded-full object-cover border-3 border-primary-500"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-3 border-primary-500">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
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
                    className={`px-3 py-1 rounded-full text-xs font-medium ${elder.status === "ACTIVE" ? "bg-green-100 text-green-700" : elder.status === "HOSPITALIZED" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}
                  >
                    {getStatusLabel(elder.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {elder.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{elder.phone}</span>
                </div>
              )}

              {elder.address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{elder.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* 緊急聯絡人 */}
          {(elder.emergencyContact || elder.emergencyPhone) && (
            <div className="bg-white rounded-xl shadow-app-sm p-5">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold text-gray-900">
                  緊急聯絡人
                </h3>
              </div>
              <div className="space-y-3">
                {elder.emergencyContact && (
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {elder.emergencyContact}
                    </span>
                  </div>
                )}
                {elder.emergencyPhone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a
                      href={`tel:${elder.emergencyPhone}`}
                      className="text-primary-500 font-medium"
                    >
                      {elder.emergencyPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 設備資訊 */}
          {elder.device && (
            <div className="bg-white rounded-xl shadow-app-sm p-5">
              <div className="flex items-center space-x-2 mb-4">
                <Signal className="w-5 h-5 text-gray-600" />
                <h3 className="text-base font-bold text-gray-900">關聯設備</h3>
              </div>
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="text-gray-600">序號: </span>
                  <code className="font-mono text-gray-900 font-semibold">
                    {elder.device.deviceName ||
                      elder.device.uuid ||
                      elder.device.macAddress}
                  </code>
                </div>
                {elder.device.batteryLevel && (
                  <div className="flex items-center space-x-2">
                    <Battery
                      className={`w-5 h-5 ${
                        elder.device.batteryLevel > 60
                          ? "text-green-500"
                          : elder.device.batteryLevel > 20
                            ? "text-yellow-500"
                            : "text-red-500"
                      }`}
                    />
                    <span className="text-sm text-gray-700">
                      電量: {elder.device.batteryLevel}%
                    </span>
                  </div>
                )}
                {elder.device.lastSeen && (
                  <div className="text-xs text-gray-500">
                    最後連線:{" "}
                    {formatDistanceToNow(new Date(elder.device.lastSeen), {
                      addSuffix: true,
                      locale: zhTW,
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 最新位置 */}
          {latestLocation && (
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-app-md p-5 text-white">
              <div className="flex items-center space-x-2 mb-4">
                <MapPinned className="w-5 h-5" />
                <h3 className="text-base font-bold">最新位置</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="font-semibold">
                      {latestLocation.gateway_name || "未知位置"}
                    </span>
                  </div>
                  <div className="text-xs opacity-90">
                    類型:{" "}
                    {latestLocation.gateway_type === "SCHOOL_ZONE"
                      ? "學區"
                      : latestLocation.gateway_type === "SAFE_ZONE"
                        ? "安全區"
                        : latestLocation.gateway_type === "OBSERVE_ZONE"
                          ? "觀察區"
                          : "停用"}
                  </div>
                </div>
                {latestLocation.lat && latestLocation.lng && (
                  <div>
                    <div className="text-xs opacity-75 mb-2">座標位置:</div>
                    <a
                      href={`https://www.google.com/maps?q=${latestLocation.lat},${latestLocation.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono bg-white/20 px-3 py-1.5 rounded-lg inline-block active:bg-white/30 transition"
                    >
                      {latestLocation.lat.toFixed(6)},{" "}
                      {latestLocation.lng.toFixed(6)}
                    </a>
                  </div>
                )}
                {latestLocation.last_seen && (
                  <div className="flex items-center space-x-2 text-xs opacity-90">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(
                        safeToDate(latestLocation.last_seen),
                        { addSuffix: true, locale: zhTW },
                      )}
                    </span>
                  </div>
                )}
                {latestLocation.rssi && (
                  <div className="text-xs opacity-75">
                    訊號強度: {latestLocation.rssi} dBm
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 行蹤記錄 */}
          <div className="bg-white rounded-xl shadow-app-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <h3 className="text-base font-bold text-gray-900">行蹤記錄</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTimeRange(24)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                    timeRange === 24
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  今天
                </button>
                <button
                  onClick={() => setTimeRange(168)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                    timeRange === 168
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  7天
                </button>
                <button
                  onClick={() => setTimeRange(720)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                    timeRange === 720
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  30天
                </button>
              </div>
            </div>

            {/* 活動時間軸 */}
            {activities.length === 0 ? (
              <div className="text-center py-10">
                <MapPinned className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">
                  此時間範圍內沒有活動記錄
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="border-l-2 border-primary-300 pl-4 pb-3 relative before:absolute before:left-[-6px] before:top-0 before:w-2.5 before:h-2.5 before:rounded-full before:bg-primary-500 before:border-2 before:border-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <MapPinned className="w-4 h-4 text-primary-600" />
                          <span className="font-semibold text-gray-900 text-sm">
                            {activity.gateway?.name || "接收點"}
                          </span>
                        </div>
                        {activity.gateway?.location && (
                          <p className="text-sm text-gray-600 mb-1">
                            {activity.gateway.location}
                          </p>
                        )}
                        {activity.latitude && activity.longitude && (
                          <p className="text-xs text-gray-500 font-mono">
                            {activity.latitude.toFixed(6)},{" "}
                            {activity.longitude.toFixed(6)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {activity.timestamp &&
                            format(
                              safeToDate(activity.timestamp),
                              "MM/dd HH:mm",
                              { locale: zhTW },
                            )}
                        </p>
                        {activity.rssi && (
                          <p className="text-xs text-gray-400">
                            RSSI: {activity.rssi}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 管理員操作區 - 移除長者 */}
          {isAdmin && (
            <div className="bg-white rounded-xl shadow-app-sm p-5 border-2 border-red-200">
              <h3 className="text-base font-bold text-gray-900 mb-2">
                危險操作
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                移除長者將永久刪除此長者的所有資料，此操作無法復原。
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold active:scale-[0.98] transition flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-5 h-5" />
                <span>移除長者</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 刪除確認對話框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  確認移除長者
                </h3>
                <p className="text-sm text-gray-600">此操作無法復原</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                您確定要移除{" "}
                <span className="font-semibold">{elder?.name}</span> 嗎？
              </p>
              <p className="text-sm text-red-600">⚠️ 這將永久刪除：</p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
                <li>• 長者基本資料</li>
                <li>• 所有行蹤記錄</li>
                <li>• 相關警報資料</li>
                <li>• 設備綁定關係</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleDeleteElder}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>移除中...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>確認移除</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
