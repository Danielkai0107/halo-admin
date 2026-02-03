# Store 架構重構完成報告

## 概述

成功將商店（Store）從 Gateway 實體中獨立出來，並新增商店管理員（ShopUser）系統。現在商店可以獨立管理，並可分配管理員和綁定多個 Gateway。

---

## 架構變更

### 舊架構

```
Gateway (isAD: true) = 商店
  ├── 包含商店資訊（storeLogo, imageLink, etc.）
  └── 一對一關係
```

### 新架構

```
Store（獨立實體）
  ├── 基本資訊（name, logo, banner, 活動內容）
  ├── 管理員（adminIds[] -> shop_users）
  └── 綁定的 Gateway（多個 Gateway 可綁定同一個 Store）

ShopUser（商店管理員）
  ├── Firebase Auth 認證
  └── 可被分配到多個 Store
```

---

## 新增的 Firestore Collections

### 1. `stores` Collection

```typescript
{
  id: string;
  name: string;                    // 商店名稱
  storeLogo?: string;              // Logo 圖片
  imageLink?: string;              // Banner 圖片（3:1）
  websiteLink?: string;            // 官網連結
  activityTitle?: string;          // 活動標題
  activityContent?: string;        // 活動內容
  storePassword?: string;          // 商家密碼（向後相容）
  adminIds: string[];              // 管理員 ID 陣列
  isActive: boolean;
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

### 2. `shop_users` Collection

```typescript
{
  id: string;
  firebaseUid: string;             // Firebase Auth UID
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'OWNER' | 'STAFF';         // 店主 或 員工
  isActive: boolean;
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

### 3. `gateways` Collection 變更

**移除的欄位：**

- `isAD`
- `storeLogo`
- `imageLink`
- `websiteLink`
- `activityTitle`
- `activityContent`
- `storePassword`

**新增的欄位：**

- `storeId?: string | null` - 綁定的商店 ID

---

## 檔案變更清單

### Admin 端

#### 新增檔案（3 個）

1. `src/services/storeService.ts` - Store CRUD 和管理操作
2. `src/services/shopUserService.ts` - ShopUser CRUD（含 Firebase Auth）
3. `src/pages/ShopUsersPage.tsx` - 商店管理員管理頁面

#### 修改檔案（6 個）

1. `src/types/index.ts` - 新增 Store、ShopUser 型別，修改 Gateway 型別
2. `src/services/gatewayService.ts` - 支援 storeId 和 join Store
3. `src/pages/StoresPage.tsx` - 從篩選 isAD Gateway 改為管理獨立 stores
4. `src/pages/StoreDetailPage.tsx` - 管理員分配和 Gateway 綁定功能
5. `src/pages/GatewaysPage.tsx` - 移除 isAD，新增關聯商店欄位
6. `src/App.tsx` - 新增 `/shop-users` 路由
7. `src/layouts/DashboardLayout.tsx` - 新增「商店管理員」選單

### LIFF 端

#### 修改檔案（4 個）

1. `liff/src/types/index.ts` - 同步 Store 和 Gateway 型別
2. `liff/src/services/gatewayService.ts` - 載入時 join Store 資料
3. `liff/src/hooks/useMapMarkers.ts` - 使用 `gateway.store` 判斷商店
4. `liff/src/screens/map/MapScreen.tsx` - 彈窗顯示從 `gateway.store` 取得商店資訊

### Cloud Functions

#### 修改檔案（4 個）

1. `functions/src/line/sendMessage.ts` - `NotificationPointData` 改用 `store` 物件
2. `functions/src/beacon/receiveBeaconData.ts` - 發送通知前 join Store 資料
3. `functions/src/mapApp/gateways.ts` - API 回傳時 join Store 資料
4. `functions/src/index.ts` - 匯出遷移函數

#### 新增檔案（1 個）

1. `functions/src/migrations/migrateStoreData.ts` - 資料遷移腳本

---

## 功能說明

### 1. 商店管理（Admin 端）

**位置：** `/stores`

**功能：**

- 建立/編輯商店基本資訊
- 上傳 Logo（1:1）和 Banner（3:1）
- 設定活動標題和內容
- 查看管理員和綁定的 Gateway 數量

### 2. 商店詳情頁面（Admin 端）

**位置：** `/stores/:id`

**功能：**

- 編輯商店所有資訊
- 分配管理員（從 shop_users 選擇）
- 綁定 Gateway（從未綁定的 Gateway 選擇）
- 移除管理員/解綁 Gateway

### 3. 商店管理員管理（Admin 端）

**位置：** `/shop-users`

**功能：**

- 建立商店管理員帳號（Firebase Auth + Firestore）
- 編輯管理員資訊
- 啟用/停用管理員
- 查看該管理員負責的商店

### 4. Gateway 管理更新（Admin 端）

**位置：** `/gateways`

**變更：**

- 移除「行銷點」篩選
- 新增「關聯商店」欄位
- 編輯時可選擇綁定到哪個 Store

### 5. LIFF 地圖顯示

**功能：**

- 地圖標記自動顯示商店資訊（透過 `gateway.store`）
- 有活動標題的商店顯示黃色圖標
- 點擊 Gateway 彈窗顯示商店 Logo、Banner、活動內容

### 6. LINE 通知訊息

**功能：**

- 通過商店 Gateway 時自動發送包含商店資訊的 Flex Message
- 顯示 Banner 圖片（3:1）
- 顯示活動標題和內容
- 提供「店家資訊」按鈕連結到官網

---

## 資料遷移

### 執行遷移

如果有既有的 `isAD: true` 資料需要遷移：

```bash
# 1. 部署 Cloud Functions
cd functions
npm run deploy

# 2. 執行遷移（將 isAD Gateway 轉換成 Store）
curl https://<region>-safe-net-tw.cloudfunctions.net/migrateStoreData
```

遷移腳本會：

1. 查詢所有 `isAD: true` 的 Gateway
2. 為每個 Gateway 建立對應的 Store
3. 設定 Gateway 的 `storeId` 指向新建的 Store
4. 清除 Gateway 上的舊商店欄位

### 回退遷移（如有需要）

```bash
curl https://<region>-safe-net-tw.cloudfunctions.net/rollbackStoreMigration
```

---

## API 變更

### Gateway API (`getPublicGateways`)

**回傳格式變更：**

```typescript
// 舊格式
{
  id: string;
  name: string;
  isAD: boolean;
  storeLogo?: string;
  activityTitle?: string;
  // ...
}

// 新格式
{
  id: string;
  name: string;
  storeId?: string;
  store?: {
    name: string;
    storeLogo?: string;
    imageLink?: string;
    activityTitle?: string;
    activityContent?: string;
    websiteLink?: string;
  };
  // ...
}
```

---

## 使用流程

### 流程一：Admin 建立商店並分配管理員

```
1. Admin 到「商店管理員」頁面建立 ShopUser
   └── 輸入 email, password, name, role

2. Admin 到「商店管理」頁面建立 Store
   └── 輸入商店資訊、上傳圖片

3. 進入商店詳情頁
   ├── 分配管理員（選擇 shop_users）
   └── 綁定 Gateway（選擇未綁定的 Gateway）
```

### 流程二：從 Gateway 管理頁面綁定商店

```
1. Admin 到「GateWay 管理」頁面

2. 新增或編輯 Gateway
   └── 在「關聯商店」下拉選單選擇 Store

3. 儲存後，該 Gateway 會顯示商店資訊
```

### 流程三：LINE 用戶體驗

```
1. 用戶綁定設備並設定通知點

2. 設備通過商店的 Gateway
   └── 自動發送包含商店資訊的 LINE 訊息

3. 地圖上顯示商店圖標（黃色，有活動時）
   └── 點擊可查看商店詳情
```

---

## 向後相容性

### ✅ 已處理

- `storePassword` 欄位保留在 Store 中
- 舊的 Gateway 資料透過遷移腳本自動轉換
- LIFF 和 Functions 都支援新舊格式

### ⚠️ 需注意

- 遷移後，舊的 `gateway.isAD` 欄位將被移除
- 所有依賴 `gateway.isAD` 的程式碼已更新為 `gateway.store`
- 遷移前建議先備份 Firestore 資料

---

## 測試檢查清單

### Admin 端

- [ ] 建立商店管理員
- [ ] 建立商店
- [ ] 分配管理員到商店
- [ ] 綁定 Gateway 到商店
- [ ] 編輯商店資訊
- [ ] 移除管理員/解綁 Gateway
- [ ] Gateway 管理頁面顯示關聯商店

### LIFF 端

- [ ] 地圖顯示商店 Gateway（黃色圖標）
- [ ] 點擊 Gateway 彈窗顯示商店資訊
- [ ] 商店 Logo 顯示正確
- [ ] Banner 圖片顯示正確（3:1）
- [ ] 活動內容顯示正確

### LINE 通知

- [ ] 通過商店 Gateway 收到通知
- [ ] 通知包含商店 Banner
- [ ] 通知包含活動標題和內容
- [ ] 「店家資訊」按鈕可開啟官網

### Cloud Functions

- [ ] `getPublicGateways` API 回傳 store 資料
- [ ] 通知發送包含正確的商店資訊
- [ ] 遷移腳本成功執行

---

## 資料庫索引建議

建議在 Firestore 建立以下索引以優化查詢效能：

### stores collection

- `isActive` (ASC) + `createdAt` (DESC)
- `adminIds` (ARRAY) + `isActive` (ASC)

### shop_users collection

- `isActive` (ASC) + `name` (ASC)
- `isActive` (ASC) + `createdAt` (DESC)

### gateways collection

- `storeId` (ASC) + `isActive` (ASC)
- `storeId` (ASC) + `createdAt` (DESC)

---

## 部署步驟

### 1. Admin 端

```bash
# 無需特別部署，檔案已更新
# 重新整理瀏覽器即可看到新功能
```

### 2. LIFF 端

```bash
cd liff
npm run build
firebase deploy --only hosting:liff
```

### 3. Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

### 4. 執行資料遷移（如有既有資料）

```bash
# 遷移完成後，透過 HTTP 請求執行：
curl https://<region>-safe-net-tw.cloudfunctions.net/migrateStoreData
```

---

## 權限設計

### ShopUser 角色

#### OWNER（店主）

- 編輯商店所有資訊
- 上傳 Logo 和 Banner
- 修改活動內容
- 管理 Gateway 綁定

#### STAFF（員工）

- 編輯活動標題和內容
- 查看商店資訊
- 查看綁定的 Gateway

---

## 後續開發建議

### 1. 商店管理員前端（shop-portal）

可建立獨立的 shop-portal 專案，供商店管理員使用：

```
shop-portal/
  ├── src/
  │   ├── pages/
  │   │   ├── LoginPage.tsx          # 商店管理員登入
  │   │   ├── StoreDashboard.tsx     # 商店資訊編輯
  │   │   └── StoreAnalytics.tsx     # 統計分析
  │   └── services/
  │       └── storeService.ts        # 連接 Firestore
```

### 2. 權限控制

在 `firestore.rules` 新增規則：

```javascript
// Shop users can only edit their assigned stores
match /stores/{storeId} {
  allow read: if true;  // 所有人可讀
  allow write: if request.auth != null
    && exists(/databases/$(database)/documents/shop_users/$(request.auth.uid))
    && get(/databases/$(database)/documents/stores/$(storeId)).data.adminIds.hasAny([request.auth.uid]);
}

match /shop_users/{userId} {
  allow read: if request.auth != null;
  allow write: if false;  // 只能由 Admin 建立
}
```

### 3. 統計功能

建議新增：

- 商店的 Gateway 流量統計
- 通知發送次數統計
- 用戶點擊「店家資訊」次數統計

---

## 注意事項

1. **遷移前備份**：執行遷移前，請先匯出 `gateways` collection 備份
2. **測試環境**：建議先在測試環境執行遷移，確認無誤後再在正式環境執行
3. **監控錯誤**：遷移後監控 Cloud Functions 日誌，確認沒有錯誤
4. **逐步部署**：建議按順序部署：Functions → LIFF → Admin
5. **通知管理員**：通知相關人員架構變更，更新操作流程

---

## 完成日期

2026-02-02

## 相關文件

- [Store Architecture Refactor Plan](/Users/danielkai/.cursor/plans/store_architecture_refactor_3e41fbfc.plan.md)
- [Original Store Feature Docs](./STORES_FEATURE_UPDATE.md)
- [LINE Notification Docs](./LINE_NOTIFICATION_STORE_PROMOTION.md)
