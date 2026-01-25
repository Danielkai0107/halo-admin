import { useState, useEffect } from 'react';
import { Settings, MapPin, Trash2, Clock } from 'lucide-react';
import { notificationPointService } from '../../services/notificationPointService';
import { useAuth } from '../../hooks/useAuth';
import { GatewaySelectionModal } from '../../components/GatewaySelectionModal';
import { format } from 'date-fns';
import type { TenantNotificationPoint, Gateway } from '../../types';

export const NotificationPointsScreen = () => {
  const { tenantId, isAdmin } = useAuth();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [notificationPoints, setNotificationPoints] = useState<TenantNotificationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      
      // 載入所有 gateways
      const gatewaysResponse = await notificationPointService.getAvailableGateways(tenantId);
      setGateways(gatewaysResponse.data);

      // 載入現有的通知點
      const pointsResponse = await notificationPointService.getAll(tenantId);
      setNotificationPoints(pointsResponse.data);
      
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 取得已選擇的 gateway IDs
  const selectedGatewayIds = notificationPoints
    .filter(p => p.isActive)
    .map(p => p.gatewayId);

  // 取得通知點 ID
  const getNotificationPointId = (gatewayId: string): string | null => {
    const point = notificationPoints.find(p => p.gatewayId === gatewayId);
    return point?.id || null;
  };

  // 切換 gateway 選擇狀態
  const handleToggleGateway = async (gatewayId: string) => {
    if (!tenantId || !isAdmin) return;

    const pointId = getNotificationPointId(gatewayId);
    
    try {
      setSaving(true);

      if (pointId) {
        // 已存在，切換啟用狀態
        const point = notificationPoints.find(p => p.id === pointId);
        if (point) {
          await notificationPointService.update(pointId, {
            isActive: !point.isActive,
          });
        }
      } else {
        // 不存在，建立新的通知點
        const gateway = gateways.find(g => g.id === gatewayId);
        await notificationPointService.create({
          tenantId,
          gatewayId: gatewayId,
          name: gateway?.name || gateway?.location || '未命名接收器',
          notifyOnElderActivity: true,
          isActive: true,
        });
      }

      // 重新載入資料
      await loadData();
    } catch (error) {
      console.error('Failed to toggle gateway:', error);
      alert('操作失敗');
    } finally {
      setSaving(false);
    }
  };

  // 刪除通知點
  const handleDelete = async (pointId: string) => {
    if (!isAdmin || !confirm('確定要移除此通知點嗎？')) return;

    try {
      setSaving(true);
      await notificationPointService.delete(pointId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete notification point:', error);
      alert('刪除失敗');
    } finally {
      setSaving(false);
    }
  };

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

  const safeToDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    return new Date(timestamp);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // 獲取已啟用通知點的完整資料
  const activePoints = notificationPoints
    .filter(p => p.isActive)
    .map(point => ({
      ...point,
      gateway: gateways.find(g => g.id === point.gatewayId),
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">通知點管理</h2>
          <p className="text-sm text-gray-600 mt-1">
            管理您社區的通知點位，當長者經過這些位置時會自動發送 LINE 通知
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 btn btn-primary"
          >
            <Settings className="w-5 h-5" />
            <span>點位設定</span>
          </button>
        )}
      </div>

      {/* My Notification Points Table */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">我的通知點 ({activePoints.length})</h3>
        
        {activePoints.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500 mb-4">尚未設定任何通知點</p>
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
              >
                開始設定
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    接收器名稱
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    位置
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    類型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    序號
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    建立時間
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activePoints.map((point) => (
                  <tr key={point.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-primary-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {point.gateway?.name || point.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {point.gateway?.location || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {point.gateway && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getGatewayTypeColor(point.gateway.type)}`}>
                          {getGatewayTypeLabel(point.gateway.type)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-500 font-mono">
                        {point.gateway?.serialNumber || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(safeToDate(point.createdAt), 'yyyy/MM/dd')}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(point.id)}
                          disabled={saving}
                          className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                          title="移除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gateway Selection Modal */}
      <GatewaySelectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        gateways={gateways}
        selectedGatewayIds={selectedGatewayIds}
        onToggle={handleToggleGateway}
        loading={saving}
      />
    </div>
  );
};
