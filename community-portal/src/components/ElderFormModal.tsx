import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { elderService } from '../services/elderService';
import { useAuth } from '../hooks/useAuth';
import type { Elder, Device, ElderStatus } from '../types';

interface ElderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingElder?: Elder | null;
}

export const ElderFormModal = ({ isOpen, onClose, onSuccess, editingElder }: ElderFormModalProps) => {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    gender: '' as 'MALE' | 'FEMALE' | 'OTHER' | '',
    age: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: '',
    status: 'ACTIVE' as ElderStatus,
    deviceId: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (editingElder) {
        // 編輯模式：填入現有資料
        setFormData({
          name: editingElder.name,
          gender: editingElder.gender || '',
          age: editingElder.age?.toString() || '',
          phone: editingElder.phone || '',
          address: editingElder.address || '',
          emergencyContact: editingElder.emergencyContact || '',
          emergencyPhone: editingElder.emergencyPhone || '',
          notes: editingElder.notes || '',
          status: editingElder.status,
          deviceId: editingElder.deviceId || '',
        });
      } else {
        // 新增模式：清空表單
        setFormData({
          name: '',
          gender: '',
          age: '',
          phone: '',
          address: '',
          emergencyContact: '',
          emergencyPhone: '',
          notes: '',
          status: 'ACTIVE',
          deviceId: '',
        });
      }
      
      // 載入可用設備
      loadAvailableDevices();
    }
  }, [isOpen, editingElder]);

  const loadAvailableDevices = async () => {
    if (!tenantId) return;
    
    try {
      setLoadingDevices(true);
      const response = await elderService.getAvailableDevices(tenantId);
      let devices = response.data as Device[];
      
      // 如果是編輯模式且長者有綁定設備，確保當前設備也在列表中
      if (editingElder && editingElder.device) {
        const currentDevice = editingElder.device;
        const currentDeviceInList = devices.find(d => d.id === currentDevice.id);
        
        if (!currentDeviceInList) {
          // 當前設備不在未綁定列表中（因為它已綁定），手動添加
          devices = [currentDevice, ...devices];
        }
      }
      
      setAvailableDevices(devices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantId) {
      alert('找不到社區資訊');
      return;
    }

    try {
      setLoading(true);
      
      const data: any = {
        tenantId,
        name: formData.name,
        status: formData.status,
        inactiveThresholdHours: 24,
        isActive: true,
      };

      if (formData.gender) data.gender = formData.gender;
      if (formData.age) data.age = parseInt(formData.age);
      if (formData.phone) data.phone = formData.phone;
      if (formData.address) data.address = formData.address;
      if (formData.emergencyContact) data.emergencyContact = formData.emergencyContact;
      if (formData.emergencyPhone) data.emergencyPhone = formData.emergencyPhone;
      if (formData.notes) data.notes = formData.notes;

      if (editingElder) {
        // 編輯模式
        await elderService.update(editingElder.id, data);
        
        // 處理設備綁定變更
        const oldDeviceId = editingElder.deviceId;
        const newDeviceId = formData.deviceId;
        
        if (oldDeviceId !== newDeviceId) {
          // 解綁舊設備
          if (oldDeviceId) {
            try {
              await elderService.unbindDevice(editingElder.id, oldDeviceId);
            } catch (error) {
              console.error('Failed to unbind old device:', error);
            }
          }
          
          // 綁定新設備
          if (newDeviceId) {
            try {
              await elderService.bindDevice(editingElder.id, newDeviceId);
            } catch (error) {
              console.error('Failed to bind new device:', error);
              alert('長者更新成功，但設備綁定失敗');
            }
          }
        }
        
      } else {
        // 新增模式
        const response = await elderService.create(data);
        const elderId = response.data?.id;
        
        if (!elderId) {
          throw new Error('建立長者失敗');
        }

        // 如果有選擇設備，進行綁定
        if (formData.deviceId) {
          try {
            await elderService.bindDevice(elderId, formData.deviceId);
          } catch (error) {
            console.error('Failed to bind device:', error);
            alert('長者建立成功，但設備綁定失敗');
          }
        }
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save elder:', error);
      alert(editingElder ? '更新長者失敗' : '新增長者失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingElder ? '編輯長者' : '新增長者'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="label">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              className="input"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Gender & Age */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="gender" className="label">性別</label>
              <select
                id="gender"
                className="input"
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                disabled={loading}
              >
                <option value="">請選擇</option>
                <option value="MALE">男</option>
                <option value="FEMALE">女</option>
                <option value="OTHER">其他</option>
              </select>
            </div>

            <div>
              <label htmlFor="age" className="label">年齡</label>
              <input
                type="number"
                id="age"
                min="0"
                max="150"
                className="input"
                value={formData.age}
                onChange={(e) => handleChange('age', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="label">電話</label>
            <input
              type="tel"
              id="phone"
              className="input"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="label">地址</label>
            <input
              type="text"
              id="address"
              className="input"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="emergencyContact" className="label">
                緊急聯絡人
              </label>
              <input
                type="text"
                id="emergencyContact"
                className="input"
                value={formData.emergencyContact}
                onChange={(e) => handleChange('emergencyContact', e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="emergencyPhone" className="label">
                緊急聯絡電話
              </label>
              <input
                type="tel"
                id="emergencyPhone"
                className="input"
                value={formData.emergencyPhone}
                onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="label">
              狀態 <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              required
              className="input"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              disabled={loading}
            >
              <option value="ACTIVE">正常</option>
              <option value="INACTIVE">不活躍</option>
              <option value="HOSPITALIZED">住院</option>
              <option value="DECEASED">已故</option>
              <option value="MOVED_OUT">遷出</option>
            </select>
          </div>

          {/* Device Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="deviceId" className="label">
                綁定設備（選填）
              </label>
              <button
                type="button"
                onClick={loadAvailableDevices}
                disabled={loadingDevices}
                className="text-xs text-primary-600 hover:text-primary-800 disabled:text-gray-400"
              >
                {loadingDevices ? '載入中...' : '重新整理'}
              </button>
            </div>
            <select
              id="deviceId"
              className="input"
              value={formData.deviceId}
              onChange={(e) => handleChange('deviceId', e.target.value)}
              disabled={loading || loadingDevices}
            >
              <option value="">不綁定設備</option>
              {availableDevices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.deviceName || `設備 ${device.minor}`} | 
                  UUID: {device.uuid.substring(0, 8)}... | 
                  {device.major}/{device.minor}
                  {device.batteryLevel ? ` | 電量: ${device.batteryLevel}%` : ''}
                  {device.id === editingElder?.deviceId ? ' (當前)' : ''}
                </option>
              ))}
            </select>
            {availableDevices.length === 0 && !loadingDevices && (
              <p className="text-xs text-orange-600 mt-1">
                目前沒有可用的設備
              </p>
            )}
            {availableDevices.length > 0 && (
              <p className="text-xs text-green-600 mt-1">
                {availableDevices.length} 個可用設備
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="label">備註</label>
            <textarea
              id="notes"
              rows={3}
              className="input"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '處理中...' : (editingElder ? '更新' : '新增')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
