import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Phone, Edit, Trash2, Clock, Search } from 'lucide-react';
import { elderService } from '../../services/elderService';
import { deviceService } from '../../services/deviceService';
import { useAuth } from '../../hooks/useAuth';
import { ElderFormModal } from '../../components/ElderFormModal';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { Elder, Device } from '../../types';

export const ElderListScreen = () => {
  const navigate = useNavigate();
  const { tenantId, isAdmin } = useAuth();
  const [elders, setElders] = useState<Elder[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingElder, setEditingElder] = useState<Elder | null>(null);
  const [deletingElder, setDeletingElder] = useState<Elder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 合併長者和設備資料
  const enrichedElders = useMemo(() => {
    return elders.map((elder) => {
      const device = devices.find(
        (d) => d.bindingType === 'ELDER' && d.boundTo === elder.id
      );
      return {
        ...elder,
        device,
      };
    });
  }, [elders, devices]);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    
    // 訂閱長者列表
    const unsubscribeElders = elderService.subscribe(tenantId, (data) => {
      setElders(data);
      setLoading(false);
    });

    // 訂閱設備列表
    const unsubscribeDevices = deviceService.subscribe(tenantId, (data) => {
      setDevices(data);
    });

    return () => {
      unsubscribeElders();
      unsubscribeDevices();
    };
  }, [tenantId]);

  const handleAdd = () => {
    setEditingElder(null);
    setShowModal(true);
  };

  const handleEdit = (elder: Elder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingElder(elder);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingElder) return;
    
    try {
      await elderService.delete(deletingElder.id);
      setDeletingElder(null);
    } catch (error) {
      console.error('Failed to delete elder:', error);
      alert('刪除失敗');
    }
  };

  const handleSuccess = () => {
    // Modal 會自動重新載入資料（因為使用 subscribe）
  };

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

  // 搜尋過濾（使用 enrichedElders）
  const filteredElders = enrichedElders.filter(elder => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      elder.name?.toLowerCase().includes(search) ||
      elder.phone?.toLowerCase().includes(search) ||
      elder.address?.toLowerCase().includes(search)
    );
  });

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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">長者管理</h2>
          <p className="text-sm text-gray-600 mt-1">總共 {enrichedElders.length} 位長者</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            <span>新增長者</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="搜尋長者姓名、電話、地址..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Elders Table */}
      <div className="card">
        {filteredElders.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500">
              {searchTerm ? '找不到符合的長者' : '暫無長者資料'}
            </p>
            {isAdmin && !searchTerm && (
              <button
                onClick={handleAdd}
                className="mt-4 btn btn-primary"
              >
                新增第一位長者
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    長者
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    聯絡方式
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    設備狀態
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    狀態
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    最後活動
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredElders.map((elder) => (
                  <tr
                    key={elder.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('button')) {
                        return;
                      }
                      navigate(`/elders/${elder.id}`);
                    }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        {elder.photo ? (
                          <img
                            src={elder.photo}
                            alt={elder.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {elder.name}
                          </div>
                          {(elder.gender || elder.age) && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              {elder.gender && (
                                <span>
                                  {elder.gender === 'MALE'
                                    ? '男'
                                    : elder.gender === 'FEMALE'
                                      ? '女'
                                      : '其他'}
                                </span>
                              )}
                              {elder.gender && elder.age && <span>·</span>}
                              {elder.age && <span>{elder.age}歲</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {elder.phone ? (
                        <div className="flex items-center space-x-1 text-gray-700">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{elder.phone}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {elder.device ? (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            已綁定
                          </span>
                          {elder.device.deviceName && (
                            <code className="text-xs font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                              {elder.device.deviceName}
                            </code>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          未綁定
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(elder.status)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {elder.lastActivityAt ? (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">
                            {formatDistanceToNow(new Date(elder.lastActivityAt), {
                              addSuffix: true,
                              locale: zhTW,
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">無記錄</span>
                      )}
                    </td>
                    <td
                      className="py-3 px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isAdmin && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => handleEdit(elder, e)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            title="編輯"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingElder(elder)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                            title="刪除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Elder Form Modal */}
      <ElderFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
        editingElder={editingElder}
      />

      {/* Delete Confirmation */}
      {deletingElder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">確認刪除</h3>
            <p className="text-gray-600 mb-6">
              確定要刪除長者「{deletingElder.name}」嗎？此操作無法復原。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeletingElder(null)}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
