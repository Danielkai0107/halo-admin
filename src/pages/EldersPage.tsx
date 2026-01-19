import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, MapPin, Edit, Trash2, User, Calendar, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { elderService } from '../services/elderService';
import { tenantService } from '../services/tenantService';
import { deviceService } from '../services/deviceService';
import type { Elder, Tenant, Device } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface ElderFormData extends Partial<Elder> {
  deviceId?: string;
}

export const EldersPage = () => {
  const navigate = useNavigate();
  const [elders, setElders] = useState<Elder[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingElder, setEditingElder] = useState<Elder | null>(null);
  const [deletingElder, setDeletingElder] = useState<Elder | null>(null);
  
  // 批次選擇相關
  const [selectedElders, setSelectedElders] = useState<string[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ElderFormData>();
  const watchTenantId = watch('tenantId');

  // 計算合併後的長者資料
  const enrichedElders = useMemo(() => {
    return elders.map(elder => {
      const device = devices.find(d => d.elderId === elder.id);
      const tenant = tenants.find(t => t.id === elder.tenantId);
      return {
        ...elder,
        device,
        tenant
      };
    });
  }, [elders, devices, tenants]);

  useEffect(() => {
    setLoading(true);
    
    // 同時訂閱長者和設備（雙向即時監聽）
    const unsubscribeElders = elderService.subscribe((eldersData) => {
      setElders(eldersData);
      setTotal(eldersData.length);
      setLoading(false);
    });
    
    // 訂閱設備列表（即時監聽）
    const unsubscribeDevices = deviceService.subscribe((devicesData) => {
      setDevices(devicesData);
    });

    loadTenants();

    // 清理訂閱
    return () => {
      unsubscribeElders();
      unsubscribeDevices();
    };
  }, []);

  const loadTenants = async () => {
    try {
      const response: any = await tenantService.getAll(1, 100);
      setTenants(response.data.data);
    } catch (error) {
      console.error('Failed to load tenants:', error);
    }
  };

  const loadAvailableDevicesForTenant = async (tenantId: string, currentElder?: Elder) => {
    try {
      // 載入該社區未綁定長輩的設備
      const response: any = await elderService.getAvailableDevices(tenantId);
      let devicesData = response.data || [];
      
      // 如果有當前長者且其有綁定設備，需要把該設備也加入選單
      const elderToUse = currentElder || editingElder;
      if (elderToUse && elderToUse.device && elderToUse.device.id) {
        const currentDevice = elderToUse.device;
        // 檢查當前設備是否已在列表中
        const deviceExists = devicesData.some((d: any) => d.id === currentDevice.id);
        if (!deviceExists) {
          // 如果不在列表中（因為已綁定），手動加入
          devicesData = [currentDevice, ...devicesData];
        }
      }
      
      setAvailableDevices(devicesData);

      // 如果正在編輯且有綁定設備，確保表單值被正確設定
      if (elderToUse?.device?.id) {
        setValue('deviceId', elderToUse.device.id);
      }
    } catch (error) {
      console.error('Failed to load available devices:', error);
      setAvailableDevices([]);
    }
  };

  // 當選擇的社區改變時，載入該社區的可用設備
  useEffect(() => {
    if (watchTenantId) {
      loadAvailableDevicesForTenant(watchTenantId);
    } else {
      setAvailableDevices([]);
    }
  }, [watchTenantId]);

  const loadElders = () => {
    // 即時監聽會自動更新
  };

  const handleCreate = () => {
    setEditingElder(null);
    reset({});
    setShowModal(true);
  };

  const handleEdit = (elder: Elder) => {
    setEditingElder(elder);
    
    // 先載入該社區的設備，確保當前綁定的設備在選單中
    if (elder.tenantId) {
      loadAvailableDevicesForTenant(elder.tenantId, elder);
    }

    // Only reset with editable fields, exclude relations
    reset({
      tenantId: elder.tenantId,
      name: elder.name,
      gender: elder.gender || undefined,
      birthDate: elder.birthDate || '',
      age: elder.age || undefined,
      phone: elder.phone || '',
      address: elder.address || '',
      emergencyContact: elder.emergencyContact || '',
      emergencyPhone: elder.emergencyPhone || '',
      photo: elder.photo || '',
      status: elder.status,
      inactiveThresholdHours: elder.inactiveThresholdHours || 24,
      deviceId: elder.deviceId || '', // 使用長者本身的 deviceId
      notes: elder.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingElder) return;
    
    try {
      // 如果長者有綁定設備，先解除綁定
      if (deletingElder.device?.id) {
        const deviceServiceModule = await import('../services/deviceService');
        await deviceServiceModule.deviceService.assignToElder(deletingElder.device.id, null);
      }
      
      await elderService.delete(deletingElder.id);
      alert('刪除成功');
      setDeletingElder(null);
      loadElders();
    } catch (error: any) {
      alert(error.response?.data?.message || '刪除失敗');
    }
  };

  // 批次選擇相關函數
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedElders(elders.map(e => e.id));
    } else {
      setSelectedElders([]);
    }
  };

  const handleSelectElder = (elderId: string, checked: boolean) => {
    if (checked) {
      setSelectedElders(prev => [...prev, elderId]);
    } else {
      setSelectedElders(prev => prev.filter(id => id !== elderId));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedElders.length === 0) {
      alert('請至少選擇一位長者');
      return;
    }

    if (!confirm(`確定要刪除選中的 ${selectedElders.length} 位長者嗎？此操作無法復原。`)) {
      return;
    }

    try {
      const deviceServiceModule = await import('../services/deviceService');
      
      // 找出要刪除的長者及其綁定的設備
      const eldersToDelete = elders.filter(e => selectedElders.includes(e.id));
      
      // 先解除所有設備綁定
      await Promise.all(
        eldersToDelete
          .filter(e => e.device?.id)
          .map(e => deviceServiceModule.deviceService.assignToElder(e.device!.id, null))
      );
      
      // 再刪除長者
      await Promise.all(selectedElders.map(id => elderService.delete(id)));
      
      alert(`成功刪除 ${selectedElders.length} 位長者，並解除 ${eldersToDelete.filter(e => e.device).length} 個設備綁定`);
      setSelectedElders([]);
      loadElders();
    } catch (error: any) {
      alert(error.response?.data?.message || '批次刪除失敗');
    }
  };

  const onSubmit = async (data: ElderFormData) => {
    try {
      const { deviceId, ...elderData } = data;
      const deviceServiceModule = await import('../services/deviceService');
      
      // 如果選擇了設備，先檢查該設備是否已被其他長者綁定
      if (deviceId) {
        const deviceResponse: any = await deviceServiceModule.deviceService.getOne(deviceId);
        const device = deviceResponse.data;
        
        // 檢查設備是否已被其他長者綁定
        if (device.elderId && device.elderId !== (editingElder?.id)) {
          alert(`此設備已被其他長者綁定，請先解除該綁定或選擇其他設備`);
          return;
        }
      }
      
      if (editingElder) {
        // 更新長者資料
        await elderService.update(editingElder.id, elderData as any);
        
        // 處理設備綁定的變更
        const oldDeviceId = editingElder.device?.id;
        
        if (oldDeviceId !== deviceId) {
          // 如果設備有變更（包括解綁或是換新設備）
          if (deviceId) {
            // 綁定新設備 (內部會自動處理舊設備的解綁)
            await deviceServiceModule.deviceService.assignToElder(deviceId, editingElder.id);
          } else if (oldDeviceId) {
            // 純粹解綁
            await deviceServiceModule.deviceService.assignToElder(oldDeviceId, null);
          }
        }
        
        alert('更新成功');
      } else {
        // 新增長者
        const response: any = await elderService.create(elderData as any);
        const newElderId = response.data.id;
        
        // 如果選擇了設備，綁定設備
        if (deviceId && newElderId) {
          await deviceServiceModule.deviceService.assignToElder(deviceId, newElderId);
        }
        
        alert('新增成功');
      }
      
      setShowModal(false);
      loadElders();
    } catch (error: any) {
      console.error('操作失敗:', error);
      alert(error.response?.data?.message || error.message || '操作失敗');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      HOSPITALIZED: 'bg-yellow-100 text-yellow-800',
      DECEASED: 'bg-red-100 text-red-800',
      MOVED_OUT: 'bg-blue-100 text-blue-800',
    };
    
    const labels = {
      ACTIVE: '正常',
      INACTIVE: '不活躍',
      HOSPITALIZED: '住院',
      DECEASED: '已故',
      MOVED_OUT: '遷出',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-12">載入中...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">長者管理</h1>
          <p className="text-sm text-blue-600 mt-1">
            💡 可以在新增/編輯長者時選擇未分配的設備進行關聯
          </p>
          <p className="text-gray-600 mt-1">管理所有長者資料</p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedElders.length > 0 && (
            <button 
              onClick={handleBatchDelete} 
              className="btn-secondary flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-5 h-5" />
              <span>刪除選中項 ({selectedElders.length})</span>
            </button>
          )}
          <button onClick={handleCreate} className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>新增長者</span>
          </button>
        </div>
      </div>

      {/* Search and Batch Select */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋長者..."
            className="input pl-10"
          />
        </div>
        <label className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-gray-300"
            checked={selectedElders.length === elders.length && elders.length > 0}
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
          <span className="text-sm font-medium text-gray-700">全選</span>
        </label>
      </div>

      {/* Elders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrichedElders.map((elder) => (
          <div key={elder.id} className="card hover:shadow-md transition-shadow relative">
            <div className="absolute top-4 left-4">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={selectedElders.includes(elder.id)}
                onChange={(e) => handleSelectElder(elder.id, e.target.checked)}
              />
            </div>
            <div className="flex items-start space-x-3 mb-4 ml-8">
              {/* 頭像 */}
              <div className="flex-shrink-0">
                {elder.photo ? (
                  <img 
                    src={elder.photo} 
                    alt={elder.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{elder.name}</h3>
                    <p className="text-sm text-gray-500">{elder.tenant?.name}</p>
                    {/* 性別和年齡 */}
                    <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600">
                      {elder.gender && (
                        <span>
                          {elder.gender === 'MALE' ? '男' : elder.gender === 'FEMALE' ? '女' : '其他'}
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
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(elder.status)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {elder.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{elder.phone}</span>
                </div>
              )}
              {elder.address && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{elder.address}</span>
                </div>
              )}
            </div>

            {elder.device ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-blue-700">📱 已綁定設備</p>
                  {elder.device.isActive ? (
                    <span className="text-xs text-green-600">● 啟用中</span>
                  ) : (
                    <span className="text-xs text-red-600">● 已停用</span>
                  )}
                </div>
                {elder.device.deviceName && (
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {elder.device.deviceName}
                  </p>
                )}
                <p className="text-xs font-mono text-gray-600 mb-1">
                  MAC: {elder.device.macAddress}
                </p>
                {(elder.device.major !== undefined && elder.device.minor !== undefined) && (
                  <p className="text-xs text-gray-600 mb-1">
                    Beacon: {elder.device.major}_{elder.device.minor}
                  </p>
                )}
                {elder.device.batteryLevel !== undefined && (
                  <p className="text-xs text-gray-600">
                    電量: {elder.device.batteryLevel}%
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <p className="text-xs text-yellow-700">
                  ⚠️ 尚未綁定設備
                </p>
              </div>
            )}

            {elder.lastActivityAt && (
              <p className="text-xs text-gray-500 mb-3">
                最後活動: {formatDistanceToNow(new Date(elder.lastActivityAt), {
                  addSuffix: true,
                  locale: zhTW,
                })}
              </p>
            )}

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => navigate(`/elders/${elder.id}`)}
                className="flex items-center justify-center space-x-1 px-2 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">詳情</span>
              </button>
              <button
                onClick={() => handleEdit(elder)}
                className="flex items-center justify-center space-x-1 px-2 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm font-medium">編輯</span>
              </button>
              <button
                onClick={() => setDeletingElder(elder)}
                className="flex items-center justify-center space-x-1 px-2 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">刪除</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">總共 {total} 位長者</p>
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
            disabled={page * 9 >= total}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            下一頁
          </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingElder ? '編輯長者' : '新增長者'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">所屬社區 *</label>
              <select {...register('tenantId', { required: true })} className="input">
                <option value="">請選擇社區</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              {errors.tenantId && <p className="text-sm text-red-600 mt-1">請選擇社區</p>}
            </div>

            <div>
              <label className="label">姓名 *</label>
              <input
                type="text"
                {...register('name', { required: true })}
                className="input"
                placeholder="陳阿公"
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">請輸入姓名</p>}
            </div>

            <div>
              <label className="label">性別</label>
              <select {...register('gender')} className="input">
                <option value="">請選擇</option>
                <option value="MALE">男</option>
                <option value="FEMALE">女</option>
                <option value="OTHER">其他</option>
              </select>
            </div>

            <div>
              <label className="label">出生日期</label>
              <input
                type="date"
                {...register('birthDate')}
                className="input"
              />
            </div>

            <div>
              <label className="label">年齡</label>
              <input
                type="number"
                {...register('age')}
                className="input"
                placeholder="65"
                min="0"
                max="150"
              />
              <p className="text-xs text-gray-500 mt-1">或填寫出生日期，系統會自動計算</p>
            </div>

            <div>
              <label className="label">電話</label>
              <input
                type="tel"
                {...register('phone')}
                className="input"
                placeholder="0912-345-678"
              />
            </div>

            <div className="col-span-2">
              <label className="label">照片網址</label>
              <input
                type="url"
                {...register('photo')}
                className="input"
                placeholder="https://example.com/photo.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">輸入照片的網址（URL）</p>
            </div>

            <div className="col-span-2">
              <label className="label">地址</label>
              <input
                type="text"
                {...register('address')}
                className="input"
                placeholder="社區 A 棟 3 樓"
              />
            </div>

            <div>
              <label className="label">緊急聯絡人</label>
              <input
                type="text"
                {...register('emergencyContact')}
                className="input"
                placeholder="家屬姓名"
              />
            </div>

            <div>
              <label className="label">緊急聯絡電話</label>
              <input
                type="tel"
                {...register('emergencyPhone')}
                className="input"
                placeholder="0912-345-678"
              />
            </div>

            <div>
              <label className="label">狀態</label>
              <select {...register('status')} className="input">
                <option value="ACTIVE">正常</option>
                <option value="INACTIVE">不活躍</option>
                <option value="HOSPITALIZED">住院</option>
                <option value="DECEASED">已故</option>
                <option value="MOVED_OUT">遷出</option>
              </select>
            </div>

            <div>
              <label className="label">不活躍警報閾值（小時）</label>
              <input
                type="number"
                {...register('inactiveThresholdHours')}
                className="input"
                placeholder="24"
                defaultValue={24}
              />
            </div>

            <div className="col-span-2">
              <label className="label">關聯設備（可選）</label>
              <select 
                {...register('deviceId')} 
                className="input"
                disabled={!watchTenantId}
              >
                <option value="">
                  {watchTenantId ? '暫不關聯設備' : '請先選擇社區'}
                </option>
                {availableDevices.map((device) => (
                  <option 
                    key={device.id} 
                    value={device.id}
                  >
                    {device.macAddress} 
                    {device.deviceName ? ` (${device.deviceName})` : ''}
                    {device.batteryLevel ? ` - 電量 ${device.batteryLevel}%` : ''}
                  </option>
                ))}
              </select>
              {!watchTenantId && (
                <p className="text-xs text-yellow-600 mt-1">
                  ⚠️ 請先選擇社區
                </p>
              )}
              {watchTenantId && availableDevices.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ 此社區尚無可用設備，請先在「社區管理」中分配設備給該社區
                </p>
              )}
              {watchTenantId && availableDevices.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  💡 只顯示該社區未綁定的設備（共 {availableDevices.length} 個）
                </p>
              )}
            </div>

            <div className="col-span-2">
              <label className="label">備註</label>
              <textarea
                {...register('notes')}
                className="input"
                rows={3}
                placeholder="特殊注意事項..."
              />
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
              {editingElder ? '更新' : '新增'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingElder}
        onClose={() => setDeletingElder(null)}
        onConfirm={handleDelete}
        title="確認刪除"
        message={`確定要刪除長者「${deletingElder?.name}」嗎？此操作無法復原。`}
        confirmText="刪除"
        type="danger"
      />
    </div>
  );
};
