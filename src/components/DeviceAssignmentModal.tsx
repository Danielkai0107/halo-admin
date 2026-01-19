import { useEffect, useState } from 'react';
import { X, Smartphone } from 'lucide-react';
import { tenantService } from '../services/tenantService';
import { deviceService } from '../services/deviceService';
import { elderService } from '../services/elderService';

interface DeviceAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
  onSuccess: () => void;
}

export const DeviceAssignmentModal = ({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  onSuccess,
}: DeviceAssignmentModalProps) => {
  const [unassignedDevices, setUnassignedDevices] = useState<any[]>([]);
  const [tenantDevices, setTenantDevices] = useState<any[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'assign' | 'manage'>('assign');

  useEffect(() => {
    if (isOpen) {
      loadAllDevices();
    }
  }, [isOpen]);

  const loadAllDevices = async () => {
    setLoading(true);
    try {
      // 同時載入未分配的設備、該社區的設備和該社區的長者
      const [unassignedResponse, tenantDevicesResponse, eldersResponse]: any = await Promise.all([
        deviceService.getAll(1, 100),
        tenantService.getDevices(tenantId),
        elderService.getAll(1, 100, tenantId)
      ]);
      
      // deviceService.getAll 返回 { data: { data: [], ... } } (分頁結構)
      const allDevices = unassignedResponse.data.data || [];
      setUnassignedDevices(allDevices.filter((d: any) => !d.tenantId));
      
      // tenantService.getDevices 返回 { data: [] } (直接數組)
      const devices = tenantDevicesResponse.data || [];
      
      // elderService.getAll 返回 { data: { data: [], ... } } (分頁結構)
      const elders = eldersResponse.data.data || [];
      
      // 為每個設備關聯長者資料
      const devicesWithElders = devices.map((device: any) => {
        if (device.elderId) {
          const elder = elders.find((e: any) => e.id === device.elderId);
          return { ...device, elder };
        }
        return device;
      });
      
      setTenantDevices(devicesWithElders);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = () => {
    // 重新載入所有設備資料
    loadAllDevices();
  };

  const handleToggleDevice = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleAssign = async () => {
    if (selectedDevices.length === 0) {
      alert('請至少選擇一個設備');
      return;
    }

    try {
      await tenantService.assignDevices(tenantId, selectedDevices);
      alert(`成功分配 ${selectedDevices.length} 個設備`);
      setSelectedDevices([]);
      loadDevices();
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.message || '分配失敗');
    }
  };

  const handleRemoveDevice = async (deviceId: string, deviceName: string) => {
    if (!confirm(`確定要將「${deviceName}」從社區移除嗎？`)) return;

    try {
      await tenantService.removeDevice(tenantId, deviceId);
      alert('設備已移除');
      loadDevices();
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.message || '移除失敗');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">設備管理</h2>
            <p className="text-sm text-gray-500 mt-1">{tenantName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setTab('assign')}
              className={`py-4 border-b-2 font-medium text-sm ${
                tab === 'assign'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              分配新設備
            </button>
            <button
              onClick={() => setTab('manage')}
              className={`py-4 border-b-2 font-medium text-sm ${
                tab === 'manage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              已分配設備 ({tenantDevices.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          {loading ? (
            <div className="text-center py-8">載入中...</div>
          ) : tab === 'assign' ? (
            // 分配新設備
            <div>
              {unassignedDevices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暫無可分配的設備
                  <div className="text-sm mt-2">請先在「設備管理」新增設備</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 mb-4">
                    選擇要分配給「{tenantName}」的設備（可多選）：
                  </div>
                  {unassignedDevices.map((device) => (
                    <label
                      key={device.id}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDevices.includes(device.id)}
                        onChange={() => handleToggleDevice(device.id)}
                        className="rounded"
                      />
                      <Smartphone className="w-5 h-5 mx-3 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {device.deviceName || '未命名設備'}
                        </div>
                        {device.uuid && (
                          <div className="text-sm text-gray-500">
                            UUID: {device.uuid}
                          </div>
                        )}
                        {device.macAddress && (
                          <div className="text-xs text-gray-400">
                            MAC: {device.macAddress}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {device.type}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // 已分配設備
            <div>
              {tenantDevices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  此社區尚未分配設備
                </div>
              ) : (
                <div className="space-y-2">
                  {tenantDevices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center p-4 border border-gray-200 rounded-lg"
                    >
                      <Smartphone className="w-5 h-5 mr-3 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {device.deviceName || '未命名設備'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {device.uuid ? `UUID: ${device.uuid}` : device.macAddress ? `MAC: ${device.macAddress}` : 'ID: ' + device.id}
                        </div>
                        {device.elder && (
                          <div className="text-sm text-green-600 mt-1">
                            ✓ 已綁定長輩: {device.elder.name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {device.elderId ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            已綁定
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                            未綁定
                          </span>
                        )}
                        {!device.elderId && (
                          <button
                            onClick={() =>
                              handleRemoveDevice(device.id, device.deviceName || device.macAddress)
                            }
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            移除
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div className="text-sm text-gray-600">
            {tab === 'assign' && selectedDevices.length > 0 && (
              <span>已選擇 {selectedDevices.length} 個設備</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button onClick={onClose} className="btn-secondary">
              關閉
            </button>
            {tab === 'assign' && selectedDevices.length > 0 && (
              <button onClick={handleAssign} className="btn-primary">
                分配設備
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
