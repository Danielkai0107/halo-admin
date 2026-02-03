import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Eye,
  Upload,
  Loader2,
  Users,
  Wifi,
  Store as StoreIconLucide,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { storeService } from "../services/storeService";
import { uploadStoreImage } from "../services/storageService";
import type { Store, ShopUser, Gateway } from "../types";
import { Modal } from "../components/Modal";

export const StoresPage = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [storeAdmins, setStoreAdmins] = useState<Record<string, ShopUser[]>>(
    {},
  );
  const [storeGateways, setStoreGateways] = useState<Record<string, Gateway[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const watchLogo = watch("storeLogo");
  const watchBanner = watch("imageLink");

  useEffect(() => {
    if (watchLogo) setLogoPreview(watchLogo);
  }, [watchLogo]);

  useEffect(() => {
    if (watchBanner) setBannerPreview(watchBanner);
  }, [watchBanner]);

  useEffect(() => {
    const unsubscribe = storeService.subscribe((data) => {
      setStores(data);
      setLoading(false);

      // 載入每個商店的管理員和 Gateway
      data.forEach(async (store) => {
        try {
          const adminsResponse = await storeService.getAdmins(store.id);
          setStoreAdmins((prev) => ({
            ...prev,
            [store.id]: adminsResponse.data,
          }));

          const gatewaysResponse = await storeService.getGateways(store.id);
          setStoreGateways((prev) => ({
            ...prev,
            [store.id]: gatewaysResponse.data,
          }));
        } catch (error) {
          console.error(`Failed to load data for store ${store.id}:`, error);
        }
      });
    });

    return () => unsubscribe();
  }, []);

  const handleCreate = () => {
    setEditingStore(null);
    reset({
      name: "",
      storeLogo: "",
      imageLink: "",
      websiteLink: "",
      activityTitle: "",
      activityContent: "",
      storePassword: "",
    });
    setLogoPreview("");
    setBannerPreview("");
    setShowModal(true);
  };

  const handleEdit = (store: Store, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingStore(store);
    reset({
      name: store.name ?? "",
      storeLogo: store.storeLogo ?? "",
      imageLink: store.imageLink ?? "",
      websiteLink: store.websiteLink ?? "",
      activityTitle: store.activityTitle ?? "",
      activityContent: store.activityContent ?? "",
      storePassword: "", // 編輯時不預填，留空表示不變，有輸入則更新
    });
    setLogoPreview(store.storeLogo || "");
    setBannerPreview(store.imageLink || "");
    setShowModal(true);
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
    try {
      // 只包含有值的欄位，避免 undefined 寫入 Firestore
      const payload: any = {
        name: data.name,
        adminIds: editingStore?.adminIds || [],
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
      // 商家密碼：有輸入才寫入；編輯時留空表示不變
      if (data.storePassword?.trim()) {
        payload.storePassword = data.storePassword.trim();
      }

      if (editingStore) {
        await storeService.update(editingStore.id, payload);
        alert("商店資訊已更新");
      } else {
        await storeService.create(payload);
        alert("商店已新增");
      }
      setShowModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "操作失敗");
    }
  };

  if (loading) {
    return <div className="text-center py-12">載入中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">商店管理</h2>
          <p className="text-sm text-gray-600 mt-1">
            管理商店資訊：名稱、logo、圖片、官網、活動標題與內容。可分配管理員和綁定
            Gateway。
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>新增商店</span>
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  商店名稱
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  店家 Logo
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  活動標題
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  管理員
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Gateway
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-24">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {stores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    尚無商店。請點擊「新增商店」建立第一個商店。
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr
                    key={store.id}
                    onClick={() => navigate(`/stores/${store.id}`)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <StoreIconLucide className="w-4 h-4 text-primary-500" />
                        {store.name || "-"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {store.storeLogo ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={store.storeLogo}
                            alt="Logo"
                            className="w-10 h-10 object-cover rounded border border-gray-200"
                          />
                          <a
                            href={store.storeLogo}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center text-primary-600 hover:underline text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            查看
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 max-w-[160px] truncate">
                      {store.activityTitle || "-"}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {storeAdmins[store.id] &&
                      storeAdmins[store.id].length > 0 ? (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="text-blue-700 font-medium">
                            {storeAdmins[store.id].length} 位
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">未分配</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {storeGateways[store.id] &&
                      storeGateways[store.id].length > 0 ? (
                        <div className="flex items-center gap-1">
                          <Wifi className="w-4 h-4 text-green-500" />
                          <span className="text-green-700 font-medium">
                            {storeGateways[store.id].length} 個
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">未綁定</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={(e) => handleEdit(store, e)}
                        className="text-primary-600 hover:text-primary-700 p-1"
                        title="編輯商店資訊"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          共 {stores.length} 個商店
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStore ? "編輯商店資訊" : "新增商店"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">
              商店名稱 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name", { required: "請填寫商店名稱" })}
              className="input"
              placeholder="例如：星巴克信義店、7-11光復門市"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">
                {(errors.name as { message?: string })?.message}
              </p>
            )}
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
            <div className="flex gap-2 items-center flex-wrap">
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
              <input
                {...register("storeLogo")}
                className="input flex-1 min-w-[200px]"
                placeholder="上傳後會顯示網址，或直接貼上圖片網址"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              建議尺寸：400x400 或更高（1:1 比例）
            </p>
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
            <div className="flex gap-2 items-center flex-wrap">
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
              <input
                {...register("imageLink")}
                className="input flex-1 min-w-[200px]"
                placeholder="上傳後會顯示網址，或直接貼上圖片網址"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              建議尺寸：1200x400 或更高（3:1 比例）
            </p>
          </div>

          <div>
            <label className="label">官網連結</label>
            <input
              {...register("websiteLink")}
              className="input"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="label">活動標題</label>
            <input
              {...register("activityTitle")}
              className="input"
              placeholder="活動標題"
            />
          </div>

          <div>
            <label className="label">活動內容</label>
            <textarea
              {...register("activityContent")}
              className="input min-h-[80px]"
              placeholder="活動說明文字"
              rows={3}
            />
          </div>

          <div>
            <label className="label">商家密碼（選填）</label>
            <input
              type="password"
              {...register("storePassword")}
              className="input"
              placeholder={
                editingStore ? "留空表示不變" : "供商家簡單登入驗證用"
              }
              autoComplete="new-password"
            />
            <p className="text-xs text-gray-500 mt-1">
              供商家之後以簡單登入驗證用，選填。編輯時留空則不變更原密碼。
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              取消
            </button>
            <button type="submit" className="btn-primary">
              {editingStore ? "更新" : "新增"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
