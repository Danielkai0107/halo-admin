import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { uuidService } from "../services/uuidService";
import type { BeaconUUID } from "../types";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";

export const UUIDsPage = () => {
  const [uuids, setUuids] = useState<BeaconUUID[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUuid, setEditingUuid] = useState<BeaconUUID | null>(null);
  const [deletingUuid, setDeletingUuid] = useState<BeaconUUID | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const unsubscribe = uuidService.subscribe((data) => {
      setUuids(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreate = () => {
    setEditingUuid(null);
    reset({
      name: "",
      uuid: "",
      description: "",
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (uuid: BeaconUUID) => {
    setEditingUuid(uuid);
    reset({
      name: uuid.name,
      uuid: uuid.uuid,
      description: uuid.description || "",
      isActive: uuid.isActive,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: any) => {
    try {
      if (editingUuid) {
        await uuidService.update(editingUuid.id, data);
        alert("更新成功");
      } else {
        await uuidService.create(data);
        alert("新增成功");
      }
      setShowModal(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "操作失敗");
    }
  };

  const handleDeleteClick = (uuid: BeaconUUID) => {
    setDeletingUuid(uuid);
  };

  const handleDelete = async () => {
    if (!deletingUuid) return;

    try {
      await uuidService.delete(deletingUuid.id);
      alert("刪除成功");
      setDeletingUuid(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "刪除失敗");
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <span className="badge badge-success">啟用中</span>;
    }
    return <span className="badge badge-secondary">已停用</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">UUID 管理</h1>
          <p className="text-gray-600 mt-1">管理 Beacon 服務識別碼（UUID）</p>
          <p className="text-sm text-blue-600 mt-1">
            統一管理公司使用的 UUID，方便在設備管理中選擇
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>新增 UUID</span>
        </button>
      </div>

      {/* UUIDs List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  名稱
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  UUID
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  說明
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  狀態
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {uuids.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    尚無 UUID 記錄
                  </td>
                </tr>
              ) : (
                uuids.map((uuid) => (
                  <tr
                    key={uuid.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900">
                          {uuid.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-xs font-mono bg-blue-50 text-blue-800 px-2 py-1 rounded">
                        {uuid.uuid}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {uuid.description || "-"}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(uuid.isActive)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(uuid)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="編輯"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(uuid)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="刪除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUuid ? "編輯 UUID" : "新增 UUID"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">名稱 *</label>
            <input
              {...register("name", { required: true })}
              className="input"
              placeholder="例如：公司主要 UUID"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">請輸入名稱</p>
            )}
          </div>

          <div>
            <label className="label">UUID *</label>
            <input
              {...register("uuid", {
                required: true,
                pattern: {
                  value:
                    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
                  message: "UUID 格式不正確",
                },
              })}
              className="input font-mono text-sm"
              placeholder="E2C56DB5-DFFB-48D2-B060-D0F5A71096E0"
            />
            {errors.uuid && (
              <p className="text-sm text-red-600 mt-1">
                {(errors.uuid.message as string) || "請輸入 UUID"}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              格式：XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
            </p>
          </div>

          <div>
            <label className="label">說明</label>
            <textarea
              {...register("description")}
              className="input"
              rows={3}
              placeholder="例如：用於所有工卡型 Beacon"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register("isActive")}
              className="rounded border-gray-300"
            />
            <label className="text-sm text-gray-700">啟用</label>
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
              {editingUuid ? "更新" : "新增"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingUuid}
        onClose={() => setDeletingUuid(null)}
        onConfirm={handleDelete}
        title="確認刪除"
        message={`確定要刪除 UUID「${deletingUuid?.name}」嗎？此操作無法復原。`}
        confirmText="刪除"
        type="danger"
      />
    </div>
  );
};
