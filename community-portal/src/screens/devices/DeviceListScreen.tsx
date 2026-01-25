import { useState, useEffect } from 'react';
import { Smartphone, Battery, Signal, Search, Eye } from 'lucide-react';
import { deviceService } from '../../services/deviceService';
import { useAuth } from '../../hooks/useAuth';
import { DeviceDetailModal } from './DeviceDetailModal';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { Device } from '../../types';

export const DeviceListScreen = () => {
  const { tenantId } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bound' | 'unbound'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    const unsubscribe = deviceService.subscribe(tenantId, (data) => {
      setDevices(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  const getBindingTypeLabel = (type: string) => {
    const labels = {
      ELDER: '已綁定（長者）',
      MAP_USER: '已綁定（地圖用戶）',
      UNBOUND: '未綁定',
      ANONYMOUS: '匿名',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getBindingTypeColor = (type: string) => {
    const colors = {
      ELDER: 'bg-green-100 text-green-800',
      MAP_USER: 'bg-blue-100 text-blue-800',
      UNBOUND: 'bg-gray-100 text-gray-800',
      ANONYMOUS: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'text-gray-400';
    if (level > 60) return 'text-green-500';
    if (level > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const handleViewDetail = (device: Device, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedDevice(device);
    setShowDetailModal(true);
  };

  // 篩選和搜尋
  const filteredDevices = devices
    .filter(device => {
      if (filter === 'bound') return device.bindingType === 'ELDER' || device.bindingType === 'MAP_USER';
      if (filter === 'unbound') return device.bindingType === 'UNBOUND';
      return true;
    })
    .filter(device => {
      if (!searchTerm) return true;
      
      const search = searchTerm.toLowerCase();
      return (
        device.deviceName?.toLowerCase().includes(search) ||
        device.uuid?.toLowerCase().includes(search) ||
        device.macAddress?.toLowerCase().includes(search) ||
        device.major?.toString().includes(search) ||
        device.minor?.toString().includes(search)
      );
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">設備清單</h2>
          <p className="text-sm text-gray-600 mt-1">總共 {devices.length} 個設備</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          此頁面僅供查看設備狀態，如需管理設備，請聯絡系統管理員。
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋設備名稱、UUID、MAC、Major/Minor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部 ({devices.length})
          </button>
          <button
            onClick={() => setFilter('bound')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'bound'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            已綁定 ({devices.filter(d => d.bindingType === 'ELDER' || d.bindingType === 'MAP_USER').length})
          </button>
          <button
            onClick={() => setFilter('unbound')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unbound'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            未綁定 ({devices.filter(d => d.bindingType === 'UNBOUND').length})
          </button>
        </div>
      </div>

      {/* Devices Table */}
      <div className="card">
        {filteredDevices.length === 0 ? (
          <div className="text-center py-12">
            <Smartphone className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500">
              {searchTerm ? '找不到符合的設備' : filter === 'all' ? '暫無設備' : `暫無${filter === 'bound' ? '已綁定' : '未綁定'}的設備`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    設備
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    UUID / Major / Minor
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    綁定狀態
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    電池
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    信號
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    最後上線
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => (
                  <tr
                    key={device.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewDetail(device)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary-50 rounded-lg">
                          <Smartphone className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {device.deviceName || `設備 ${device.minor}`}
                          </div>
                          {device.elder && (
                            <div className="text-xs text-gray-500">
                              綁定：{device.elder.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-mono text-gray-600">
                        <div>{device.uuid.substring(0, 13)}...</div>
                        <div className="text-gray-500">{device.major} / {device.minor}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getBindingTypeColor(device.bindingType)}`}>
                        {getBindingTypeLabel(device.bindingType)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {device.batteryLevel !== undefined ? (
                        <div className="flex items-center space-x-1">
                          <Battery className={`w-4 h-4 ${getBatteryColor(device.batteryLevel)}`} />
                          <span className="text-sm text-gray-900">{device.batteryLevel}%</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {device.lastRssi !== undefined ? (
                        <div className="flex items-center space-x-1">
                          <Signal className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{device.lastRssi}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {device.lastSeen ? (
                        formatDistanceToNow(new Date(device.lastSeen), {
                          addSuffix: true,
                          locale: zhTW,
                        })
                      ) : (
                        <span className="text-gray-400">無記錄</span>
                      )}
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleViewDetail(device, e)}
                        className="text-primary-600 hover:text-primary-700"
                        title="查看詳情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Device Detail Modal */}
      <DeviceDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        device={selectedDevice}
      />
    </div>
  );
};
