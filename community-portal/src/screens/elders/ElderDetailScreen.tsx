import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Link as LinkIcon, Unlink, MapPin, Clock, Signal, Bell } from 'lucide-react';
import { elderService } from '../../services/elderService';
import { useAuth } from '../../hooks/useAuth';
import { ElderFormModal } from '../../components/ElderFormModal';
import { formatDistanceToNow, format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { Elder, Device, Activity } from '../../types';

export const ElderDetailScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantId, isAdmin } = useAuth();
  const [elder, setElder] = useState<Elder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [bindingDevice, setBindingDevice] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activityHours, setActivityHours] = useState(24);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!id) return;

    loadElder();
  }, [id]);

  useEffect(() => {
    if (elder && elder.deviceId) {
      loadActivities();
    }
  }, [elder?.deviceId, activityHours]);

  const handleEditSuccess = () => {
    loadElder(); // 重新載入長者資料
  };

  const loadElder = async () => {
    try {
      setLoading(true);
      const response = await elderService.getOne(id!);
      setElder(response.data);
    } catch (error) {
      console.error('Failed to load elder:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    if (!id) return;
    
    try {
      setLoadingActivities(true);
      const response = await elderService.getActivities(id, activityHours);
      setActivities(response.data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoadingActivities(false);
    }
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

  const loadAvailableDevices = async () => {
    if (!tenantId) return;
    
    try {
      const response = await elderService.getAvailableDevices(tenantId);
      setAvailableDevices(response.data as Device[]);
      setShowDeviceModal(true);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const handleBindDevice = async (deviceId: string) => {
    if (!elder || !isAdmin) return;

    try {
      setBindingDevice(true);
      await elderService.bindDevice(elder.id, deviceId);
      setShowDeviceModal(false);
      await loadElder();
    } catch (error) {
      console.error('Failed to bind device:', error);
      alert('綁定設備失敗');
    } finally {
      setBindingDevice(false);
    }
  };

  const handleUnbindDevice = async () => {
    if (!elder || !elder.deviceId || !isAdmin) return;
    
    if (!confirm('確定要解除綁定此設備嗎？')) return;

    try {
      await elderService.unbindDevice(elder.id, elder.deviceId);
      await loadElder();
    } catch (error) {
      console.error('Failed to unbind device:', error);
      alert('解綁設備失敗');
    }
  };

  const handleDelete = async () => {
    if (!elder || !isAdmin) return;
    
    if (!confirm(`確定要刪除長者「${elder.name}」嗎？`)) return;

    try {
      await elderService.delete(elder.id);
      navigate('/elders');
    } catch (error) {
      console.error('Failed to delete elder:', error);
      alert('刪除失敗');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!elder) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">找不到長者資料</p>
        <button
          onClick={() => navigate('/elders')}
          className="mt-4 btn btn-primary"
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/elders')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Edit2 className="w-4 h-4" />
              <span>編輯</span>
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>刪除</span>
            </button>
          </div>
        )}
      </div>

      {/* Basic Info */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">基本資料</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">姓名</label>
            <p className="text-gray-900 font-medium">{elder.name}</p>
          </div>
          {elder.gender && (
            <div>
              <label className="text-sm text-gray-500">性別</label>
              <p className="text-gray-900">
                {elder.gender === 'MALE' ? '男' : elder.gender === 'FEMALE' ? '女' : '其他'}
              </p>
            </div>
          )}
          {elder.age && (
            <div>
              <label className="text-sm text-gray-500">年齡</label>
              <p className="text-gray-900">{elder.age}歲</p>
            </div>
          )}
          {elder.phone && (
            <div>
              <label className="text-sm text-gray-500">電話</label>
              <p className="text-gray-900">{elder.phone}</p>
            </div>
          )}
          {elder.address && (
            <div className="col-span-2">
              <label className="text-sm text-gray-500">地址</label>
              <p className="text-gray-900">{elder.address}</p>
            </div>
          )}
          {elder.emergencyContact && (
            <div>
              <label className="text-sm text-gray-500">緊急聯絡人</label>
              <p className="text-gray-900">{elder.emergencyContact}</p>
            </div>
          )}
          {elder.emergencyPhone && (
            <div>
              <label className="text-sm text-gray-500">緊急聯絡電話</label>
              <p className="text-gray-900">{elder.emergencyPhone}</p>
            </div>
          )}
        </div>

        {elder.notes && (
          <div className="mt-4">
            <label className="text-sm text-gray-500">備註</label>
            <p className="text-gray-900">{elder.notes}</p>
          </div>
        )}
      </div>

      {/* Device Binding */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">綁定設備</h3>
          {isAdmin && !elder.device && (
            <button
              onClick={loadAvailableDevices}
              className="btn btn-primary flex items-center space-x-2"
            >
              <LinkIcon className="w-4 h-4" />
              <span>綁定設備</span>
            </button>
          )}
        </div>

        {elder.device ? (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {elder.device.deviceName || `設備 ${elder.device.minor}`}
                </p>
                <p className="text-sm text-gray-600 font-mono">
                  UUID: {elder.device.uuid}
                </p>
                <p className="text-sm text-gray-600 font-mono">
                  Major: {elder.device.major} / Minor: {elder.device.minor}
                </p>
                {elder.device.batteryLevel && (
                  <p className="text-sm text-gray-600 mt-1">
                    電池電量: {elder.device.batteryLevel}%
                  </p>
                )}
              </div>
              {isAdmin && (
                <button
                  onClick={handleUnbindDevice}
                  className="btn btn-danger flex items-center space-x-2"
                >
                  <Unlink className="w-4 h-4" />
                  <span>解綁</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">尚未綁定設備</p>
        )}
      </div>

      {/* Activity Records (Device Footprint) */}
      {elder.device && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">設備足跡</h3>
            <select
              value={activityHours}
              onChange={(e) => setActivityHours(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value={6}>最近 6 小時</option>
              <option value={12}>最近 12 小時</option>
              <option value={24}>最近 24 小時</option>
              <option value={72}>最近 3 天</option>
              <option value={168}>最近 7 天</option>
            </select>
          </div>

          {loadingActivities ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500">最近 {activityHours} 小時無活動記錄</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-primary-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {activity.gatewayName || '未知位置'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(safeToDate(activity.timestamp), 'yyyy/MM/dd HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    
                    {activity.gatewayType && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getGatewayTypeColor(activity.gatewayType)}`}>
                        {getGatewayTypeLabel(activity.gatewayType)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    {activity.rssi && (
                      <div className="flex items-center space-x-1">
                        <Signal className="w-3 h-3" />
                        <span>{activity.rssi} dBm</span>
                      </div>
                    )}
                    
                    {activity.triggeredNotification && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Bell className="w-3 h-3" />
                        <span>已發送通知</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(safeToDate(activity.timestamp), {
                          addSuffix: true,
                          locale: zhTW,
                        })}
                      </span>
                    </div>
                  </div>

                  {(activity.latitude && activity.longitude) && (
                    <div className="mt-2">
                      <a
                        href={`https://www.google.com/maps?q=${activity.latitude},${activity.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:text-primary-800"
                      >
                        查看地圖位置
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Device Modal */}
      {showDeviceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">選擇設備</h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {availableDevices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">沒有可用的設備</p>
              ) : (
                <div className="space-y-2">
                  {availableDevices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => handleBindDevice(device.id)}
                      disabled={bindingDevice}
                      className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <p className="font-medium">
                        {device.deviceName || `設備 ${device.minor}`}
                      </p>
                      <p className="text-sm text-gray-600 font-mono">
                        {device.uuid} / {device.major} / {device.minor}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end">
              <button
                onClick={() => setShowDeviceModal(false)}
                className="btn btn-secondary"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <ElderFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        editingElder={elder}
      />
    </div>
  );
};
