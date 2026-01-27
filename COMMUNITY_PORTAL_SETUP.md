# Line OA 管理網頁版設置指南

## 專案概述

`community-portal` 是一個獨立的Line OA 管理網頁應用，供Line OA 管理員使用 Email/密碼登入，提供長者管理、設備查看、通知記錄和通知點管理功能。

## 目錄結構

```
admin/
├── src/                    # 總公司管理後台
├── liff/                   # LINE LIFF 應用（社區成員用）
└── community-portal/       # 新建：Line OA 管理網頁版
    ├── src/
    │   ├── config/         # Firebase 配置
    │   ├── types/          # TypeScript 類型定義
    │   ├── store/          # Zustand 狀態管理
    │   ├── hooks/          # React Hooks（useAuth 等）
    │   ├── services/       # API 服務層
    │   ├── components/     # 通用元件
    │   └── screens/        # 頁面元件
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.cjs
```

## 功能模組

### 1. 認證系統

- Email/密碼登入（Firebase Authentication）
- 使用 `saas_users` 集合儲存用戶資料
- 文件 ID 直接使用 Firebase Auth UID
- 每個用戶直接包含 `tenantId`（所屬社區）

### 2. 長者管理

- 查看社區內所有長者列表（即時訂閱）
- 查看長者詳細資訊（含設備綁定狀態）
- 新增長者
- 編輯長者資訊
- 綁定/解綁設備

### 3. 設備清單（唯讀）

- 查看屬於社區的所有設備（根據 `tags` 篩選）
- 顯示設備狀態（已綁定/未綁定）
- 顯示電池電量、最後上線時間
- 僅查看，不可編輯或新增

### 4. 通知記錄

- 查看已傳送 LINE 通知的活動記錄
- 按日期範圍篩選
- 按長者篩選
- 顯示通知詳情（時間、位置、接收人數）

### 5. 通知點管理

- 新增通知點：選擇社區的 gateway，設定為固定傳送通知的點位
- 編輯通知點（名稱、通知訊息）
- 刪除通知點
- 啟用/停用通知點

## 測試帳號設置

### 步驟 1: 在 Firebase Auth 建立測試帳號

1. 前往 Firebase Console > Authentication > Users
2. 點擊 "Add User"
3. 輸入：
   - Email: `community-admin@test.com`
   - Password: `test123456`
4. 記錄生成的 UID（例如：`abc123xyz456`）

### 步驟 2: 在 Firestore 建立 saas_users 記錄

使用 Firebase Console 或以下代碼建立：

```javascript
// 在 Firestore Console 中手動建立，或使用此代碼
// Collection: saas_users
// Document ID: abc123xyz456（使用 Step 1 的 UID）

{
  firebaseUid: "abc123xyz456",    // 與 Firebase Auth UID 相同
  email: "community-admin@test.com",
  name: "測試管理員",
  phone: "0912345678",
  avatar: null,
  tenantId: "YOUR_TENANT_ID",     // 替換為實際的社區 ID
  role: "ADMIN",                   // ADMIN 或 MEMBER
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}
```

**重要事項**:

- 文件 ID 必須使用 Firebase Auth UID
- `firebaseUid` 欄位值也要是同一個 UID
- `tenantId` 必須是有效的社區 ID（可從 `tenants` 集合查詢）

### 步驟 3: 確認社區存在

確保 `tenants` 集合中有對應的社區記錄：

```javascript
// Collection: tenants
// Document ID: YOUR_TENANT_ID

{
  code: "COMMUNITY001",
  name: "測試社區",
  address: "測試地址",
  contactPerson: "聯絡人",
  contactPhone: "0912345678",
  lineChannelAccessToken: "YOUR_LINE_CHANNEL_ACCESS_TOKEN",
  lineChannelSecret: "YOUR_LINE_CHANNEL_SECRET",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}
```

## 啟動開發環境

### 1. 安裝依賴（已完成）

```bash
cd community-portal
npm install
```

### 2. 啟動開發伺服器

```bash
npm run dev
```

應用將在 `http://localhost:3002` 啟動。

### 3. 登入測試

1. 訪問 `http://localhost:3002/community/login`
2. 使用測試帳號登入：
   - Email: `community-admin@test.com`
   - Password: `test123456`
3. 登入成功後，應該會自動載入社區資料並重定向到長者管理頁面

## 部署到 Firebase Hosting

### 1. 建立生產版本

```bash
cd community-portal
npm run build
```

建置結果會輸出到 `../dist/community/` 目錄。

### 2. 更新 Firebase Hosting 配置

確保 `firebase.json` 包含以下配置：

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "/community/**",
        "destination": "/community/index.html"
      }
    ]
  }
}
```

### 3. 部署

```bash
# 從專案根目錄
firebase deploy --only hosting
```

部署後可訪問：`https://YOUR_PROJECT.web.app/community/`

## Firestore Security Rules

目前使用開發模式（允許所有讀寫），生產環境規則已在 `firestore.rules` 的註解中準備好。

### 啟用生產環境規則

