import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Upload,
  Loader2,
  UserPlus,
  Wifi,
  Trash2,
  Users,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { storeService } from "../services/storeService";
import { shopUserService } from "../services/shopUserService";
import { uploadStoreImage } from "../services/storageService";
import type { Store, ShopUser, Gateway } from "../types";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";

export const StoreDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [admins, setAdmins] = useState<ShopUser[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [availableAdmins, setAvailableAdmins] = useState<ShopUser[]>([]);
  const [availableGateways, setAvailableGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showAddGatewayModal, setShowAddGatewayModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [removingAdmin, setRemovingAdmin] = useState<ShopUser | null>(null);
  const [removingGateway, setRemovingGateway] = useState<Gateway | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const watchLogo = watch("storeLogo");
  const watchBanner = watch("imageLink");

  useEffect(() => {
    if (!id) return;
    const unsubscribe = storeService.subscribeToOne(id, (data) => {
      if (data) {
        setStore(data);
        setLogoPreview(data.storeLogo || "");
        setBannerPreview(data.imageLink || "");
        reset({
          name: data.name ?? "",
          storeLogo: data.storeLogo ?? "",
          imageLink: data.imageLink ?? "",
          websiteLink: data.websiteLink ?? "",
          activityTitle: data.activityTitle ?? "",
          activityContent: data.activityContent ?? "",
          storePassword: "",
        });

        // 載入管理員和 Gateway
        loadAdminsAndGateways(data.id);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id, reset]);

  useEffect(() => {
    if (watchLogo) setLogoPreview(watchLogo);
  }, [watchLogo]);

  useEffect(() => {
    if (watchBanner) setBannerPreview(watchBanner);
  }, [watchBanner]);

  const loadAdminsAndGateways = async (storeId: string) => {
    try {
      const adminsResponse = await storeService.getAdmins(storeId);
      setAdmins(adminsResponse.data);

      const gatewaysResponse = await storeService.getGateways(storeId);
      setGateways(gatewaysResponse.data);
    } catch (error) {
      console.error("Failed to load admins and gateways:", error);
    }
  };

  const loadAvailableAdmins = async () => {
    try {
      const response = await shopUserService.getUnassigned();
      setAvailableAdmins(response.data);
    } catch (error) {
      console.error("Failed to load available admins:", error);
    }
  };

  const loadAvailableGateways = async () => {
    try {
      const response = await storeService.getUnassignedGateways();
      setAvailableGateways(response.data);
    } catch (error) {
      console.error("Failed to load available gateways:", error);
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      alert("請選擇圖片檔案（jpg、png、gif、webp 等）");
      return;
    }
    setUploadingLogo(true);
    try {
      const url = await uploadStoreImage(file, "logos");
      setValue("storeLogo", url);
      setLogoPreview(url);
    } catch (err: any) {
      alert(err?.message || "店家 Logo 上傳失敗");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      alert("請選擇圖片檔案（jpg、png、gif、webp 等）");
      return;
    }
    setUploadingImage(true);
    try {
      const url = await uploadStoreImage(file, "images");
      setValue("imageLink", url);
      setBannerPreview(url);
    } catch (err: any) {
      alert(err?.message || "圖片上傳失敗");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const onSubmit = async (data: Record<string, string>) => {
    if (!id) return;

    try {
      const payload: any = {
        name: data.name,
      };

      if (data.storeLogo?.trim()) {
        payload.storeLogo = data.storeLogo.trim();
      }
      if (data.imageLink?.trim()) {
        payload.imageLink = data.imageLink.trim();
      }
      if (data.websiteLink?.trim()) {
        payload.websiteLink = data.websiteLink.trim();
      }
      if (data.activityTitle?.trim()) {
        payload.activityTitle = data.activityTitle.trim();
      }
      if (data.activityContent?.trim()) {
        payload.activityContent = data.activityContent.trim();
      }
      if (data.storePassword?.trim()) {
        payload.storePassword = data.storePassword.trim();
      }

      await storeService.update(id, payload);
      alert("商店資訊已更新");
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || "更新失敗");
    }
  };

  const handleAddAdmin = async () => {
    if (!id || !selectedAdmin) {
      alert("請選擇管理員");
      return;
    }

    try {
      await storeService.assignAdmin(id, selectedAdmin);
      alert("管理員已分配");
      setShowAddAdminModal(false);
      setSelectedAdmin("");
      await loadAdminsAndGateways(id);
    } catch (error: any) {
      alert(error.message || "分配失敗");
    }
  };

  const handleRemoveAdmin = async () => {
    if (!id || !removingAdmin) return;

    try {
      await storeService.removeAdmin(id, removingAdmin.id);
      alert("管理員已移除");
      setRemovingAdmin(null);
      await loadAdminsAndGateways(id);
    } catch (error: any) {
      alert(error.message || "移除失敗");
    }
  };

  const handleAddGateway = async () => {
    if (!id || !selectedGateway) {
      alert("請選擇 Gateway");
      return;
    }

    try {
      await storeService.assignGateway(id, selectedGateway);
      alert("Gateway 已綁定");
      setShowAddGatewayModal(false);
      setSelectedGateway("");
      await loadAdminsAndGateways(id);
    } catch (error: any) {
      alert(error.message || "綁定失敗");
    }
  };

  const handleRemoveGateway = async () => {
    if (!removingGateway) return;

    try {
      await storeService.removeGateway(removingGateway.id);
      alert("Gateway 已解綁");
      setRemovingGateway(null);
      if (id) {
        await loadAdminsAndGateways(id);
      }
    } catch (error: any) {
      alert(error.message || "解綁失敗");
    }
  };

  if (loading) {
    return <div className="text-center py-12">載入中...</div>;
  }

  if (!store) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">商店不存在</p>
        <button
          onClick={() => navigate("/stores")}
          className="mt-4 btn-secondary"
        >
          返回商店列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/stores")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{store.name}</h2>
            <p className="text-sm text-gray-600 mt-1">商店詳細資訊</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>編輯</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
                className="btn-secondary flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>取消</span>
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>儲存</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Store Info */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">基本資訊</h3>
        <form className="space-y-4">
          <div>
            <label className="label">商店名稱</label>
            <input
              {...register("name", { required: true })}
              className="input"
              disabled={!isEditing}
            />
          </div>

          <div>
            <label className="label">店家 Logo (建議 1:1 比例)</label>
            {logoPreview && (
              <div className="mb-3">
                <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            {isEditing && (
              <div className="flex gap-2 items-center flex-wrap mb-2">
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadLogo}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="btn-secondary flex items-center gap-2 shrink-0"
                >
                  {uploadingLogo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  上傳圖片
                </button>
              </div>
            )}
            <input
              {...register("storeLogo")}
              className="input"
              disabled={!isEditing}
              placeholder="圖片網址"
            />
          </div>

          <div>
            <label className="label">店家 Banner (建議 3:1 比例)</label>
            {bannerPreview && (
              <div className="mb-3">
                <div className="relative w-full max-w-md h-32 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                  <img
                    src={bannerPreview}
                    alt="Banner Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            {isEditing && (
              <div className="flex gap-2 items-center flex-wrap mb-2">
                <input
                  type="file"
                  ref={imageInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadImage}
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="btn-secondary flex items-center gap-2 shrink-0"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  上傳圖片
                </button>
              </div>
            )}
            <input
              {...register("imageLink")}
              className="input"
              disabled={!isEditing}
              placeholder="圖片網址"
            />
          </div>

          <div>
            <label className="label">官網連結</label>
            <input
              {...register("websiteLink")}
              className="input"
              disabled={!isEditing}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="label">活動標題</label>
            <input
              {...register("activityTitle")}
              className="input"
              disabled={!isEditing}
            />
          </div>

          <div>
            <label className="label">活動內容</label>
            <textarea
              {...register("activityContent")}
              className="input min-h-[80px]"
              disabled={!isEditing}
              rows={3}
            />
          </div>

          {isEditing && (
            <div>
              <label className="label">商家密碼（留空表示不變）</label>
              <input
                type="password"
                {...register("storePassword")}
                className="input"
                placeholder="留空表示不變更"
                autoComplete="new-password"
              />
            </div>
          )}
        </form>
      </div>

      {/* Admins Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            管理員 ({admins.length})
          </h3>
          <button
            onClick={() => {
              loadAvailableAdmins();
              setShowAddAdminModal(true);
            }}
            className="btn-secondary flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>分配管理員</span>
          </button>
        </div>

        {admins.length === 0 ? (
          <p className="text-gray-500 text-center py-4">尚未分配管理員</p>
        ) : (
          <div className="space-y-2">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{admin.name}</p>
                  <p className="text-sm text-gray-600">{admin.email}</p>
                </div>
                <button
                  onClick={() => setRemovingAdmin(admin)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gateways Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            綁定的 Gateway ({gateways.length})
          </h3>
          <button
            onClick={() => {
              loadAvailableGateways();
              setShowAddGatewayModal(true);
            }}
            className="btn-secondary flex items-center space-x-2"
          >
            <Wifi className="w-4 h-4" />
            <span>綁定 Gateway</span>
          </button>
        </div>

        {gateways.length === 0 ? (
          <p className="text-gray-500 text-center py-4">尚未綁定 Gateway</p>
        ) : (
          <div className="space-y-2">
            {gateways.map((gateway) => (
              <div
                key={gateway.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{gateway.name}</p>
                  <p className="text-sm text-gray-600">
                    {gateway.serialNumber}
                  </p>
                </div>
                <button
                  onClick={() => setRemovingGateway(gateway)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      <Modal
        isOpen={showAddAdminModal}
        onClose={() => setShowAddAdminModal(false)}
        title="分配管理員"
      >
        <div className="space-y-4">
          <div>
            <label className="label">選擇管理員</label>
            <select
              value={selectedAdmin}
              onChange={(e) => setSelectedAdmin(e.target.value)}
              className="input"
            >
              <option value="">請選擇...</option>
              {availableAdmins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name} ({admin.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowAddAdminModal(false)}
              className="btn-secondary"
            >
              取消
            </button>
            <button onClick={handleAddAdmin} className="btn-primary">
              確認
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Gateway Modal */}
      <Modal
        isOpen={showAddGatewayModal}
        onClose={() => setShowAddGatewayModal(false)}
        title="綁定 Gateway"
      >
        <div className="space-y-4">
          <div>
            <label className="label">選擇 Gateway</label>
            <select
              value={selectedGateway}
              onChange={(e) => setSelectedGateway(e.target.value)}
              className="input"
            >
              <option value="">請選擇...</option>
              {availableGateways.map((gateway) => (
                <option key={gateway.id} value={gateway.id}>
                  {gateway.name} ({gateway.serialNumber})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowAddGatewayModal(false)}
              className="btn-secondary"
            >
              取消
            </button>
            <button onClick={handleAddGateway} className="btn-primary">
              確認
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={!!removingAdmin}
        onClose={() => setRemovingAdmin(null)}
        onConfirm={handleRemoveAdmin}
        title="確認移除"
        message={`確定要移除「${removingAdmin?.name}」的管理員權限嗎？`}
        confirmText="移除"
        type="danger"
      />

      <ConfirmDialog
        isOpen={!!removingGateway}
        onClose={() => setRemovingGateway(null)}
        onConfirm={handleRemoveGateway}
        title="確認解綁"
        message={`確定要解除「${removingGateway?.name}」的綁定嗎？`}
        confirmText="解綁"
        type="danger"
      />
    </div>
  );
};
