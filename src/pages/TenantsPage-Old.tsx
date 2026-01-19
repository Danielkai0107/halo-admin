import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { tenantService } from '../services/tenantService';
import type { Tenant } from '../types';

export const TenantsPage = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadTenants();
  }, [page]);

  const loadTenants = async () => {
    try {
      const response: any = await tenantService.getAll(page, 10);
      setTenants(response.data.data);
      setTotal(response.data.meta.total);
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">載入中...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">社區管理</h1>
          <p className="text-gray-600 mt-1">管理所有社區資料</p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>新增社區</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋社區..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Tenants List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  社區代碼
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  名稱
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  聯絡人
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  電話
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  狀態
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-mono">{tenant.code}</td>
                  <td className="py-3 px-4 text-sm font-medium">{tenant.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {tenant.contactPerson || '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {tenant.contactPhone || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tenant.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {tenant.isActive ? '啟用' : '停用'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      查看詳情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-gray-600">總共 {total} 個社區</p>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              上一頁
            </button>
            <span className="px-3 py-1">第 {page} 頁</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * 10 >= total}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              下一頁
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
