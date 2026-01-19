import { useEffect, useState } from 'react';
import { Plus, Search, Battery, Signal } from 'lucide-react';
import { deviceService } from '../services/deviceService';
import type { Device } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export const DevicesPage = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadDevices();
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
        <button className="btn-primary flex items-center space-x-2">
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
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  MAC Address
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  設備名稱
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  長者
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  類型
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  電量
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  最後出現
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
              {devices.map((device) => (
                <tr key={device.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {device.macAddress}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">
                    {device.deviceName || '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {device.elder?.name || '-'}
                  </td>
                  <td className="py-3 px-4">
                    {getDeviceTypeBadge(device.type)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Battery className={`w-4 h-4 ${getBatteryColor(device.batteryLevel)}`} />
                      <span className="text-sm text-gray-900">
                        {device.batteryLevel ? `${device.batteryLevel}%` : '-'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {device.lastSeen ? (
                      <div className="flex items-center space-x-1">
                        <Signal className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(device.lastSeen), {
                            addSuffix: true,
                            locale: zhTW,
                          })}
                        </span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        device.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {device.isActive ? '啟用' : '停用'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium mr-3">
                      編輯
                    </button>
                    <button className="text-red-600 hover:text-red-700 text-sm font-medium">
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
          <p className="text-gray-600">總共 {total} 個設備</p>
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

      {/* Legend */}
      <div className="mt-4 card">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">電量圖示說明</h3>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <Battery className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">&gt; 60%：正常</span>
          </div>
          <div className="flex items-center space-x-2">
            <Battery className="w-4 h-4 text-yellow-500" />
            <span className="text-gray-600">20-60%：注意</span>
          </div>
          <div className="flex items-center space-x-2">
            <Battery className="w-4 h-4 text-red-500" />
            <span className="text-gray-600">&lt; 20%：低電量</span>
          </div>
        </div>
      </div>
    </div>
  );
};
