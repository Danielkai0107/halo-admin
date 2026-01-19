import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, User, AlertTriangle, Battery, Signal, Clock, MapPinned, Calendar, Edit } from 'lucide-react';
import { elderService } from '../services/elderService';
import { formatDistanceToNow, format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { Elder } from '../types';

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

interface Activity {
  id: string;
  timestamp: any;
  gateway?: {
    name: string;
    location?: string;
  };
  latitude?: number;
  longitude?: number;
  rssi?: number;
}

export const ElderDetailPage = () => {
  const { id } = useParams<{ id: string}>();
  const navigate = useNavigate();
  const [elder, setElder] = useState<Elder | null>(null);
  const [latestLocation, setLatestLocation] = useState<LatestLocation | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<24 | 168 | 720>(24); // 24h, 7d, 30d

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
        const [elderRes, locationRes, activitiesRes] = await Promise.all([
          elderService.getOne(id),
          elderService.getLatestLocation(id),
          elderService.getActivity(id, timeRange),
        ]);
        
        setElder(elderRes.data);
        setLatestLocation(locationRes.data);
        setActivities((activitiesRes.data as Activity[]) || []);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/elders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">長輩詳情</h1>
        </div>
        <button
          onClick={() => navigate(`/elders?edit=${id}`)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <Edit className="w-4 h-4" />
          <span>編輯資料</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：基本資料 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 基本資料卡片 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col items-center mb-6">
              {elder.photo ? (
                <img 
                  src={elder.photo} 
                  alt={elder.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 mb-4"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-100 mb-4">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              )}
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{elder.name}</h2>
              {getStatusBadge(elder.status)}
              
              {(elder.gender || elder.age) && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-3">
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

            <div className="space-y-4">
              {elder.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${elder.phone}`} className="text-gray-700 hover:text-primary-600">
                    {elder.phone}
                  </a>
                </div>
              )}

              {elder.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <span className="text-gray-700">{elder.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* 緊急聯絡人 */}
          {(elder.emergencyContact || elder.emergencyPhone) && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">緊急聯絡人</h3>
              </div>
              <div className="space-y-3">
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
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Signal className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">關聯設備</h3>
              </div>
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="text-gray-600">序號: </span>
                  <code className="font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded">
                    {elder.device.deviceName || elder.device.uuid || elder.device.macAddress}
                  </code>
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
        </div>

        {/* 右側：位置和活動記錄 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 最新位置 */}
          {latestLocation && (
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center space-x-2 mb-4">
                <MapPinned className="w-6 h-6" />
                <h3 className="text-xl font-semibold">最新位置</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-5 h-5" />
                    <span className="text-lg font-medium">{latestLocation.gateway_name || '未知位置'}</span>
                  </div>
                  <div className="text-sm opacity-90">
                    類型: {latestLocation.gateway_type === 'BOUNDARY' ? '⚠️ 邊界點' : latestLocation.gateway_type === 'MOBILE' ? '📱 移動接收器' : '📍 一般接收器'}
                  </div>
                </div>
                {(latestLocation.lat && latestLocation.lng) && (
                  <div>
                    <div className="text-sm opacity-75 mb-2">座標位置:</div>
                    <a 
                      href={`https://www.google.com/maps?q=${latestLocation.lat},${latestLocation.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-sm font-mono bg-white/20 px-3 py-2 rounded hover:bg-white/30 transition"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{latestLocation.lat.toFixed(6)}, {latestLocation.lng.toFixed(6)}</span>
                    </a>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm opacity-90 pt-2 border-t border-white/20">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {latestLocation.last_seen && formatDistanceToNow(safeToDate(latestLocation.last_seen), { addSuffix: true, locale: zhTW })}
                    </span>
                  </div>
                  {latestLocation.rssi && (
                    <span>訊號: {latestLocation.rssi} dBm</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 行蹤記錄 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-6 h-6 text-gray-600" />
                <h3 className="text-xl font-semibold text-gray-900">行蹤記錄</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTimeRange(24)}
                  className={`px-4 py-2 text-sm rounded-lg transition ${timeRange === 24 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  今天
                </button>
                <button
                  onClick={() => setTimeRange(168)}
                  className={`px-4 py-2 text-sm rounded-lg transition ${timeRange === 168 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  7天
                </button>
                <button
                  onClick={() => setTimeRange(720)}
                  className={`px-4 py-2 text-sm rounded-lg transition ${timeRange === 720 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  30天
                </button>
              </div>
            </div>

            {/* 活動時間軸 */}
            {activities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MapPinned className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>此時間範圍內沒有活動記錄</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {activities.map((activity) => (
                  <div key={activity.id} className="border-l-4 border-primary-300 pl-6 pb-4 relative">
                    <div className="absolute left-0 top-0 w-4 h-4 bg-primary-500 rounded-full -ml-2"></div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPinned className="w-5 h-5 text-primary-600" />
                          <span className="font-semibold text-gray-900">
                            {activity.gateway?.name || '接收點'}
                          </span>
                        </div>
                        {activity.gateway?.location && (
                          <p className="text-sm text-gray-600 mb-1">{activity.gateway.location}</p>
                        )}
                        {(activity.latitude && activity.longitude) && (
                          <p className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                            {activity.latitude.toFixed(6)}, {activity.longitude.toFixed(6)}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.timestamp && format(safeToDate(activity.timestamp), 'MM/dd HH:mm', { locale: zhTW })}
                        </p>
                        {activity.rssi && (
                          <p className="text-xs text-gray-500">RSSI: {activity.rssi}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
