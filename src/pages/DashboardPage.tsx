import { useEffect, useState } from 'react';
import { Users, Building2, Smartphone, Radio, Bell, Activity } from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import type { DashboardStats } from '../types';

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response: any = await dashboardService.getOverview();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: '社區數量',
      value: stats?.tenants.total || 0,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      title: '長者總數',
      value: stats?.elders.total || 0,
      subValue: `${stats?.elders.active || 0} 位活躍`,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: '設備總數',
      value: stats?.devices.total || 0,
      icon: Smartphone,
      color: 'bg-purple-500',
    },
    {
      title: '接收點',
      value: stats?.gateways.total || 0,
      icon: Radio,
      color: 'bg-yellow-500',
    },
    {
      title: '待處理警報',
      value: stats?.alerts.pending || 0,
      subValue: `今日 ${stats?.alerts.today || 0} 筆`,
      icon: Bell,
      color: 'bg-red-500',
    },
    {
      title: '今日訊號',
      value: stats?.logs.today || 0,
      icon: Activity,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">系統總覽</h1>
        <p className="text-gray-600 mt-2">Safe-Net 社區守護者管理系統</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
                {stat.subValue && (
                  <p className="text-sm text-gray-500 mt-1">{stat.subValue}</p>
                )}
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Info */}
      <div className="mt-8 card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">系統資訊</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">API 狀態</span>
            <span className="text-green-600 font-medium">● 正常運行</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">資料庫</span>
            <span className="text-green-600 font-medium">● 已連接</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">版本</span>
            <span className="text-gray-900 font-medium">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
