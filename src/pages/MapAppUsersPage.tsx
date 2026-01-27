import { useEffect, useState } from "react";
import {
  Edit,
  Trash2,
  UserX,
  UserCheck,
  Smartphone,
  Link as LinkIcon,
  Unlink,
  Building2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { appUserService } from "../services/appUserService";
import { deviceService } from "../services/deviceService";
import { tenantService } from "../services/tenantService";
import type { Device, Tenant } from "../types";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";

interface LineUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  lineUserId?: string;
  lineDisplayName?: string;
  linePictureUrl?: string;
  joinedFromTenantId?: string; // 首次加入的社區
  lastAccessTenantId?: string; // 最後訪問的社區（優先顯示）
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  // 用於設備綁定的欄位（從 Device 反向查詢）
  boundDeviceId?: string;
}

export const MapAppUsersPage = () => {
  const [users, setUsers] = useState<LineUser[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<LineUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<LineUser | null>(null);
  const [bindingUser, setBindingUser] = useState<LineUser | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const {
    register: registerBind,
    handleSubmit: handleSubmitBind,
    reset: resetBind,
    formState: { errors: bindErrors },
  } = useForm();

  const [rawUsers, setRawUsers] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);

    // 訂閱 Line 用戶管理列表（即時監聽）
    const unsubscribeUsers = appUserService.subscribe((data) => {
      setRawUsers(data);
    });

    // 訂閱設備列表（用於綁定選擇）
    const unsubscribeDevices = deviceService.subscribe((deviceData) => {
      setDevices(deviceData);
    });

    // 訂閱社區列表
    const unsubscribeTenants = tenantService.subscribe((tenantData) => {
      setTenants(tenantData);
    });

    // 清理訂閱
    return () => {
      unsubscribeUsers();
      unsubscribeDevices();
      unsubscribeTenants();
    };
  }, []);

  // 當用戶或設備資料變更時，重新合併
  useEffect(() => {
    if (rawUsers.length > 0 || devices.length > 0) {
      const enrichedUsers = rawUsers.map((user) => {
        // 從設備列表中找到綁定到此用戶的設備
        const boundDevice = devices.find(
          (d) => d.bindingType === "LINE_USER" && d.boundTo === user.id,
        );
        return {
          ...user,
          boundDeviceId: boundDevice?.id,
        };
      });
      setUsers(enrichedUsers as LineUser[]);
      setTotal(enrichedUsers.length);
      setLoading(false);
    }
  }, [rawUsers, devices]);

  const handleEdit = (user: LineUser) => {
    setEditingUser(user);
    reset({
      name: user.name,
      phone: user.phone || "",
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      await appUserService.delete(deletingUser.id);
      alert("刪除成功");
    } catch (error: any) {
      alert(error.response?.data?.message || "刪除失敗");
    }
    setDeletingUser(null);
  };

  const handleToggleActive = async (user: LineUser) => {
    try {
      await appUserService.toggleActive(user.id);
      alert(user.isActive ? "已停用用戶" : "已啟用用戶");
    } catch (error: any) {
      alert(error.response?.data?.message || "操作失敗");
    }
  };

  const handleBindDevice = async (user: LineUser) => {
    setBindingUser(user);

    // 如果用戶已綁定設備，從 Device 取得 nickname, age 和 gender
    let nickname = "";
    let age = "";
    let gender = "";
    if (user.boundDeviceId) {
      try {
        const deviceResponse: any = await deviceService.getOne(
          user.boundDeviceId,
        );
        if (deviceResponse.data) {
          nickname = deviceResponse.data.mapUserNickname || "";
          age = deviceResponse.data.mapUserAge?.toString() || "";
          gender = deviceResponse.data.mapUserGender || "";
        }
      } catch (error) {
        console.error("Failed to load device info:", error);
      }
    }

    resetBind({
      boundDeviceId: user.boundDeviceId || "",
      deviceNickname: nickname,
      deviceOwnerAge: age,
      deviceOwnerGender: gender,
    });
  };

  const handleUnbindDevice = async (user: LineUser) => {
    if (!confirm(`確定要解綁「${user.name}」的設備嗎？`)) return;

    try {
      if (!user.boundDeviceId) return;
      // 將設備設為未綁定狀態
      await deviceService.update(user.boundDeviceId, {
        bindingType: "UNBOUND",
        boundTo: null,
        boundAt: null,
      });
      alert("設備解綁成功");
    } catch (error: any) {
      alert(error.response?.data?.message || "解綁失敗");
    }
  };

  const onSubmit = async (data: any) => {
    if (!editingUser) return;

    try {
      const submitData = {
        name: data.name,
        phone: data.phone || null,
      };

      await appUserService.update(editingUser.id, submitData);
      alert("更新成功");
      setShowModal(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "操作失敗");
    }
  };

  const onBindSubmit = async (data: any) => {
    if (!bindingUser) return;

    try {
      const updateData: any = {
        bindingType: "LINE_USER",
        boundTo: bindingUser.id,
        boundAt: new Date().toISOString(),
      };

      // 如果有填寫額外資訊，也一併更新
      if (data.deviceNickname) {
        updateData.mapUserNickname = data.deviceNickname;
      }
      if (data.deviceOwnerAge) {
        updateData.mapUserAge = parseInt(data.deviceOwnerAge);
      }
      if (data.deviceOwnerGender) {
        updateData.mapUserGender = data.deviceOwnerGender;
      }

      await deviceService.update(data.boundDeviceId, updateData);
      alert("設備綁定成功");
      setBindingUser(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "綁定失敗");
    }
  };

  // 獲取設備資訊（包含 nickname 和 age）
  const getDeviceInfo = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return null;

    return {
      ...device,
      nickname: device.mapUserNickname,
      age: device.mapUserAge,
    };
  };

  if (loading) {
    return <div className="text-center py-12">載入中...</div>;
  }

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Line 用戶管理</h2>
          <p className="text-sm text-gray-600 mt-1">
            管理所有 Line 用戶管理及其設備綁定（僅顯示 Line 用戶管理）
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">總用戶數</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">啟用用戶</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.isActive).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">已綁定設備</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.boundDeviceId).length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <LinkIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                用戶資訊
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                LINE 資訊
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                最後加入
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                綁定設備
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                狀態
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const boundDevice = user.boundDeviceId
                ? getDeviceInfo(user.boundDeviceId)
                : null;

              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {user.linePictureUrl ? (
                        <img
                          src={user.linePictureUrl}
                          alt={user.lineDisplayName || user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.name}
                        </div>
                        {user.phone && (
                          <div className="text-xs text-gray-500">
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {user.lineDisplayName && (
                        <div className="text-gray-900 flex items-center space-x-1">
                          <span className="text-green-600">LINE:</span>
                          <span>{user.lineDisplayName}</span>
                        </div>
                      )}
                      {user.lineUserId && (
                        <div className="text-xs text-gray-400 font-mono">
                          {user.lineUserId.substring(0, 12)}...
                        </div>
                      )}
                      {!user.lineUserId && (
                        <span className="text-gray-400">未連結 LINE</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      // 優先顯示 lastAccessTenantId（最後訪問的社區）
                      const tenantId =
                        user.lastAccessTenantId || user.joinedFromTenantId;
                      if (!tenantId) {
                        return (
                          <span className="text-gray-400 text-sm">
                            未加入社區
                          </span>
                        );
                      }

                      const tenant = tenants.find((t) => t.id === tenantId);
                      return tenant ? (
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {tenant.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">未知社區</span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {boundDevice ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 flex items-center space-x-1">
                          <LinkIcon className="w-4 h-4 text-green-600" />
                          <span>{boundDevice.deviceName || "未命名"}</span>
                        </div>
                        <div className="text-gray-500 text-xs font-mono">
                          {boundDevice.uuid.substring(0, 8)}...
                        </div>
                        <div className="text-gray-500 text-xs">
                          M: {boundDevice.major} / m: {boundDevice.minor}
                        </div>
                        {boundDevice?.boundAt && (
                          <div className="text-gray-400 text-xs">
                            {new Date(boundDevice.boundAt).toLocaleDateString(
                              "zh-TW",
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">未綁定</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isActive ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 inline-flex items-center">
                        <UserCheck className="w-3 h-3 mr-1" />
                        啟用
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 inline-flex items-center">
                        <UserX className="w-3 h-3 mr-1" />
                        停用
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {user.boundDeviceId ? (
                        <button
                          onClick={() => handleUnbindDevice(user)}
                          className="text-orange-600 hover:text-orange-900"
                          title="解綁設備"
                        >
                          <Unlink className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBindDevice(user)}
                          className="text-purple-600 hover:text-purple-900"
                          title="綁定設備"
                        >
                          <LinkIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`${
                          user.isActive
                            ? "text-orange-600 hover:text-orange-900"
                            : "text-green-600 hover:text-green-900"
                        }`}
                        title={user.isActive ? "停用" : "啟用"}
                      >
                        {user.isActive ? (
                          <UserX className="w-5 h-5" />
                        ) : (
                          <UserCheck className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-primary-600 hover:text-primary-700"
                        title="編輯"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setDeletingUser(user)}
                        className="text-red-600 hover:text-red-900"
                        title="刪除"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          顯示 {(page - 1) * 10 + 1} 到 {Math.min(page * 10, total)} 筆，共{" "}
          {total} 筆 Line 用戶管理
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn-secondary"
          >
            上一頁
          </button>
          <span className="px-4 py-2 text-gray-700">
            第 {page} / {totalPages} 頁
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="btn-secondary"
          >
            下一頁
          </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingUser ? "編輯用戶" : "新增用戶"}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {editingUser && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>提示：</strong>
                  Email 和 LINE 資訊由系統自動管理，無法手動修改
                </p>
              </div>
            )}

            <div>
              <label className="label">姓名 *</label>
              <input
                {...register("name", { required: "請輸入姓名" })}
                className="input"
                placeholder="請輸入姓名"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="label">電話</label>
              <input
                {...register("phone")}
                type="tel"
                className="input"
                placeholder="0912-345-678"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button type="submit" className="btn-primary">
                更新
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bind Device Modal */}
      {bindingUser && (
        <Modal
          isOpen={!!bindingUser}
          onClose={() => setBindingUser(null)}
          title="綁定設備"
        >
          <form onSubmit={handleSubmitBind(onBindSubmit)} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                為「<strong>{bindingUser.name}</strong>」綁定設備
              </p>
            </div>

            <div>
              <label className="label">選擇設備 *</label>
              <select
                {...registerBind("boundDeviceId", { required: "請選擇設備" })}
                className="input"
              >
                <option value="">請選擇設備</option>
                {devices
                  .filter(
                    (d) =>
                      d.bindingType === "UNBOUND" ||
                      (d.bindingType === "LINE_USER" &&
                        d.boundTo === bindingUser?.id),
                  )
                  .map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.deviceName || "未命名"} - UUID:{" "}
                      {device.uuid.substring(0, 8)}... (M:{device.major}/m:
                      {device.minor})
                    </option>
                  ))}
              </select>
              {bindErrors.boundDeviceId && (
                <p className="text-red-500 text-sm mt-1">
                  {bindErrors.boundDeviceId.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="label">設備暱稱</label>
              <input
                {...registerBind("deviceNickname")}
                className="input"
                placeholder="例如：爸爸的卡片、媽媽的手錶"
              />
              <p className="text-xs text-gray-500 mt-1">
                為設備取一個容易識別的名稱
              </p>
            </div>

            <div>
              <label className="label">使用者年齡</label>
              <input
                {...registerBind("deviceOwnerAge")}
                type="number"
                className="input"
                placeholder="例如：75"
                min="0"
                max="150"
              />
              <p className="text-xs text-gray-500 mt-1">設備使用者的年齡</p>
            </div>

            <div>
              <label className="label">使用者性別</label>
              <select {...registerBind("deviceOwnerGender")} className="input">
                <option value="">請選擇</option>
                <option value="MALE">男性</option>
                <option value="FEMALE">女性</option>
                <option value="OTHER">其他</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">設備使用者的性別</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setBindingUser(null)}
                className="btn-secondary"
              >
                取消
              </button>
              <button type="submit" className="btn-primary">
                綁定
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        title="確認刪除"
        message={`確定要刪除「${deletingUser?.name}」嗎？此操作無法復原。`}
        confirmText="刪除"
        type="danger"
      />
    </div>
  );
};
