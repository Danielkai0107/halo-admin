import { useEffect, useState } from 'react';
import { X, Radio, MapPin, Wifi, Plus, Search, Trash2 } from 'lucide-react';
import { gatewayService } from '../services/gatewayService';
import type { Gateway } from '../types';

interface GatewayListModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
}

export const GatewayListModal = ({
  isOpen,
  onClose,
  tenantId,
  tenantName,
}: GatewayListModalProps) => {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableGateways, setAvailableGateways] = useState<Gateway[]>([]);
  const [selectedGateways, setSelectedGateways] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && tenantId) {
      loadGateways();
      loadAvailableGateways();
    }
  }, [isOpen, tenantId]);

  const loadGateways = async () => {
    try {
      setLoading(true);
      // 獲取標記在此社區範圍內的接收點
      const response: any = await gatewayService.getAll(1, 100, tenantId);
      setGateways(response.data.data || []);
    } catch (error) {
      console.error('Failed to load gateways:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableGateways = async () => {
    try {
      // 獲取所有接收點（不限制社區）
      const response: any = await gatewayService.getAll(1, 1000);
      const allGateways = response.data.data || [];
      // 過濾出未標記社區的接收點
      const available = allGateways.filter((g: Gateway) => !g.tenantId);
      setAvailableGateways(available);
    } catch (error) {
      console.error('Failed to load available gateways:', error);
    }
  };

  const handleRemoveTag = async (gatewayId: string, gatewayName: string) => {
    if (!confirm(`確定要移除接收點「${gatewayName}」的社區標籤嗎？`)) return;

    try {
      // 將 tenantId 設為 undefined，移除社區標籤
      await gatewayService.update(gatewayId, { tenantId: undefined as any });
      alert('已移除社區標籤');
      loadGateways();
      loadAvailableGateways();
    } catch (error: any) {
      alert(error.response?.data?.message || '移除失敗');
    }
  };

  const handleToggleGateway = (gatewayId: string) => {
    setSelectedGateways((prev) =>
      prev.includes(gatewayId)
        ? prev.filter((id) => id !== gatewayId)
        : [...prev, gatewayId]
    );
  };

  const handleAddGateways = async () => {
    if (selectedGateways.length === 0) {
      alert('請至少選擇一個接收點');
      return;
    }

    try {
      // 批量更新選中的接收點，標記為此社區
      await Promise.all(
        selectedGateways.map((gatewayId) =>
          gatewayService.update(gatewayId, { tenantId })
        )
      );
      alert(`成功標記 ${selectedGateways.length} 個接收點`);
      setSelectedGateways([]);
      setShowAddModal(false);
      loadGateways();
      loadAvailableGateways();
    } catch (error: any) {
      alert(error.response?.data?.message || '標記失敗');
    }
  };

  // 過濾可用的接收點（根據搜尋詞）
  const filteredAvailableGateways = availableGateways.filter((gateway) =>
    gateway.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gateway.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (gateway.location && gateway.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTypeLabel = (type: string) => {
    const labels = {
      GENERAL: '一般接收點',
      BOUNDARY: '邊界點',
      MOBILE: '移動接收點',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      GENERAL: 'bg-blue-100 text-blue-800',
      BOUNDARY: 'bg-red-100 text-red-800',
      MOBILE: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type as keyof typeof styles] || styles.GENERAL}`}>
        {getTypeLabel(type)}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Radio className="w-6 h-6 text-purple-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    接收點清單
                  </h3>
                  <p className="text-sm text-gray-500">
                    {tenantName} - 社區範圍內的接收點
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>新增</span>
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>提示：</strong>接收點不需要分配到社區，可接收所有設備訊號。
                這裡顯示的是標記在此社區範圍內的接收點，僅用於位置管理。
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">載入中...</p>
              </div>
            ) : gateways.length === 0 ? (
              <div className="text-center py-12">
                <Radio className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">此社區範圍內沒有接收點</p>
                <p className="text-sm text-gray-400">
                  前往「閘道器管理」頁面新增接收點，並標記此社區
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {gateways.map((gateway) => (
                  <div
                    key={gateway.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Wifi className="w-5 h-5 text-purple-600" />
                          <h4 className="text-base font-semibold text-gray-900">
                            {gateway.name}
                          </h4>
                          {getTypeBadge(gateway.type)}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              gateway.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {gateway.isActive ? '啟用' : '停用'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">序列號：</span>
                            <code className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                              {gateway.serialNumber}
                            </code>
                          </div>

                          {gateway.location && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="text-gray-600">{gateway.location}</span>
                            </div>
                          )}

                          {gateway.latitude && gateway.longitude && (
                            <div className="col-span-2">
                              <span className="text-gray-600">GPS 座標：</span>
                              <span className="ml-2 text-gray-900">
                                {gateway.latitude.toFixed(6)}, {gateway.longitude.toFixed(6)}
                              </span>
                            </div>
                          )}
                        </div>

                        {gateway.type === 'MOBILE' && (
                          <div className="mt-2 text-xs text-gray-500">
                            📱 移動式接收點（如志工手機）
                          </div>
                        )}

                        {gateway.type === 'BOUNDARY' && (
                          <div className="mt-2 text-xs text-red-600">
                            ⚠️ 邊界點 - 會觸發邊界警報
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => handleRemoveTag(gateway.id, gateway.name)}
                          className="flex items-center space-x-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="移除社區標籤"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm">移除標籤</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共 {gateways.length} 個接收點標記在此社區範圍內
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 新增接收點彈窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
              onClick={() => setShowAddModal(false)}
            />

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              {/* Header */}
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      新增接收點到「{tenantName}」
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      選擇要標記到此社區的接收點
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* 搜尋欄 */}
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜尋接收點名稱、序列號或位置..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="bg-white px-6 py-4 max-h-[400px] overflow-y-auto">
                {filteredAvailableGateways.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? (
                      <>
                        <p>找不到符合「{searchTerm}」的接收點</p>
                        <button
                          onClick={() => setSearchTerm('')}
                          className="text-primary-600 hover:text-primary-700 text-sm mt-2"
                        >
                          清除搜尋
                        </button>
                      </>
                    ) : (
                      <>
                        <Radio className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p>沒有可用的接收點</p>
                        <p className="text-sm text-gray-400 mt-2">
                          所有接收點都已標記社區
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAvailableGateways.map((gateway) => (
                      <label
                        key={gateway.id}
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGateways.includes(gateway.id)}
                          onChange={() => handleToggleGateway(gateway.id)}
                          className="rounded"
                        />
                        <Wifi className="w-5 h-5 mx-3 text-purple-600" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {gateway.name}
                            </span>
                            {getTypeBadge(gateway.type)}
                          </div>
                          <div className="text-sm text-gray-500">
                            序列號: {gateway.serialNumber}
                          </div>
                          {gateway.location && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {gateway.location}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {selectedGateways.length > 0 && (
                      <span>已選擇 {selectedGateways.length} 個接收點</span>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        setSelectedGateways([]);
                        setSearchTerm('');
                      }}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    {selectedGateways.length > 0 && (
                      <button
                        onClick={handleAddGateways}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        確認新增
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