1. 編輯 `firestore.rules`
2. 將註解中的生產環境規則複製到主規則區塊
3. 刪除開發模式規則
4. 部署規則：

```bash
firebase deploy --only firestore:rules
```

## Backend 整合

### Cloud Functions 修改

已修改 `functions/src/beacon/receiveBeaconData.ts`，新增以下功能：

1. **通知點檢查**：當長者綁定的設備經過 gateway 時，檢查該 gateway 是否為通知點
2. **自訂通知訊息**：如果是通知點，發送自訂的通知訊息
3. **記錄通知點 ID**：在活動記錄中記錄觸發的通知點 ID

### 部署 Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

## 測試清單

### 基本功能測試

- [ ] Email/密碼登入
- [ ] 顯示正確的社區名稱和用戶資訊
- [ ] 登出功能

### 長者管理測試

- [ ] 查看長者列表（只顯示所屬社區的長者）
- [ ] 新增長者
- [ ] 編輯長者資訊
- [ ] 查看長者詳情
- [ ] 綁定設備到長者
- [ ] 解綁設備

### 設備清單測試

- [ ] 查看設備列表（只顯示有社區 tag 的設備）
- [ ] 篩選已綁定/未綁定設備
- [ ] 確認無法編輯設備

### 通知記錄測試

- [ ] 查看通知記錄
- [ ] 按日期範圍篩選
- [ ] 按長者篩選
- [ ] 顯示通知詳情

### 通知點管理測試

- [ ] 新增通知點
- [ ] 選擇 gateway
- [ ] 設定自訂通知訊息
- [ ] 編輯通知點
- [ ] 刪除通知點
- [ ] 啟用/停用通知點

### 權限測試

- [ ] 無法存取其他社區的資料
- [ ] MEMBER 角色無法新增/編輯/刪除
- [ ] ADMIN 角色可以進行所有操作

### 通知點觸發測試

1. 建立通知點（選擇一個 gateway）
2. 讓長者綁定的設備經過該 gateway
3. 確認社區成員收到 LINE 通知
4. 確認通知訊息包含自訂內容（如果有設定）
5. 確認活動記錄中有記錄通知點 ID

## 常見問題

### Q: 登入後顯示「找不到用戶記錄」

A: 確認以下事項：

1. `saas_users` 文件 ID 是否與 Firebase Auth UID 相同
2. `firebaseUid` 欄位值是否正確
3. `isActive` 是否為 `true`

### Q: 登入後顯示「找不到社區資料」

A: 確認：

1. `saas_users` 的 `tenantId` 是否有值
2. `tenants` 集合中是否有對應的社區記錄

### Q: 看不到任何長者資料

A: 確認：

1. `elders` 集合中是否有 `tenantId` 匹配的記錄
2. 長者的 `isActive` 是否為 `true`

### Q: 看不到任何設備

A: 確認：

1. `devices` 集合中的設備是否有 `tags` 欄位
2. `tags` 陣列是否包含 `tenant_{tenantId}` 格式的 tag

### Q: 通知點不觸發通知

A: 確認：

1. 通知點的 `isActive` 為 `true`
2. 通知點的 `notifyOnElderActivity` 為 `true`
3. 社區有設定 `lineChannelAccessToken`
4. 社區成員的 `appUsers` 記錄有 `lineUserId`
5. Cloud Functions 已重新部署

## 系統架構圖

```
┌─────────────────────┐
│  Admin Web          │  總公司管理後台
│  (Super Admin)      │  管理所有社區
└─────────────────────┘

┌─────────────────────┐
│  Community Portal   │  Line OA 管理網頁
│  (Email Login)      │  Line OA 管理員
│  saas_users         │  管理自己社區
└─────────────────────┘

┌─────────────────────┐
│  LIFF App           │  LINE LIFF 應用
│  (LINE Login)       │  社區成員
│  appUsers           │  查看長者、接收通知
└─────────────────────┘

         ↓ ↓ ↓

┌─────────────────────┐
│  Firebase           │
│  - Authentication   │
│  - Firestore        │
│  - Cloud Functions  │
└─────────────────────┘
```

## 資料集合說明

- **saas_users**: Line OA 管理員用戶（Email 登入）
- **appUsers**: LINE LIFF 用戶（LINE 登入）
- **tenants**: 社區資料
- **elders**: 長者資料
- **devices**: 設備資料（BLE Beacon）
- **gateways**: 接收器資料
- **tenantNotificationPoints**: 社區通知點
- **elders/{id}/activities**: 長者活動記錄（含通知記錄）

## 下一步

1. 建立測試帳號並登入測試
2. 新增測試長者和設備
3. 建立通知點並測試觸發
4. 確認所有功能正常運作
5. 啟用生產環境 Security Rules
6. 部署到 Firebase Hosting

## 支援

如有問題，請檢查：

- Firebase Console 的 Authentication 和 Firestore
- 瀏覽器開發者工具的 Console 錯誤訊息
- Cloud Functions 日誌（Firebase Console > Functions > Logs）
