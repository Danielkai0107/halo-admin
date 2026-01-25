import { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  Smartphone, 
  MapPin, 
  Bell, 
  AlertTriangle,
  TrendingUp,
  Download,
  Calendar
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { useAuth } from '../../hooks/useAuth';
import type { DashboardStats, InactiveElder, LocationHotspot } from '../../services/dashboardService';

export const DashboardScreen = () => {
  const { tenantId, tenant } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inactiveElders, setInactiveElders] = useState<InactiveElder[]>([]);
  const [hotspots, setHotspots] = useState<LocationHotspot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    loadDashboardData();
  }, [tenantId]);

  const loadDashboardData = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      
      // 並行載入所有資料
      const [statsData, inactiveData, hotspotsData] = await Promise.all([
        dashboardService.getStats(tenantId),
        dashboardService.getInactiveElders(tenantId, 24),
        dashboardService.getLocationHotspots(tenantId, 7),
      ]);

      setStats(statsData);
      setInactiveElders(inactiveData);
      setHotspots(hotspotsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!stats || !tenant) return;

    // 產生報告內容
    const reportDate = new Date().toLocaleDateString('zh-TW');
    const reportContent = `
社區照護系統報告
=====================================

社區名稱：${tenant.name}
報告日期：${reportDate}

一、長者服務統計
-------------------------------------
總長者數：${stats.totalElders} 位
活躍長者：${stats.activeElders} 位
不活躍長者：${stats.inactiveElders} 位
設備覆蓋率：${stats.totalElders > 0 ? Math.round((stats.devicesBound / stats.totalElders) * 100) : 0}%

二、設備運作狀況
-------------------------------------
已綁定設備：${stats.devicesBound} 個
未綁定設備：${stats.devicesUnbound} 個
低電量預警：${stats.lowBatteryDevices} 個
離線設備：${stats.offlineDevices} 個

三、通知服務統計
-------------------------------------
今日通知數：${stats.notificationsToday} 次
本週通知數：${stats.notificationsThisWeek} 次
啟用通知點：${stats.notificationPointsActive} 個

四、活動統計
-------------------------------------
24小時活動次數：${stats.activitiesLast24h} 次
7天活動次數：${stats.activitiesLast7d} 次

五、不活躍長者名單
-------------------------------------
${inactiveElders.length > 0 ? inactiveElders.map((elder, idx) => 
  `${idx + 1}. ${elder.name}（${elder.hoursSinceLastActivity}小時未活動）${elder.phone ? ' - ' + elder.phone : ''}`
).join('\n') : '無'}

六、熱門點位統計（近7天）
-------------------------------------
${hotspots.length > 0 ? hotspots.map((spot, idx) => 
  `${idx + 1}. ${spot.gatewayName}${spot.gatewayLocation ? ' (' + spot.gatewayLocation + ')' : ''} - ${spot.count} 次`
).join('\n') : '無資料'}

=====================================
報告結束
`.trim();

    // 建立並下載文字檔
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `社區照護報告_${tenant.name}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">載入失敗，請重新整理</p>
      </div>
    );
  }

  // 計算百分比
  const deviceCoverageRate = stats.totalElders > 0 
    ? Math.round((stats.devicesBound / stats.totalElders) * 100) 
    : 0;
  
  const activeRate = stats.totalElders > 0
    ? Math.round((stats.activeElders / stats.totalElders) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">社區概況</h2>
          <p className="text-sm text-gray-600 mt-1">{tenant?.name || '載入中...'}</p>
        </div>
        <button
          onClick={handleExportReport}
          className="flex items-center space-x-2 btn btn-primary"
        >
          <Download className="w-5 h-5" />
          <span>匯出報告</span>
        </button>
      </div>

      {/* 核心指標卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 總長者數 */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">總長者數</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalElders}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* 活躍率 */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">活躍率</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{activeRate}%</p>
              <p className="text-xs text-gray-500 mt-1">{stats.activeElders} / {stats.totalElders} 位</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* 設備覆蓋率 */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">設備覆蓋率</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{deviceCoverageRate}%</p>
              <p className="text-xs text-gray-500 mt-1">{stats.devicesBound} / {stats.totalElders} 個</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Smartphone className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* 今日通知數 */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">今日通知數</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.notificationsToday}</p>
              <p className="text-xs text-gray-500 mt-1">本週 {stats.notificationsThisWeek} 次</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Bell className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 預警區塊 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 不活躍長者 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">不活躍長者預警</h3>
            <span className="text-sm text-gray-600">{stats.inactiveElders} 位</span>
          </div>
          
          {stats.inactiveElders === 0 ? (
            <div className="text-center py-8 bg-green-50 rounded-lg">
              <p className="text-green-800">所有長者都有正常活動</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {inactiveElders.slice(0, 10).map((elder) => (
                <div
                  key={elder.id}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{elder.name}</p>
                      <p className="text-sm text-gray-600">
                        {elder.hoursSinceLastActivity > 999 
                          ? '從未活動' 
                          : `${elder.hoursSinceLastActivity} 小時未活動`}
                      </p>
                      {elder.phone && (
                        <p className="text-xs text-gray-500 mt-1">電話：{elder.phone}</p>
                      )}
                    </div>
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 設備健康狀況 */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">設備健康狀況</h3>
          
          <div className="space-y-3">
            {/* 低電量預警 */}
            <div className={`p-4 rounded-lg ${stats.lowBatteryDevices > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">低電量預警（少於20%）</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.lowBatteryDevices}</p>
                </div>
                <AlertTriangle className={`w-6 h-6 ${stats.lowBatteryDevices > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
              </div>
            </div>

            {/* 離線設備 */}
            <div className={`p-4 rounded-lg ${stats.offlineDevices > 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">離線設備（超過24小時）</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.offlineDevices}</p>
                </div>
                <AlertTriangle className={`w-6 h-6 ${stats.offlineDevices > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
            </div>

            {/* 未綁定設備 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">未綁定設備庫存</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.devicesUnbound}</p>
                </div>
                <Smartphone className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 活動統計 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 熱門點位 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">熱門點位（近7天）</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          
          {hotspots.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">暫無資料</p>
            </div>
          ) : (
            <div className="space-y-2">
              {hotspots.slice(0, 5).map((spot, index) => (
                <div
                  key={spot.gatewayId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{spot.gatewayName}</p>
                      {spot.gatewayLocation && (
                        <p className="text-xs text-gray-500">{spot.gatewayLocation}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{spot.count}</p>
                    <p className="text-xs text-gray-500">次感應</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 活動趨勢 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">活動趨勢</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {/* 24小時活動 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">近24小時</span>
                <span className="text-lg font-bold text-gray-900">{stats.activitiesLast24h} 次</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (stats.activitiesLast24h / Math.max(stats.activitiesLast7d, 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* 7天活動 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">近7天</span>
                <span className="text-lg font-bold text-gray-900">{stats.activitiesLast7d} 次</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* 平均每日活動 */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">平均每日活動</span>
                <span className="text-lg font-bold text-primary-600">
                  {Math.round(stats.activitiesLast7d / 7)} 次
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 通知點狀態 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">通知點狀態</h3>
          <MapPin className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-primary-50 rounded-lg">
            <p className="text-sm text-primary-800">啟用通知點</p>
            <p className="text-2xl font-bold text-primary-600 mt-2">{stats.notificationPointsActive}</p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">今日通知</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{stats.notificationsToday}</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">本週通知</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{stats.notificationsThisWeek}</p>
          </div>
        </div>
      </div>

      {/* 重新整理提示 */}
      <div className="flex justify-center">
        <button
          onClick={loadDashboardData}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          重新整理資料
        </button>
      </div>
    </div>
  );
};
