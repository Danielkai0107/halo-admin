import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { elderService } from '../../services/elderService';
import { useAuth } from '../../hooks/useAuth';
import { useTenantStore } from '../../store/tenantStore';
import type { Elder } from '../../types';

interface ElderFormData extends Partial<Elder> {
  deviceId?: string;
}

export const AddElderScreen = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAuth();
  const tenant = useTenantStore(state => state.selectedTenant);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<ElderFormData>();

  useEffect(() => {
    // 等待認證完成
    if (isLoading) return;
    
    // 只有管理員可以訪問
    if (!isAdmin) {
      window.alert('只有管理員可以新增長輩');
      navigate('/elders');
      return;
    }

    if (tenant) {
      loadAvailableDevices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, isAdmin, isLoading]);

  const loadAvailableDevices = async () => {
    if (!tenant) return;
    
    try {
      const response = await elderService.getAvailableDevices(tenant.id);
      setAvailableDevices(response.data || []);
    } catch (error) {
      console.error('Failed to load available devices:', error);
    }
  };

  const onSubmit = async (data: ElderFormData) => {
    if (!tenant) return;

    setSubmitting(true);
    try {
      await elderService.create({
        ...data,
        tenantId: tenant.id,
      });
      window.alert('新增長者成功！');
      navigate('/elders');
    } catch (error: any) {
      console.error('Failed to create elder:', error);
      window.alert('新增失敗：' + (error.message || '未知錯誤'));
    } finally {
      setSubmitting(false);
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
        <h2 className="text-2xl font-bold text-gray-900">新增長輩</h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div>
            <label className="label">姓名 *</label>
            <input
              {...register('name', { required: '請輸入姓名' })}
              className="input"
              placeholder="陳阿公"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="label">性別</label>
            <select {...register('gender')} className="input">
              <option value="">請選擇</option>
              <option value="MALE">男</option>
              <option value="FEMALE">女</option>
              <option value="OTHER">其他</option>
            </select>
          </div>

          <div>
            <label className="label">出生日期</label>
            <input
              type="date"
              {...register('birthDate')}
              className="input"
            />
          </div>

          <div>
            <label className="label">年齡</label>
            <input
              type="number"
              {...register('age')}
              className="input"
              placeholder="65"
              min="0"
              max="150"
            />
            <p className="text-xs text-gray-500 mt-1">或填寫出生日期</p>
          </div>

          <div>
            <label className="label">照片網址</label>
            <input
              type="url"
              {...register('photo')}
              className="input"
              placeholder="https://example.com/photo.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">輸入照片的網址（URL）</p>
          </div>

          <div>
            <label className="label">電話</label>
            <input
              type="tel"
              {...register('phone')}
              className="input"
              placeholder="0912-345-678"
            />
          </div>

          <div>
            <label className="label">地址</label>
            <input
              {...register('address')}
              className="input"
              placeholder="社區 A 棟 3 樓"
            />
          </div>

          <div>
            <label className="label">緊急聯絡人</label>
            <input
              {...register('emergencyContact')}
              className="input"
              placeholder="家屬姓名"
            />
          </div>

          <div>
            <label className="label">緊急聯絡電話</label>
            <input
              type="tel"
              {...register('emergencyPhone')}
              className="input"
              placeholder="0912-345-678"
            />
          </div>

          <div>
            <label className="label">狀態</label>
            <select {...register('status')} className="input">
              <option value="ACTIVE">正常</option>
              <option value="INACTIVE">不活躍</option>
              <option value="HOSPITALIZED">住院</option>
              <option value="DECEASED">已故</option>
              <option value="MOVED_OUT">遷出</option>
            </select>
          </div>

          <div>
            <label className="label">不活躍警報閾值（小時）</label>
            <input
              type="number"
              {...register('inactiveThresholdHours')}
              className="input"
              placeholder="24"
              defaultValue={24}
            />
          </div>

          <div>
            <label className="label">關聯設備（可選）</label>
            <select {...register('deviceId')} className="input">
              <option value="">暫不關聯設備</option>
              {availableDevices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.deviceName || device.uuid || device.macAddress}
                  {device.batteryLevel ? ` - 電量 ${device.batteryLevel}%` : ''}
                </option>
              ))}
            </select>
            {availableDevices.length === 0 && (
              <p className="text-xs text-orange-600 mt-1">
                此社區尚無可用設備
              </p>
            )}
          </div>

          <div>
            <label className="label">備註</label>
            <textarea
              {...register('notes')}
              className="input"
              rows={3}
              placeholder="特殊注意事項..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => navigate('/elders')}
            className="flex-1 btn-secondary"
            disabled={submitting}
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 btn-primary"
            disabled={submitting}
          >
            {submitting ? '新增中...' : '新增'}
          </button>
        </div>
      </form>
    </div>
  );
};
