import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, UserX, UserCheck, Shield, User as UserIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { saasUserService } from '../services/saasUserService';
import { tenantService } from '../services/tenantService';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { SaasUser, Tenant } from '../types';

export const SaasUsersPage = () => {
  const [users, setUsers] = useState<SaasUser[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTenantId, setFilterTenantId] = useState<string>('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SaasUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<SaasUser | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    setLoading(true);
    
    // 訂閱 SaaS 用戶列表（即時監聽）
    const unsubscribe = saasUserService.subscribe(
      (data) => {
        setUsers(data);
        setLoading(false);
      },
      filterTenantId || undefined
    );

    return () => unsubscribe();
  }, [filterTenantId]);

  const loadTenants = async () => {
    try {
      const response: any = await tenantService.getAll(1, 1000);
      setTenants(response.data.data || []);
    } catch (error) {
      console.error('Failed to load tenants:', error);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    reset({
      email: '',
      password: '',
      name: '',
      phone: '',
      tenantId: '',
      role: 'ADMIN',
    });
    setShowModal(true);
  };

  const handleEdit = (user: SaasUser) => {
    setEditingUser(user);
    reset({
      email: user.email,
      name: user.name,
      phone: user.phone,
      tenantId: user.tenantId,
      role: user.role,
      password: '', // 不預填密碼
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    
    try {
      await saasUserService.delete(deletingUser.id);
      alert('用戶已停用');
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(error.message || '操作失敗');
    }
    setDeletingUser(null);
  };

  const handleToggleActive = async (user: SaasUser) => {
    try {
      await saasUserService.toggleActive(user.id);
      alert(user.isActive ? '已停用用戶' : '已啟用用戶');
    } catch (error: any) {
      console.error('Toggle active error:', error);
      alert(error.message || '操作失敗');
    }
  };

  const onSubmit = async (data: any) => {
    try {
      if (editingUser) {
        // 編輯模式：只更新 Firestore 資料
        const updateData: any = {
          name: data.name,
          phone: data.phone,
          tenantId: data.tenantId,
          role: data.role,
        };

        await saasUserService.update(editingUser.id, updateData);
        alert('更新成功');
      } else {
        // 新增模式：建立 Firebase Auth 和 Firestore
        if (!data.password) {
          alert('請輸入密碼');
          return;
        }

        await saasUserService.create({
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone,
          tenantId: data.tenantId,
          role: data.role,
        });
        
        alert('新增成功');
      }
      
      setShowModal(false);
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(error.message || '操作失敗');
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      ADMIN: 'bg-purple-100 text-purple-800',
      MEMBER: 'bg-blue-100 text-blue-800',
    };
    const labels = {
      ADMIN: '管理員',
      MEMBER: '成員',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role as keyof typeof styles]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SaaS 用戶管理</h1>
          <p className="text-sm text-gray-600 mt-1">管理社區管理網頁版的用戶帳號</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          新增用戶
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">篩選社區：</label>
          <select
            className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            value={filterTenantId}
            onChange={(e) => setFilterTenantId(e.target.value)}
          >
            <option value="">全部社區</option>
            {tenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                用戶
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                社區
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                角色
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                狀態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  暫無用戶資料
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar ? (
                          <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-gray-400">{user.phone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.tenant?.name || '-'}
                    </div>
                    {user.tenant?.code && (
                      <div className="text-xs text-gray-500">{user.tenant.code}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? '啟用' : '停用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                      title="編輯"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`inline-flex items-center ${
                        user.isActive
                          ? 'text-yellow-600 hover:text-yellow-900'
                          : 'text-green-600 hover:text-green-900'
                      }`}
                      title={user.isActive ? '停用' : '啟用'}
                    >
                      {user.isActive ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setDeletingUser(user)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center"
                      title="刪除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? '編輯用戶' : '新增用戶'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register('email', { 
                required: '請輸入 Email',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '無效的 Email 格式',
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={!!editingUser}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>
            )}
            {editingUser && (
              <p className="mt-1 text-xs text-gray-500">Email 無法修改</p>
            )}
          </div>

          {/* Password */}
          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密碼 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                {...register('password', { 
                  required: !editingUser ? '請輸入密碼' : false,
                  minLength: {
                    value: 6,
                    message: '密碼至少需要 6 個字元'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="至少 6 個字元"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message as string}</p>
              )}
            </div>
          )}

          {editingUser && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                注意：目前無法透過介面修改密碼。如需重設密碼，請使用 Firebase Console 或聯絡技術人員。
              </p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name', { required: '請輸入姓名' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              電話
            </label>
            <input
              type="tel"
              {...register('phone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Tenant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              所屬社區 <span className="text-red-500">*</span>
            </label>
            <select
              {...register('tenantId', { required: '請選擇社區' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">請選擇社區</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.code})
                </option>
              ))}
            </select>
            {errors.tenantId && (
              <p className="mt-1 text-sm text-red-600">{errors.tenantId.message as string}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              角色 <span className="text-red-500">*</span>
            </label>
            <select
              {...register('role', { required: '請選擇角色' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="ADMIN">管理員（可新增/編輯/刪除）</option>
              <option value="MEMBER">成員（僅查看）</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message as string}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {editingUser ? '更新' : '新增'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        title="確認停用用戶"
        message={`確定要停用用戶「${deletingUser?.name}」嗎？此操作會將帳號設為停用狀態，用戶將無法登入。`}
        confirmText="停用"
        type="danger"
      />

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">關於 SaaS 用戶</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>SaaS 用戶可登入社區管理網頁版（Community Portal）</li>
              <li>使用 Email/密碼登入（非 LINE 登入）</li>
              <li>每個用戶屬於一個社區，只能管理該社區的資料</li>
              <li>管理員角色可以新增/編輯長者、設定通知點等</li>
              <li>成員角色只能查看資料</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">總用戶數</div>
          <div className="text-2xl font-bold text-gray-900">{users.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">啟用用戶</div>
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.isActive).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">管理員</div>
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.role === 'ADMIN').length}
          </div>
        </div>
      </div>
    </div>
  );
};
