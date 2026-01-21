import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, User, AlertTriangle, Battery, Signal, Clock, MapPinned, Calendar, Trash2 } from 'lucide-react';
import { elderService } from '../../services/elderService';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow, format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { Elder, Activity } from '../../types';

interface LatestLocation {
  elderId: string;
  deviceUuid: string;
  gateway_id: string;
  gateway_name: string;
  gateway_type: string;
  lat: number;
  lng: number;
  rssi: number;
  major: number;
  minor: number;
  last_seen: any;
}

export const ElderDetailScreen = () => {
  const { id } = useParams<{ id: string}>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [elder, setElder] = useState<Elder | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [latestLocation, setLatestLocation] = useState<LatestLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<24 | 168 | 720>(24); // 24h, 7d, 30d
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 安全的時間轉換函數
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

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [elderRes, activitiesRes, locationRes] = await Promise.all([
          elderService.getOne(id),
          elderService.getActivities(id, timeRange),
          elderService.getLatestLocation(id),
        ]);
        
        setElder(elderRes.data);
        setActivities(activitiesRes.data);
        setLatestLocation(locationRes.data);
      } catch (error) {
        console.error('Failed to load elder data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!elder) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">找不到長輩資料</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      HOSPITALIZED: 'bg-yellow-100 text-yellow-800',
      DECEASED: 'bg-red-100 text-red-800',
      MOVED_OUT: 'bg-blue-100 text-blue-800',
    };
    
    const labels = {
      ACTIVE: '正常',
      INACTIVE: '不活躍',
      HOSPITALIZED: '住院',
      DECEASED: '已故',
      MOVED_OUT: '遷出',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const handleDeleteElder = async () => {
    if (!id) return;
    
    setDeleting(true);
    try {
      await elderService.delete(id);
      // 刪除成功後導航回長輩列表
      navigate('/elders', { replace: true });
    } catch (error) {
      console.error('Failed to delete elder:', error);
      alert('移除長者失敗，請稍後再試');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/elders')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">長輩詳情</h2>
      </div>

      {/* 基本資料 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-start space-x-4 mb-4">
          {/* 頭像 */}
          <div className="flex-shrink-0">
            {elder.photo ? (
              <img 
                src={elder.photo} 
                alt={elder.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-10 h-10 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{elder.name}</h3>
                {/* 性別和年齡 */}
                {(elder.gender || elder.age) && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                    {elder.gender && (
                      <span>
                        {elder.gender === 'MALE' ? '男' : elder.gender === 'FEMALE' ? '女' : '其他'}
                      </span>
                    )}
                    {elder.gender && elder.age && <span>·</span>}
                    {elder.age && (
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{elder.age}歲</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
              {getStatusBadge(elder.status)}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {elder.phone && (
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{elder.phone}</span>
            </div>
          )}

          {elder.address && (
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{elder.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* 緊急聯絡人 */}
      {(elder.emergencyContact || elder.emergencyPhone) && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-base font-semibold text-gray-900">緊急聯絡人</h3>
          </div>
          <div className="space-y-2">
            {elder.emergencyContact && (
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{elder.emergencyContact}</span>
              </div>
            )}
            {elder.emergencyPhone && (
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${elder.emergencyPhone}`} className="text-primary-600 hover:underline">
                  {elder.emergencyPhone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 設備資訊 */}
      {elder.device && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Signal className="w-5 h-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">關聯設備</h3>
          </div>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">序號: </span>
              <code className="font-mono text-gray-900">{elder.device.deviceName || elder.device.uuid || elder.device.macAddress}</code>
            </div>
            {elder.device.batteryLevel && (
              <div className="flex items-center space-x-2">
                <Battery className={`w-4 h-4 ${elder.device.batteryLevel > 60 ? 'text-green-500' : elder.device.batteryLevel > 20 ? 'text-yellow-500' : 'text-red-500'}`} />
                <span className="text-sm text-gray-700">電量: {elder.device.batteryLevel}%</span>
              </div>
            )}
            {elder.device.lastSeen && (
              <div className="text-xs text-gray-500">
                最後連線: {formatDistanceToNow(new Date(elder.device.lastSeen), { addSuffix: true, locale: zhTW })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 最新位置 */}
      {latestLocation && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow p-4 text-white">
          <div className="flex items-center space-x-2 mb-3">
            <MapPinned className="w-5 h-5" />
            <h3 className="text-base font-semibold">最新位置</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{latestLocation.gateway_name || '未知位置'}</span>
              </div>
              <div className="text-xs opacity-90">
                類型: {latestLocation.gateway_type === 'BOUNDARY' ? '邊界點' : latestLocation.gateway_type === 'MOBILE' ? '移動接收器' : '一般接收器'}
              </div>
            </div>
            {(latestLocation.lat && latestLocation.lng) && (
              <div>
                <div className="text-xs opacity-75 mb-1">座標位置:</div>
                <a 
                  href={`https://www.google.com/maps?q=${latestLocation.lat},${latestLocation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono bg-white/20 px-2 py-1 rounded inline-block hover:bg-white/30 transition"
                >
                  {latestLocation.lat.toFixed(6)}, {latestLocation.lng.toFixed(6)}
                </a>
              </div>
            )}
            {latestLocation.last_seen && (
              <div className="flex items-center space-x-2 text-xs opacity-90">
                <Clock className="w-3 h-3" />
                <span>
                  {formatDistanceToNow(safeToDate(latestLocation.last_seen), { addSuffix: true, locale: zhTW })}
                </span>
              </div>
            )}
            {latestLocation.rssi && (
              <div className="text-xs opacity-75">
                訊號強度: {latestLocation.rssi} dBm
              </div>
            )}
          </div>
        </div>
      )}

      {/* 行蹤記錄 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">行蹤記錄</h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange(24)}
              className={`px-3 py-1 text-xs rounded-full ${timeRange === 24 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              今天
            </button>
            <button
              onClick={() => setTimeRange(168)}
              className={`px-3 py-1 text-xs rounded-full ${timeRange === 168 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              7天
            </button>
            <button
              onClick={() => setTimeRange(720)}
              className={`px-3 py-1 text-xs rounded-full ${timeRange === 720 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              30天
            </button>
          </div>
        </div>

        {/* 活動時間軸 */}
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPinned className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">此時間範圍內沒有活動記錄</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="border-l-2 border-primary-300 pl-4 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <MapPinned className="w-4 h-4 text-primary-600" />
                      <span className="font-medium text-gray-900">
                        {activity.gateway?.name || '接收點'}
                      </span>
                    </div>
                    {activity.gateway?.location && (
                      <p className="text-sm text-gray-600">{activity.gateway.location}</p>
                    )}
                    {(activity.latitude && activity.longitude) && (
                      <p className="text-xs text-gray-500 font-mono">
                        {activity.latitude.toFixed(6)}, {activity.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {activity.timestamp && format(safeToDate(activity.timestamp), 'MM/dd HH:mm', { locale: zhTW })}
                    </p>
                    {activity.rssi && (
                      <p className="text-xs text-gray-400">RSSI: {activity.rssi}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 管理員操作區 - 移除長者 */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow p-4 border-2 border-red-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">危險操作</h3>
          <p className="text-sm text-gray-600 mb-4">
            移除長者將永久刪除此長者的所有資料，此操作無法復原。
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <Trash2 className="w-5 h-5" />
            <span>移除長者</span>
          </button>
        </div>
      )}

      {/* 刪除確認對話框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">確認移除長者</h3>
                <p className="text-sm text-gray-600">此操作無法復原</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                您確定要移除 <span className="font-semibold">{elder?.name}</span> 嗎？
              </p>
              <p className="text-sm text-red-600">
                ⚠️ 這將永久刪除：
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
                <li>• 長者基本資料</li>
                <li>• 所有行蹤記錄</li>
                <li>• 相關警報資料</li>
                <li>• 設備綁定關係</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleDeleteElder}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>移除中...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>確認移除</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
