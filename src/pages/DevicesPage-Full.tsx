import { useEffect, useState } from 'react';
import { Plus, Search, Battery, Signal, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { deviceService } from '../services/deviceService';
import { elderService } from '../services/elderService';
import type { Device, Elder } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const DevicesPage = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [elders, setElders] = useState<Elder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deletingDevice, setDeletingDevice] = useState<Device | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadDevices();
    loadElders();
  }, [page]);

  const loadDevices = async () => {
    try {
      const response: any = await deviceService.getAll(page, 10);
      setDevices(response.data.data);
      setTotal(response.data.meta.total);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadElders = async () => {
    try {
      const response: any = await elderService.getAll(1, 100);
      setElders(response.data.data);
    } catch (error) {
      console.error('Failed to load elders:', error);
    }
  };

  const handleCreate = () => {
    setEditingDevice(null);
    reset({});
    setShowModal(true);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    reset(device);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingDevice) return;
    
    try {
      await deviceService.delete(deletingDevice.id);
      alert('刪除成功');
      loadDevices();
    } catch (error: any) {
      alert(error.response?.data?.message || '刪除失敗');
    }
  };

  const onSubmit = async (data: any) => {
    try {
      if (editingDevice) {
        await deviceService.update(editingDevice.id, data);
        alert('更新成功');
      } else {
        await deviceService.create(data);
        alert('新增成功');
      }
      setShowModal(false);
      loadDevices();
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失敗');
    }
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'text-gray-400';
    if (level > 60) return 'text-green-500';
    if (level > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getDeviceTypeBadge = (type: string) => {
    const styles = {
      IBEACON: 'bg-blue-100 text-blue-800',
      EDDYSTONE: 'bg-purple-100 text-purple-800',
      GENERIC_BLE: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type as keyof typeof styles] || styles.GENERIC_BLE}`}>
        {type}
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
          <h1 className="text-3xl font-bold text-gray-900">設備管理</h1>
          <p className="text-gray-600 mt-1">管理所有 Beacon 設備</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>新增設備</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋 MAC Address..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Devices List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">MAC Address</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">設備名稱</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">長者</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">類型</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">電量</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">最後出現</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {device.macAddress}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">{device.deviceName || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{device.elder?.name || '-'}</td>
                  <td className="py-3 px-4">{getDeviceTypeBadge(device.type)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Battery className={`w-4 h-4 ${getBatteryColor(device.batteryLevel)}`} />
                      <span className="text-sm">{device.batteryLevel ? `${device.batteryLevel}%` : '-'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {device.lastSeen ? (
                      <div className="flex items-center space-x-1">
                        <Signal className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true, locale: zhTW })}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleEdit(device)} className="text-primary-600 hover:text-primary-700 text-sm font-medium mr-3">
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => setDeletingDevice(device)} className="text-red-600 hover:text-red-700 text-sm font-medium">
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
          <p className="text-gray-600">總共 {total} 個設備</p>
          <div className="flex space-x-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50">上一頁</button>
            <span className="px-3 py-1">第 {page} 頁</span>
            <button onClick={() => setPage(page + 1)} disabled={page * 10 >= total} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50">下一頁</button>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDevice ? '編輯設備' : '新增設備'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">長者 *</label>
              <select {...register('elderId', { required: true })} className="input">
                <option value="">請選擇長者</option>
                {elders.map((elder) => (
                  <option key={elder.id} value={elder.id}>{elder.name}</option>
                ))}
              </select>
              {errors.elderId && <p className="text-sm text-red-600 mt-1">請選擇長者</p>}
            </div>

            <div className="col-span-2">
              <label className="label">MAC Address *</label>
              <input {...register('macAddress', { required: true })} className="input" placeholder="AA:BB:CC:DD:EE:FF" />
              {errors.macAddress && <p className="text-sm text-red-600 mt-1">請輸入 MAC Address</p>}
            </div>

            <div className="col-span-2">
              <label className="label">UUID (iBeacon)</label>
              <input {...register('uuid')} className="input" placeholder="FDA50693-A4E2-4FB1-AFCF-C6EB07647825" />
            </div>

            <div>
              <label className="label">Major</label>
              <input type="number" {...register('major')} className="input" placeholder="100" />
            </div>

            <div>
              <label className="label">Minor</label>
              <input type="number" {...register('minor')} className="input" placeholder="1" />
            </div>

            <div>
              <label className="label">設備名稱</label>
              <input {...register('deviceName')} className="input" placeholder="陳阿公的手環" />
            </div>

            <div>
              <label className="label">設備類型</label>
              <select {...register('type')} className="input">
                <option value="IBEACON">iBeacon</option>
                <option value="EDDYSTONE">Eddystone</option>
                <option value="GENERIC_BLE">一般 BLE</option>
              </select>
            </div>

            <div>
              <label className="label">電量 (%)</label>
              <input type="number" {...register('batteryLevel')} className="input" min="0" max="100" placeholder="100" />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
            <button type="submit" className="btn-primary">{editingDevice ? '更新' : '新增'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingDevice}
        onClose={() => setDeletingDevice(null)}
        onConfirm={handleDelete}
        title="確認刪除"
        message={`確定要刪除設備「${deletingDevice?.macAddress}」嗎？此操作無法復原。`}
        confirmText="刪除"
        type="danger"
      />
    </div>
  );
};
