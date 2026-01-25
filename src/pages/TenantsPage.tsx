import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Users, Link } from "lucide-react";
import { useForm } from "react-hook-form";
import { tenantService } from "../services/tenantService";
import type { Tenant } from "../types";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { AppMembersModal } from "../components/AppMembersModal";

export const TenantsPage = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [appMembersModal, setAppMembersModal] = useState<{
    tenantId: string;
    tenantName: string;
  } | null>(null);

  // 批次選擇相關
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    setLoading(true);

    // 訂閱社區列表（即時監聽）
    const unsubscribe = tenantService.subscribe((data) => {
      setTenants(data);
      setTotal(data.length);
      setLoading(false);
    });

    // 清理訂閱
    return () => unsubscribe();
  }, []);

  const loadTenants = () => {
    // 即時監聽會自動更新，此函數保留用於相容性
  };

  const handleCreate = () => {
    setEditingTenant(null);
    reset({});
    setShowModal(true);
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    reset(tenant);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingTenant) return;

    try {
      await tenantService.delete(deletingTenant.id);
      alert("刪除成功");
      loadTenants();
    } catch (error: any) {
      alert(error.response?.data?.message || "刪除失敗");
    }
  };

  // 批次選擇相關函數
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTenants(tenants.map((t) => t.id));
    } else {
      setSelectedTenants([]);
    }
  };

  const handleSelectTenant = (tenantId: string, checked: boolean) => {
    if (checked) {
      setSelectedTenants((prev) => [...prev, tenantId]);
    } else {
      setSelectedTenants((prev) => prev.filter((id) => id !== tenantId));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedTenants.length === 0) {
      alert("請至少選擇一個社區");
      return;
    }

    if (
      !confirm(
        `確定要刪除選中的 ${selectedTenants.length} 個社區嗎？此操作會同時刪除該社區的所有長者、設備和記錄，無法復原！`,
      )
    ) {
      return;
    }

    try {
      await Promise.all(selectedTenants.map((id) => tenantService.delete(id)));
      alert(`成功刪除 ${selectedTenants.length} 個社區`);
      setSelectedTenants([]);
      loadTenants();
    } catch (error: any) {
      alert(error.response?.data?.message || "批次刪除失敗");
    }
  };

  const handleCopyLiffLink = async (tenant: Tenant) => {
    try {
      // 優先使用社區的 lineLiffId，如果沒有則使用全局 LIFF ID
      const GLOBAL_LIFF_ID = "2008889284-MuPboxSM"; // 請替換為您的實際 LIFF ID
      const liffId = tenant.lineLiffId || GLOBAL_LIFF_ID;

      // 生成 LINE LIFF 連結
      const liffLink = `https://liff.line.me/${liffId}`;

      // 複製到剪貼簿
      await navigator.clipboard.writeText(liffLink);

      let message = `已複製 LIFF 連結到剪貼簿！\n\n${liffLink}\n\n`;
      if (tenant.lineLiffId) {
        message += `說明：\n1. 此連結使用社區專屬的 LIFF ID\n2. 用戶登入後會看到他所屬的社區\n3. 可將此連結設定到 LINE OA 的圖文選單中`;
      } else {
        message += `說明：\n1. 此連結使用全局 LIFF ID（建議在社區設定中填入專屬的 LINE LIFF ID）\n2. 用戶登入後會看到他所屬的社區\n3. 可將此連結設定到 LINE OA 的圖文選單中`;
      }

      alert(message);
    } catch (error) {
      console.error("Failed to copy LIFF link:", error);
      alert("複製失敗，請重試");
    }
  };

  const onSubmit = async (data: any) => {
    try {
      if (editingTenant) {
        await tenantService.update(editingTenant.id, data);
        alert("更新成功");
      } else {
        await tenantService.create(data);
        alert("新增成功");
      }
      setShowModal(false);
      loadTenants();
    } catch (error: any) {
      alert(error.response?.data?.message || "操作失敗");
    }
  };

  if (loading) {
    return <div className="text-center py-12">載入中...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">社區管理</h1>
          <p className="text-gray-600 mt-1">管理所有社區資料</p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedTenants.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="btn-secondary flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-5 h-5" />
              <span>刪除選中項 ({selectedTenants.length})</span>
            </button>
          )}
          <button
            onClick={handleCreate}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>新增社區</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋社區..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Tenants List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 w-12">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={
                      selectedTenants.length === tenants.length &&
                      tenants.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  社區代碼
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  名稱
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  聯絡人
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  電話
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  狀態
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  管理
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedTenants.includes(tenant.id)}
                      onChange={(e) =>
                        handleSelectTenant(tenant.id, e.target.checked)
                      }
                    />
                  </td>
                  <td className="py-3 px-4 text-sm font-mono">{tenant.code}</td>
                  <td className="py-3 px-4 text-sm font-medium">
                    {tenant.name}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {tenant.contactPerson || "-"}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {tenant.contactPhone || "-"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tenant.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tenant.isActive ? "啟用" : "停用"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() =>
                          setAppMembersModal({
                            tenantId: tenant.id,
                            tenantName: tenant.name,
                          })
                        }
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="App 成員管理"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopyLiffLink(tenant)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                        title="複製 LIFF 連結"
                      >
                        <Link className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleEdit(tenant)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium mr-3"
                    >
                      <Edit className="w-4 h-4 inline mr-1" />
                      編輯
                    </button>
                    <button
                      onClick={() => setDeletingTenant(tenant)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-gray-600">總共 {total} 個社區</p>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              上一頁
            </button>
            <span className="px-3 py-1">第 {page} 頁</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * 10 >= total}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              下一頁
            </button>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTenant ? "編輯社區" : "新增社區"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">社區代碼 *</label>
              <input
                {...register("code", { required: true })}
                className="input"
                placeholder="DALOVE001"
                disabled={!!editingTenant}
              />
              {errors.code && (
                <p className="text-sm text-red-600 mt-1">請輸入社區代碼</p>
              )}
              {editingTenant && (
                <p className="text-xs text-gray-500 mt-1">社區代碼不可修改</p>
              )}
            </div>

            <div>
              <label className="label">社區名稱 *</label>
              <input
                {...register("name", { required: true })}
                className="input"
                placeholder="大愛社區"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">請輸入社區名稱</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="label">地址</label>
              <input
                {...register("address")}
                className="input"
                placeholder="台北市信義區信義路五段 7 號"
              />
            </div>

            <div>
              <label className="label">聯絡人</label>
              <input
                {...register("contactPerson")}
                className="input"
                placeholder="王經理"
              />
            </div>

            <div>
              <label className="label">聯絡電話</label>
              <input
                type="tel"
                {...register("contactPhone")}
                className="input"
                placeholder="02-1234-5678"
              />
            </div>

            {/* LINE 通知設定 */}
            <div className="col-span-2 pt-4 border-t border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                LINE 通知設定
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                用於接收警報通知和系統訊息，如需使用請填寫以下資訊
              </p>
            </div>

            <div className="col-span-2">
              <label className="label">LINE LIFF ID</label>
              <input
                {...register("lineLiffId")}
                className="input"
                placeholder="1234567890-abcdefgh"
              />
              <p className="text-xs text-gray-500 mt-1">
                LINE Login Channel 的 LIFF ID
              </p>
            </div>

            <div className="col-span-2">
              <label className="label">LIFF Endpoint URL</label>
              <input
                {...register("lineLiffEndpointUrl")}
                className="input"
                placeholder="https://your-domain.com/liff"
              />
              <p className="text-xs text-gray-500 mt-1">
                LIFF 應用程式的端點網址（用於 LIFF 設定中的 Endpoint URL）
              </p>
            </div>

            <div className="col-span-2">
              <label className="label">Channel Access Token</label>
              <input
                type="password"
                {...register("lineChannelAccessToken")}
                className="input font-mono text-sm"
                placeholder="輸入 Channel Access Token"
              />
              <p className="text-xs text-gray-500 mt-1">
                用於發送 LINE 訊息的存取權杖
              </p>
            </div>

            <div className="col-span-2">
              <label className="label">Channel Secret</label>
              <input
                type="password"
                {...register("lineChannelSecret")}
                className="input font-mono text-sm"
                placeholder="輸入 Channel Secret"
              />
              <p className="text-xs text-gray-500 mt-1">
                用於驗證 LINE 請求的密鑰
              </p>
            </div>

            <div className="col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register("isActive")}
                  className="rounded"
                  defaultChecked
                />
                <span className="text-sm font-medium text-gray-700">
                  啟用此社區
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              取消
            </button>
            <button type="submit" className="btn-primary">
              {editingTenant ? "更新" : "新增"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTenant}
        onClose={() => setDeletingTenant(null)}
        onConfirm={handleDelete}
        title="確認刪除"
        message={`確定要刪除社區「${deletingTenant?.name}」嗎？此操作會同時刪除該社區的所有長者、設備和記錄，無法復原！`}
        confirmText="刪除"
        type="danger"
      />

      {/* App Members Modal */}
      {appMembersModal && (
        <AppMembersModal
          isOpen={true}
          onClose={() => setAppMembersModal(null)}
          tenantId={appMembersModal.tenantId}
          tenantName={appMembersModal.tenantName}
        />
      )}
    </div>
  );
};
