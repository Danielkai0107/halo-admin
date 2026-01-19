import { useEffect, useState } from 'react';
import { Plus, Search, MapPin, Wifi, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { gatewayService } from '../services/gatewayService';
import { tenantService } from '../services/tenantService';
import type { Gateway, GatewayType, Tenant } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const GatewaysPage = () => {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState<GatewayType | ''>('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState<Gateway | null>(null);
  const [deletingGateway, setDeletingGateway] = useState<Gateway | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const selectedType = watch('type');

  useEffect(() => {
    loadGateways();
    loadTenants();
  }, [page, filterType]);

  const loadGateways = async () => {
    try {
      const response: any = await gatewayService.getAll(page, 10, undefined, filterType || undefined);
      setGateways(response.data.data);
      setTotal(response.data.meta.total);
    } catch (error) {
      console.error('Failed to load gateways:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const response: any = await tenantService.getAll(1, 100);
      setTenants(response.data.data);
    } catch (error) {
      console.error('Failed to load tenants:', error);
    }
  };

  const handleCreate = () => {
    setEditingGateway(null);
    reset({ type: 'GENERAL', isActive: true });
    setShowModal(true);
  };

  const handleEdit = (gateway: Gateway) => {
    setEditingGateway(gateway);
    reset(gateway);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingGateway) return;
    
    try {
      await gatewayService.delete(deletingGateway.id);
      alert('刪除成功');
      loadGateways();
    } catch (error: any) {
      alert(error.response?.data?.message || '刪除失敗');
    }
  };

  const onSubmit = async (data: any) => {
    try {
      // 如果是移動式，清除 GPS 座標
      if (data.type === 'MOBILE') {
        delete data.latitude;
        delete data.longitude;
      }
      
      if (editingGateway) {
        await gatewayService.update(editingGateway.id, data);
        alert('更新成功');
      } else {
        await gatewayService.create(data);
        alert('新增成功');
      }
      setShowModal(false);
      loadGateways();
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失敗');
    }
  };

  const getTypeBadge = (type: GatewayType) => {
    const config = {
      GENERAL: { bg: 'bg-blue-100', text: 'text-blue-800', label: '一般接收點' },
      BOUNDARY: { bg: 'bg-red-100', text: 'text-red-800', label: '邊界點' },
      MOBILE: { bg: 'bg-green-100', text: 'text-green-800', label: '移動接收點' },
    };

    const { bg, text, label } = config[type];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
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
          <h1 className="text-3xl font-bold text-gray-900">接收點管理</h1>
          <p className="text-gray-600 mt-1">管理所有訊號接收點</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>新增接收點</span>
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="搜尋序列號或名稱..." className="input pl-10" />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as GatewayType | '')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">全部</option>
          <option value="GENERAL">一般接收點</option>
          <option value="BOUNDARY">邊界點</option>
          <option value="MOBILE">移動接收點</option>
        </select>
      </div>

      {/* Gateways List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">序列號</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">名稱</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">類型</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">位置</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">GPS 座標</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">狀態</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {gateways.map((gateway) => (
                <tr key={gateway.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Wifi className="w-4 h-4 text-primary-500" />
                      <code className="text-sm font-mono">{gateway.serialNumber}</code>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">{gateway.name}</td>
                  <td className="py-3 px-4">{getTypeBadge(gateway.type)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{gateway.location || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {gateway.latitude && gateway.longitude ? (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="font-mono text-xs">
                          {gateway.latitude.toFixed(4)}, {gateway.longitude.toFixed(4)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">移動式</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gateway.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {gateway.isActive ? '運作中' : '已停用'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleEdit(gateway)} className="text-primary-600 hover:text-primary-700 text-sm font-medium mr-3">
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => setDeletingGateway(gateway)} className="text-red-600 hover:text-red-700 text-sm font-medium">
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-gray-600">總共 {total} 個接收點</p>
          <div className="flex space-x-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50">上一頁</button>
            <span className="px-3 py-1">第 {page} 頁</span>
            <button onClick={() => setPage(page + 1)} disabled={page * 10 >= total} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50">下一頁</button>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingGateway ? '編輯接收點' : '新增接收點'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">所屬社區 *</label>
              <select {...register('tenantId', { required: true })} className="input">
                <option value="">請選擇社區</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                ))}
              </select>
              {errors.tenantId && <p className="text-sm text-red-600 mt-1">請選擇社區</p>}
            </div>

            <div>
              <label className="label">序列號 *</label>
              <input
                {...register('serialNumber', { required: true })}
                className="input"
                placeholder="GW-DALOVE-001 或 MOBILE-IPHONE-A3K9F2"
                disabled={!!editingGateway}
              />
              {errors.serialNumber && <p className="text-sm text-red-600 mt-1">請輸入序列號</p>}
              {editingGateway && <p className="text-xs text-gray-500 mt-1">序列號不可修改</p>}
            </div>

            <div>
              <label className="label">名稱 *</label>
              <input
                {...register('name', { required: true })}
                className="input"
                placeholder="社區大門"
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">請輸入名稱</p>}
            </div>

            <div className="col-span-2">
              <label className="label">位置描述</label>
              <input
                {...register('location')}
                className="input"
                placeholder="社區正門入口"
              />
            </div>

            <div className="col-span-2">
              <label className="label">接收點類型 *</label>
              <select {...register('type', { required: true })} className="input">
                <option value="GENERAL">一般接收點（記錄活動）</option>
                <option value="BOUNDARY">邊界點（觸發警報）</option>
                <option value="MOBILE">移動接收點（志工手機）</option>
              </select>
            </div>

            {selectedType !== 'MOBILE' && (
              <>
                <div>
                  <label className="label">緯度（固定式接收點）</label>
                  <input
                    type="number"
                    step="any"
                    {...register('latitude')}
                    className="input"
                    placeholder="25.033"
                  />
                  <p className="text-xs text-gray-500 mt-1">移動式接收點不需要</p>
                </div>

                <div>
                  <label className="label">經度（固定式接收點）</label>
                  <input
                    type="number"
                    step="any"
                    {...register('longitude')}
                    className="input"
                    placeholder="121.5654"
                  />
                </div>
              </>
            )}

            {selectedType === 'MOBILE' && (
              <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  💡 <strong>移動接收點說明：</strong>志工手機作為接收點時，GPS 座標會隨著志工移動自動記錄，無需手動設定。
                </p>
              </div>
            )}

            <div className="col-span-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" {...register('isActive')} className="rounded" defaultChecked />
                <span className="text-sm font-medium text-gray-700">啟用此接收點</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
            <button type="submit" className="btn-primary">{editingGateway ? '更新' : '新增'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingGateway}
        onClose={() => setDeletingGateway(null)}
        onConfirm={handleDelete}
        title="確認刪除"
        message={`確定要刪除接收點「${deletingGateway?.name}」嗎？此操作會刪除相關的訊號記錄，無法復原！`}
        confirmText="刪除"
        type="danger"
      />

      {/* Type Legend */}
      <div className="mt-4 card">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">接收點類型說明</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              一般接收點
            </span>
            <span className="text-gray-600">- 用於記錄長者活動，不觸發警報</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              邊界點
            </span>
            <span className="text-gray-600">- 偵測到時自動觸發警報（如社區大門）</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              移動接收點
            </span>
            <span className="text-gray-600">- 志工手機，可隨時移動</span>
          </div>
        </div>
      </div>
    </div>
  );
};
