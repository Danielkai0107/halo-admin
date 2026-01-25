# MAP_APP_API_ENDPOINTS.md 更新日誌

**更新日期：** 2026-01-21  
**更新原因：** 配合裝置綁定架構重整（bindingType + boundTo 統一架構）

---

## 📝 主要修正內容

### 1. 文檔開頭新增架構更新通知

新增了醒目的架構更新說明，告知讀者系統已完成重大架構變更。

### 2. 設備綁定條件更新（bindDeviceToMapUser API）

**修正前：**
- 設備必須標記為 `poolType: "PUBLIC"`
- 設備不可已綁定給老人系統（`elderId` 必須為 null）
- 暱稱和年齡存在用戶資料中

**修正後：**
- 設備必須為未綁定狀態（`bindingType: "UNBOUND"`）
- 設備不可已綁定給老人系統（`bindingType: "ELDER"`）
- 暱稱和年齡存在設備資料中（`mapUserNickname`, `mapUserAge`）

### 3. 接收點資料範例更新（getPublicGateways API）

**移除欄位：**
- ❌ `poolType`（Gateway 已不使用此欄位）

**保留欄位：**
- ✅ `tenantId`（標記接收點所屬社區，但不影響可見性）
- ✅ `type`（接收點類型：GENERAL, BOUNDARY, MOBILE）

### 4. 錯誤訊息更新

**移除：**
- ❌ `"Device is not available in public pool (poolType must be PUBLIC)"`

**保留/更新：**
- ✅ `"Device is already bound to an elder in the tenant system"`（現在檢查 bindingType）
- ✅ `"Device is already bound to another map app user"`（現在檢查 bindingType）

### 5. 活動記錄 API 說明更新（getMapUserActivities）

**新增架構說明：**
- 活動記錄統一儲存在 `devices/{deviceId}/activities` 子集合
- 記錄包含當時的綁定狀態和通知類型

**回應範例新增欄位：**
```json
{
  "bindingType": "MAP_USER",
  "boundTo": "firebase_uid_123",
  "notificationType": "FCM",
  "notificationDetails": {...}
}
```

### 6. 資料結構與隔離章節重寫

**新增內容：**

#### Device Collection 結構範例
完整展示新的裝置資料結構，包含：
- `bindingType`, `boundTo`, `boundAt`
- `mapUserNickname`, `mapUserAge`
- `tags`（取代 tenantId）

#### 活動記錄結構範例
展示 `devices/{deviceId}/activities` 子集合的資料結構。

#### 綁定類型說明
- `"ELDER"`: 綁定給長者，LINE 通知
- `"MAP_USER"`: 綁定給 APP 用戶，FCM 推播
- `"UNBOUND"`: 未綁定，只記錄活動

### 7. 共用 API 說明更新（receiveBeaconData）

**修正前：**
- 已擴充支援地圖用戶，同時保持原有功能

**修正後：**
- 統一處理所有裝置的 beacon 資料
- 根據 `bindingType` 自動決定通知方式
- 所有活動統一記錄在 `devices/{deviceId}/activities` 子集合

### 8. Collections 說明更新

**移除：**
- ❌ `mapUserActivities`（已不使用，改用裝置子集合）

**新增/保留：**
- ✅ `mapAppUsers`（簡化，移除 nickname/age 欄位）
- ✅ `mapUserNotificationPoints`（不變）
- ✅ `devices/{deviceId}/activities`（新增，統一記錄）

### 9. 版本號更新

**修正前：** 1.0.0  
**修正後：** 2.0.0（主要版本升級，反映重大架構變更）

---

## 🎯 文檔現狀

### 完全更新的章節
- ✅ 設備綁定條件說明
- ✅ 暱稱和年齡存儲位置
- ✅ 接收點資料範例
- ✅ 錯誤訊息列表
- ✅ 活動記錄結構
- ✅ 資料結構與隔離
- ✅ 共用 API 說明
- ✅ 版本號

### 保持不變的章節
- ✅ 認證方式
- ✅ API 端點列表和 URL
- ✅ 請求格式
- ✅ 推播通知格式
- ✅ 錯誤碼說明
- ✅ API 摘要表

---

## 📊 與程式碼的對應關係

| 文檔描述 | 對應程式碼 | 檔案 |
|---------|-----------|------|
| bindingType | Device.bindingType | `src/types/index.ts` |
| boundTo | Device.boundTo | `src/types/index.ts` |
| mapUserNickname | Device.mapUserNickname | `src/types/index.ts` |
| mapUserAge | Device.mapUserAge | `src/types/index.ts` |
| tags | Device.tags | `src/types/index.ts` |
| activities 子集合 | devices/{deviceId}/activities | `functions/src/beacon/receiveBeaconData.ts` |
| 綁定 API | bindDeviceToMapUser | `functions/src/mapApp/deviceBinding.ts` |
| 解綁 API | unbindDeviceFromMapUser | `functions/src/mapApp/deviceBinding.ts` |

---

## ✅ 確認事項

- [x] 所有舊欄位名稱已更新為新架構
- [x] 範例資料反映新的資料結構
- [x] 錯誤訊息對應新的檢查邏輯
- [x] 版本號已升級（1.0.0 → 2.0.0）
- [x] 架構更新通知已加入文檔開頭
- [x] 無 Markdown linter 錯誤

---

**更新者：** AI Assistant  
**更新日期：** 2026-01-21  
**對應計劃：** 裝置綁定架構重整
