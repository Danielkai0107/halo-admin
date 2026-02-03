import { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  Store as StoreIcon,
  User as UserIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { shopUserService } from "../services/shopUserService";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { ShopUser, Store } from "../types";

export const ShopUsersPage = () => {
  const [users, setUsers] = useState<ShopUser[]>([]);
  const [managedStores, setManagedStores] = useState<Record<string, Store[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ShopUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ShopUser | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    setLoading(true);

    // 訂閱商店用戶列表（即時監聽）
    const unsubscribe = shopUserService.subscribe((data) => {
      setUsers(data);
      setLoading(false);

      // 載入每個用戶管理的商店
      data.forEach(async (user) => {
        try {
          const storesResponse = await shopUserService.getManagedStores(
            user.id,
          );
          setManagedStores((prev) => ({
            ...prev,
            [user.id]: storesResponse.data,
          }));
        } catch (error) {
          console.error(`Failed to load stores for user ${user.id}:`, error);
        }
      });
    });

    return () => unsubscribe();
  }, []);

  const handleCreate = () => {
    setEditingUser(null);
    reset({
      email: "",
      password: "",
      name: "",
      phone: "",
      role: "STAFF",
    });
    setShowModal(true);
  };

  const handleEdit = (user: ShopUser) => {
    setEditingUser(user);
    reset({
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      password: "", // 不預填密碼
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      await shopUserService.delete(deletingUser.id);
      alert("用戶已停用");
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(error.message || "操作失敗");
    }
    setDeletingUser(null);
  };

  const handleToggleActive = async (user: ShopUser) => {
    try {
      await shopUserService.toggleActive(user.id);
      alert(user.isActive ? "已停用用戶" : "已啟用用戶");
    } catch (error: any) {
      console.error("Toggle active error:", error);
      alert(error.message || "操作失敗");
    }
  };

  const onSubmit = async (data: any) => {
    try {
      if (editingUser) {
        // 編輯模式：只更新 Firestore 資料
        const updateData: any = {
          name: data.name,
          phone: data.phone,
          role: data.role,
        };

        await shopUserService.update(editingUser.id, updateData);
        alert("更新成功");
      } else {
        // 新增模式：建立 Firebase Auth 和 Firestore
        if (!data.password) {
          alert("請輸入密碼");
          return;
        }

        await shopUserService.create({
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone,
          role: data.role,
        });

        alert("新增成功");
      }

      setShowModal(false);
    } catch (error: any) {
      console.error("Submit error:", error);
      alert(error.message || "操作失敗");
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      OWNER: "bg-purple-100 text-purple-800",
      STAFF: "bg-blue-100 text-blue-800",
    };

    const icons = {
      OWNER: StoreIcon,
      STAFF: UserIcon,
    };

    const labels = {
      OWNER: "店主",
      STAFF: "員工",
    };

    const Icon = icons[role as keyof typeof icons] || UserIcon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[role as keyof typeof styles] || "bg-gray-100 text-gray-800"}`}
      >
        <Icon className="w-3 h-3" />
        {labels[role as keyof typeof labels] || role}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-12">載入中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">商店管理員</h2>
          <p className="text-sm text-gray-600 mt-1">
            管理商店管理員帳號，可分配到商店進行資料管理
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>新增管理員</span>
        </button>
      </div>

      {/* Users List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  姓名
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  電話
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  角色
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  管理商店
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
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    尚無商店管理員
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-sm font-medium">
                      {user.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.phone || "-"}
                    </td>
                    <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {managedStores[user.id] &&
                      managedStores[user.id].length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {managedStores[user.id].map((store) => (
                            <span
                              key={store.id}
                              className="inline-block text-xs bg-green-50 text-green-700 px-2 py-1 rounded"
                            >
                              {store.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">未分配</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.isActive ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            啟用
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3" />
                            停用
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => setDeletingUser(user)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          總共 {users.length} 位管理員
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? "編輯管理員" : "新增管理員"}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              {...register("email", {
                required: "請輸入 Email",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "無效的 Email 格式",
                },
              })}
              type="email"
              className="input"
              placeholder="user@example.com"
              disabled={!!editingUser}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {(errors.email as any).message}
              </p>
            )}
            {editingUser && (
              <p className="text-xs text-gray-500 mt-1">Email 無法修改</p>
            )}
          </div>

          {!editingUser && (
            <div>
              <label className="label">
                密碼 <span className="text-red-500">*</span>
              </label>
              <input
                {...register("password", {
                  required: !editingUser ? "請輸入密碼" : false,
                  minLength: {
                    value: 6,
                    message: "密碼至少需要 6 個字元",
                  },
                })}
                type="password"
                className="input"
                placeholder="至少 6 個字元"
              />
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {(errors.password as any).message}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="label">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name", { required: "請輸入姓名" })}
              className="input"
              placeholder="王小明"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">
                {(errors.name as any).message}
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

          <div>
            <label className="label">
              角色 <span className="text-red-500">*</span>
            </label>
            <select {...register("role", { required: true })} className="input">
              <option value="STAFF">員工</option>
              <option value="OWNER">店主</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              店主擁有完整權限，員工可編輯活動資訊
            </p>
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
              {editingUser ? "更新" : "新增"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        title="確認停用"
        message={`確定要停用「${deletingUser?.name}」嗎？此操作會將用戶設為停用狀態。`}
        confirmText="停用"
        type="danger"
      />
    </div>
  );
};
