import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { elderService } from "../../services/elderService";
import { useAuth } from "../../hooks/useAuth";
import { useTenantStore } from "../../store/tenantStore";
import type { Elder } from "../../types";

interface ElderFormData extends Partial<Elder> {
  deviceId?: string;
}

export const AddElderScreen = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAuth();
  const tenant = useTenantStore((state) => state.selectedTenant);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ElderFormData>();

  useEffect(() => {
    // 等待認證完成
    if (isLoading) return;

    // 只有管理員可以訪問
    if (!isAdmin) {
      window.alert("只有管理員可以新增長輩");
      navigate("/elders");
      return;
    }

    if (tenant) {
      loadAvailableDevices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, isAdmin, isLoading]);

  const loadAvailableDevices = async () => {
    if (!tenant) return;

    try {
      const response = await elderService.getAvailableDevices(tenant.id);
      setAvailableDevices(response.data || []);
    } catch (error) {
      console.error("Failed to load available devices:", error);
    }
  };

  const onSubmit = async (data: ElderFormData) => {
    if (!tenant) return;

    setSubmitting(true);
    try {
      await elderService.create({
        ...data,
        tenantId: tenant.id,
      });
      window.alert("新增長者成功！");
      navigate("/elders");
    } catch (error: any) {
      console.error("Failed to create elder:", error);
      window.alert("新增失敗：" + (error.message || "未知錯誤"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-gray-900">新增長輩</h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
        {/* 基本資料 */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">
            基本資料
          </h3>

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
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            </div>
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
              照片網址
            </label>
            <input
              type="url"
              {...register("photo")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="https://example.com/photo.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">輸入照片的網址（URL）</p>
          </div>
        </div>

        {/* 聯絡資訊 */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">
            聯絡資訊
          </h3>

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
        </div>

        {/* 緊急聯絡人 */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">
            緊急聯絡人
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              姓名
            </label>
            <input
              {...register("emergencyContact")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="家屬姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              電話
            </label>
            <input
              type="tel"
              {...register("emergencyPhone")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="0912-345-678"
            />
          </div>
        </div>

        {/* 其他設定 */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">
            其他設定
          </h3>

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
              min="1"
              max="168"
            />
            <p className="text-xs text-gray-500 mt-1">
              超過此時間未活動將發送警報
            </p>
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
                  {device.batteryLevel ? ` - 電量 ${device.batteryLevel}%` : ""}
                </option>
              ))}
            </select>
            {availableDevices.length === 0 && (
              <p className="text-xs text-orange-600 mt-1">目前沒有可用的設備</p>
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
              placeholder="其他相關資訊..."
            />
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-primary-600 text-white rounded-xl font-semibold text-base shadow-lg active:scale-[0.98] transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>新增中...</span>
              </>
            ) : (
              <span>新增長輩</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/elders")}
            className="w-full py-4 bg-white text-gray-700 rounded-xl font-semibold text-base border-2 border-gray-300 active:scale-[0.98] transition"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
};
