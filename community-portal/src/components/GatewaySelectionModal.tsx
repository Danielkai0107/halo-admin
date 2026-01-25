import { useState } from 'react';
import { Modal } from './Modal';
import { Search, Check } from 'lucide-react';
import type { Gateway } from '../types';

interface GatewaySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateways: Gateway[];
  selectedGatewayIds: string[];
  onToggle: (gatewayId: string) => void;
  loading?: boolean;
}

export const GatewaySelectionModal = ({
  isOpen,
  onClose,
  gateways,
  selectedGatewayIds,
  onToggle,
  loading = false,
}: GatewaySelectionModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getGatewayTypeLabel = (type: string) => {
    const labels = {
      SCHOOL_ZONE: '學校區域',
      SAFE_ZONE: '安全區域',
      OBSERVE_ZONE: '觀察區域',
      INACTIVE: '未啟用',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getGatewayTypeColor = (type: string) => {
    const colors = {
      SCHOOL_ZONE: 'bg-blue-100 text-blue-800',
      SAFE_ZONE: 'bg-green-100 text-green-800',
      OBSERVE_ZONE: 'bg-yellow-100 text-yellow-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // 搜尋過濾
  const filteredGateways = gateways.filter(gateway => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      gateway.name?.toLowerCase().includes(search) ||
      gateway.location?.toLowerCase().includes(search) ||
      gateway.serialNumber?.toLowerCase().includes(search)
    );
  });

  const isSelected = (gatewayId: string) => selectedGatewayIds.includes(gatewayId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="選擇通知點位" size="xl">
      <div className="p-6">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋接收器名稱、位置或序號..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            共 {gateways.length} 個接收器，已選擇 {selectedGatewayIds.length} 個
          </p>
        </div>

        {/* Gateway List */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {filteredGateways.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? '找不到符合的接收器' : '沒有可用的接收器'}
            </div>
          ) : (
            filteredGateways.map((gateway) => {
              const selected = isSelected(gateway.id);
              
              return (
                <div
                  key={gateway.id}
                  onClick={() => !loading && onToggle(gateway.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Checkbox */}
                    <div className="pt-1">
                      {selected ? (
                        <div className="w-5 h-5 rounded border-2 border-primary-600 bg-primary-600 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded border-2 border-gray-300" />
                      )}
                    </div>

                    {/* Gateway Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {gateway.name || '未命名接收器'}
                          </h4>
                          {gateway.location && (
                            <p className="text-sm text-gray-600">{gateway.location}</p>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getGatewayTypeColor(gateway.type)}`}>
                          {getGatewayTypeLabel(gateway.type)}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-500 font-mono">
                        {gateway.serialNumber}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            關閉
          </button>
        </div>
      </div>
    </Modal>
  );
};
