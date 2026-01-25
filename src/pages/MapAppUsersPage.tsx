import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Edit, Trash2, UserX, UserCheck, Plus, Smartphone, 
  Bell, BellOff, Link as LinkIcon, Unlink 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { mapAppUserService } from '../services/mapAppUserService';
import { deviceService } from '../services/deviceService';
import type { MapAppUser, Device } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const MapAppUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<MapAppUser[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<MapAppUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<MapAppUser | null>(null);
  const [bindingUser, setBindingUser] = useState<MapAppUser | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: registerBind, handleSubmit: handleSubmitBind, reset: resetBind, formState: { errors: bindErrors } } = useForm();

  useEffect(() => {
    setLoading(true);
    
    // 訂閱地圖 App 用戶列表（即時監聽）
    const unsubscribeUsers = mapAppUserService.subscribe((data) => {
      setUsers(data as MapAppUser[]);
      setTotal(data.length);
      setLoading(false);
    });

    // 載入設備列表（用於綁定選擇）
    loadDevices();

    // 清理訂閱
    return () => {
      unsubscribeUsers();
    };
  }, []);

  const loadDevices = async () => {
    try {
      const response: any = await deviceService.getAll(1, 1000);
      setDevices(response.data.data || []);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    reset({
      name: '',
      email: '',
      phone: '',
      deviceNickname: '',
      deviceOwnerAge: '',
    });
    setShowModal(true);
  };

  const handleEdit = (user: MapAppUser) => {
    setEditingUser(user);
    reset({
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    
    try {
      await mapAppUserService.delete(deletingUser.id);
      alert('刪除成功');
    } catch (error: any) {
      alert(error.response?.data?.message || '刪除失敗');
    }
    setDeletingUser(null);
  };

  const handleToggleActive = async (user: MapAppUser) => {
    try {
      await mapAppUserService.toggleActive(user.id);
      alert(user.isActive ? '已停用用戶' : '已啟用用戶');
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失敗');
    }
  };

  const handleToggleNotification = async (user: MapAppUser) => {
    try {
      await mapAppUserService.toggleNotification(user.id);
      alert(user.notificationEnabled ? '已關閉通知' : '已開啟通知');
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失敗');
    }
  };

  const handleBindDevice = async (user: MapAppUser) => {
    setBindingUser(user);
    
    // 如果用戶已綁定設備，從 Device 取得 nickname, age 和 gender
    let nickname = '';
    let age = '';
    let gender = '';
    if (user.boundDeviceId) {
      try {
        const deviceResponse: any = await deviceService.getOne(user.boundDeviceId);
        if (deviceResponse.data) {
          nickname = deviceResponse.data.mapUserNickname || '';
          age = deviceResponse.data.mapUserAge?.toString() || '';
          gender = deviceResponse.data.mapUserGender || '';
        }
      } catch (error) {
        console.error('Failed to load device info:', error);
      }
    }
    
    resetBind({
      boundDeviceId: user.boundDeviceId || '',
      deviceNickname: nickname,
      deviceOwnerAge: age,
      deviceOwnerGender: gender,
    });
  };

  const handleUnbindDevice = async (user: MapAppUser) => {
    if (!confirm(`確定要解綁「${user.name}」的設備嗎？`)) return;
    
    try {
      await mapAppUserService.unbindDevice(user.id);
      alert('設備解綁成功');
    } catch (error: any) {
      alert(error.response?.data?.message || '解綁失敗');
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const submitData = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
      };

      if (editingUser) {
        await mapAppUserService.update(editingUser.id, submitData);
        alert('更新成功');
      } else {
        await mapAppUserService.create(submitData);
        alert('創建成功');
      }
      setShowModal(false);
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失敗');
    }
  };

  const onBindSubmit = async (data: any) => {
    if (!bindingUser) return;

    try {
      await mapAppUserService.bindDevice(
        bindingUser.id,
        data.boundDeviceId,
        data.deviceNickname || undefined,
        data.deviceOwnerAge ? parseInt(data.deviceOwnerAge) : undefined,
        data.deviceOwnerGender || undefined
      );
      alert('設備綁定成功');
      setBindingUser(null);
    } catch (error: any) {
      alert(error.response?.data?.message || '綁定失敗');
    }
  };

  // 獲取設備資訊（包含 nickname 和 age）
  const getDeviceInfo = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">地圖 App 用戶</h1>
          <p className="text-gray-600 mt-1">管理所有地圖 App 用戶及其設備綁定</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>新增用戶</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                {users.filter(u => u.isActive).length}
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
                {users.filter(u => u.boundDeviceId).length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <LinkIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">開啟通知</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.notificationEnabled).length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Bell className="w-6 h-6 text-yellow-600" />
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
                聯絡方式
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                綁定設備
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                狀態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                建立時間
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const boundDevice = user.boundDeviceId ? getDeviceInfo(user.boundDeviceId) : null;
              
              return (
                <tr 
                  key={user.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => {
                    // 如果點擊的是操作按鈕，不導航
                    const target = e.target as HTMLElement;
                    if (target.closest('button')) {
                      return;
                    }
                    navigate(`/map-app-users/${user.id}`);
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        {boundDevice?.nickname && (
                          <div className="text-xs text-gray-500">
                            暱稱: {boundDevice.nickname}
                            {boundDevice.age && ` (${boundDevice.age}歲)`}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {user.email && (
                        <div className="text-gray-900">{user.email}</div>
                      )}
                      {user.phone && (
                        <div className="text-gray-500">{user.phone}</div>
                      )}
                      {!user.email && !user.phone && (
                        <span className="text-gray-400">未設定</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {boundDevice ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 flex items-center space-x-1">
                          <LinkIcon className="w-4 h-4 text-green-600" />
                          <span>{boundDevice.deviceName || '未命名'}</span>
                        </div>
                        <div className="text-gray-500 text-xs font-mono">
                          {boundDevice.uuid.substring(0, 8)}...
                        </div>
                        <div className="text-gray-500 text-xs">
                          M: {boundDevice.major} / m: {boundDevice.minor}
                        </div>
                        {boundDevice?.boundAt && (
                          <div className="text-gray-400 text-xs">
                            {new Date(boundDevice.boundAt).toLocaleDateString('zh-TW')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">未綁定</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
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
                      {user.notificationEnabled ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 inline-flex items-center">
                          <Bell className="w-3 h-3 mr-1" />
                          通知開啟
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 inline-flex items-center">
                          <BellOff className="w-3 h-3 mr-1" />
                          通知關閉
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleString('zh-TW')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
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
                        onClick={() => handleToggleNotification(user)}
                        className={`${
                          user.notificationEnabled 
                            ? 'text-blue-600 hover:text-blue-900' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title={user.notificationEnabled ? '關閉通知' : '開啟通知'}
                      >
                        {user.notificationEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`${
                          user.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                        }`}
                        title={user.isActive ? '停用' : '啟用'}
                      >
                        {user.isActive ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-indigo-600 hover:text-indigo-900"
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
          顯示 {(page - 1) * 10 + 1} 到 {Math.min(page * 10, total)} 筆，共 {total} 筆地圖 App 用戶
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
          title={editingUser ? '編輯用戶' : '新增用戶'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">姓名 *</label>
              <input
                {...register('name', { required: '請輸入姓名' })}
                className="input"
                placeholder="請輸入姓名"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>
              )}
            </div>

            <div>
              <label className="label">Email</label>
              <input
                {...register('email')}
                type="email"
                className="input"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="label">電話</label>
              <input
                {...register('phone')}
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
                {editingUser ? '更新' : '創建'}
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
                {...registerBind('boundDeviceId', { required: '請選擇設備' })}
                className="input"
              >
                <option value="">請選擇設備</option>
                {devices
                  .filter(d => d.bindingType === 'UNBOUND' || (d.bindingType === 'MAP_USER' && d.boundTo === bindingUser?.id))
                  .map(device => (
                    <option key={device.id} value={device.id}>
                      {device.deviceName || '未命名'} - UUID: {device.uuid.substring(0, 8)}... (M:{device.major}/m:{device.minor})
                    </option>
                  ))}
              </select>
              {bindErrors.boundDeviceId && (
                <p className="text-red-500 text-sm mt-1">{bindErrors.boundDeviceId.message as string}</p>
              )}
            </div>

            <div>
              <label className="label">設備暱稱</label>
              <input
                {...registerBind('deviceNickname')}
                className="input"
                placeholder="例如：爸爸的卡片、媽媽的手錶"
              />
              <p className="text-xs text-gray-500 mt-1">為設備取一個容易識別的名稱</p>
            </div>

            <div>
              <label className="label">使用者年齡</label>
              <input
                {...registerBind('deviceOwnerAge')}
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
              <select
                {...registerBind('deviceOwnerGender')}
                className="input"
              >
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
