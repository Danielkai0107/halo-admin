import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Phone, MapPin, Battery, Signal, User, Calendar } from 'lucide-react';
import { elderService } from '../../services/elderService';
import { useAuth } from '../../hooks/useAuth';
import { useTenantStore } from '../../store/tenantStore';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { Elder } from '../../types';

export const ElderListScreen = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const tenant = useTenantStore(state => state.selectedTenant);
  const [elders, setElders] = useState<Elder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;

    setLoading(true);
    // 訂閱長輩列表
    const unsubscribe = elderService.subscribe(tenant.id, (data) => {
      setElders(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenant]);

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

  const getBatteryColor = (level?: number) => {
    if (!level) return 'text-gray-400';
    if (level > 60) return 'text-green-500';
    if (level > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

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
        <h2 className="text-2xl font-bold text-gray-900">長輩管理</h2>
        {isAdmin && (
          <button
            onClick={() => navigate('/elders/add')}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            <span>新增長者</span>
          </button>
        )}
      </div>

      {/* Elders List */}
      {elders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">暫無長者資料</p>
        </div>
      ) : (
        <div className="space-y-3">
          {elders.map((elder) => (
            <div
              key={elder.id}
              onClick={() => navigate(`/elders/${elder.id}`)}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start space-x-3 mb-3">
                {/* 頭像 */}
                <div className="flex-shrink-0">
                  {elder.photo ? (
                    <img 
                      src={elder.photo} 
                      alt={elder.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-7 h-7 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{elder.name}</h3>
                      {/* 性別和年齡 */}
                      {(elder.gender || elder.age) && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mt-0.5">
                          {elder.gender && (
                            <span>
                              {elder.gender === 'MALE' ? '男' : elder.gender === 'FEMALE' ? '女' : '其他'}
                            </span>
                          )}
                          {elder.gender && elder.age && <span>·</span>}
                          {elder.age && (
                            <span className="flex items-center space-x-0.5">
                              <Calendar className="w-3 h-3" />
                              <span>{elder.age}歲</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {getStatusBadge(elder.status)}
                  </div>
                  {elder.phone && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                      <Phone className="w-3 h-3" />
                      <span>{elder.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {elder.address && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{elder.address}</span>
                </div>
              )}

              {elder.device && (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-center space-x-2">
                    <Signal className="w-4 h-4 text-gray-400" />
                    <span className="font-mono text-xs">{elder.device.deviceName || elder.device.uuid || elder.device.macAddress}</span>
                  </div>
                  {elder.device.batteryLevel && (
                    <div className="flex items-center space-x-1">
                      <Battery className={`w-4 h-4 ${getBatteryColor(elder.device.batteryLevel)}`} />
                      <span className="text-xs">{elder.device.batteryLevel}%</span>
                    </div>
                  )}
                </div>
              )}

              {elder.lastActivityAt && (
                <p className="text-xs text-gray-500 mt-2">
                  最後活動: {formatDistanceToNow(new Date(elder.lastActivityAt), {
                    addSuffix: true,
                    locale: zhTW,
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
