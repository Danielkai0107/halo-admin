import { Modal } from '../../components/Modal';
import { Battery, Signal, Link as LinkIcon, Calendar, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { Device } from '../../types';

interface DeviceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}

export const DeviceDetailModal = ({ isOpen, onClose, device }: DeviceDetailModalProps) => {
  if (!device) return null;

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="設備詳情" size="lg">
      <div className="p-6 space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-semibold mb-4">基本資訊</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">設備名稱</label>
              <p className="text-gray-900 font-medium">
                {device.deviceName || '未命名'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">綁定狀態</label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getBindingTypeColor(device.bindingType)}`}>
                  {getBindingTypeLabel(device.bindingType)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Info */}
        <div>
          <h3 className="text-lg font-semibold mb-4">技術資訊</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm text-gray-500">UUID</label>
              <p className="text-gray-900 font-mono text-sm">{device.uuid}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Major</label>
              <p className="text-gray-900 font-mono">{device.major}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Minor</label>
              <p className="text-gray-900 font-mono">{device.minor}</p>
            </div>
            {device.macAddress && (
              <div className="col-span-2">
                <label className="text-sm text-gray-500">MAC Address</label>
                <p className="text-gray-900 font-mono text-sm">{device.macAddress}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-500">設備類型</label>
              <p className="text-gray-900">{device.type}</p>
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div>
          <h3 className="text-lg font-semibold mb-4">狀態資訊</h3>
          <div className="grid grid-cols-2 gap-4">
            {device.batteryLevel !== undefined && (
              <div>
                <label className="text-sm text-gray-500">電池電量</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Battery className={`w-5 h-5 ${getBatteryColor(device.batteryLevel)}`} />
                  <span className="text-gray-900 font-medium">{device.batteryLevel}%</span>
                </div>
              </div>
            )}
            {device.lastRssi !== undefined && (
              <div>
                <label className="text-sm text-gray-500">信號強度</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Signal className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 font-medium">{device.lastRssi} dBm</span>
                </div>
              </div>
            )}
            {device.lastSeen && (
              <div className="col-span-2">
                <label className="text-sm text-gray-500">最後上線</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {formatDistanceToNow(new Date(device.lastSeen), {
                      addSuffix: true,
                      locale: zhTW,
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Binding Info */}
        {device.boundTo && device.elder && (
          <div>
            <h3 className="text-lg font-semibold mb-4">綁定資訊</h3>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <LinkIcon className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">綁定到長者</p>
                  <p className="font-medium text-gray-900">{device.elder.name}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {device.tags && device.tags.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">標籤</h3>
            <div className="flex flex-wrap gap-2">
              {device.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 text-sm"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <button onClick={onClose} className="btn btn-primary">
            關閉
          </button>
        </div>
      </div>
    </Modal>
  );
};
