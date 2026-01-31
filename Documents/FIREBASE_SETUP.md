# Firebase 設置指南

本文件說明如何在 Firebase Console 中完成必要的設置。

## 1. 設置 Firestore 安全規則

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇您的專案：`safe-net-tw`
3. 在左側選單中點擊「Firestore Database」
4. 點擊「規則」標籤
5. 將以下規則貼上並發布：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 開發模式 - 允許所有讀寫（僅用於開發測試）
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **重要提示**：這是開發測試用的開放規則，在正式環境中必須更改為基於角色的權限控制。

### 生產環境建議規則（未來使用）

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 輔助函數
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isSuperAdmin() {
      return isAuthenticated() && getUserData().role == 'SUPER_ADMIN';
    }

    function isTenantAdmin() {
      return isAuthenticated() && getUserData().role == 'TENANT_ADMIN';
    }

    function belongsToTenant(tenantId) {
      return isAuthenticated() && getUserData().tenantId == tenantId;
    }

    // Users 集合
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }

    // Tenants 集合
    match /tenants/{tenantId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();

      // 子集合：成員
      match /members/{memberId} {
        allow read: if isAuthenticated();
        allow write: if isSuperAdmin() || (isTenantAdmin() && belongsToTenant(tenantId));
      }
    }

    // Elders 集合
    match /elders/{elderId} {
      allow read: if isAuthenticated();
      allow create: if isSuperAdmin() || isTenantAdmin();
      allow update, delete: if isSuperAdmin() || (isTenantAdmin() && belongsToTenant(resource.data.tenantId));
    }

    // Devices 集合
    match /devices/{deviceId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin() || isTenantAdmin();
    }

    // Gateways 集合
    match /gateways/{gatewayId} {
      allow read: if isAuthenticated();
      allow create: if isSuperAdmin() || isTenantAdmin();
      allow update, delete: if isSuperAdmin() || (isTenantAdmin() && belongsToTenant(resource.data.tenantId));
    }

    // Alerts 集合
    match /alerts/{alertId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin() || isTenantAdmin();
    }

    // AppUsers 集合
    match /appUsers/{appUserId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin() || isTenantAdmin();
    }
  }
}
```

## 2. 啟用 Firebase Authentication

1. 在 Firebase Console 左側選單中點擊「Authentication」
2. 點擊「開始使用」
3. 在「登入方式」標籤中，啟用「電子郵件/密碼」
4. 點擊「電子郵件/密碼」
5. 啟用「電子郵件/密碼」選項
6. 點擊「儲存」

## 3. 創建測試用戶

### 方法一：使用 Firebase Console（推薦）

#### 步驟 1：在 Firebase Authentication 創建用戶

1. 前往「Authentication」>「Users」
2. 點擊「新增使用者」
3. 創建以下測試帳號：

**超級管理員帳號：**

- Email: `admin@safenet.com`
- Password: `admin123456`
- User UID: 記下自動生成的 UID（例如：`abc123def456`）

**Line OA 管理員帳號：**

- Email: `admin@dalove.com`
- Password: `admin123`
- User UID: 記下自動生成的 UID（例如：`xyz789uvw012`）

#### 步驟 2：在 Firestore 創建對應的用戶資料

1. 前往「Firestore Database」
2. 點擊「開始集合」
3. 集合 ID：`users`
4. 創建第一個文檔：

**超級管理員文檔：**

- 文檔 ID：使用步驟 1 記下的超級管理員 UID（例如：`abc123def456`）
- 欄位：
  ```
  email: "admin@safenet.com"
  name: "超級管理員"
  role: "SUPER_ADMIN"
  tenantId: null
  phone: "0912-345-678"
  isActive: true
  createdAt: (點擊「新增欄位」> 選擇「timestamp」類型 > 使用當前時間)
  updatedAt: (同上)
  ```

5. 新增第二個文檔（Line OA 管理員）：

**Line OA 管理員文檔：**

- 文檔 ID：使用步驟 1 記下的Line OA 管理員 UID（例如：`xyz789uvw012`）
- 欄位：
  ```
  email: "admin@dalove.com"
  name: "大愛Line OA 管理員"
  role: "TENANT_ADMIN"
  tenantId: "tenant_dalove_001"  // 稍後創建社區時使用此 ID
  phone: "0922-123-456"
  isActive: true
  createdAt: (timestamp)
  updatedAt: (timestamp)
  ```

#### 步驟 3：創建測試社區

1. 在 Firestore 中創建 `tenants` 集合
2. 新增文檔：

**大愛社區：**

- 文檔 ID：`tenant_dalove_001`（與上面Line OA 管理員的 tenantId 對應）
- 欄位：
  ```
  code: "DALOVE001"
  name: "大愛社區"
  address: "台北市信義區信義路五段 7 號"
  contactPerson: "王經理"
  contactPhone: "02-1234-5678"
  isActive: true
  createdAt: (timestamp)
  updatedAt: (timestamp)
  ```

### 方法二：使用腳本創建（進階）

如果您熟悉 Firebase Admin SDK，可以創建一個 Node.js 腳本來批量創建測試資料。

## 4. 創建 Firestore 索引（如需要）

當您使用複合查詢時，Firebase 可能會提示您需要創建索引。

1. 運行應用程式
2. 當出現索引錯誤時，錯誤訊息會包含一個連結
3. 點擊連結會自動跳轉到 Firebase Console 的索引創建頁面
4. 點擊「創建索引」並等待完成

常見需要的索引：

- `alerts` 集合：`tenantId` (升序) + `triggeredAt` (降序)
- `elders` 集合：`tenantId` (升序) + `createdAt` (降序)
- `devices` 集合：`tenantId` (升序) + `elderId` (升序)

## 5. 測試登入

1. 啟動開發伺服器：

   ```bash
   npm run dev
   ```

2. 開啟瀏覽器前往 `http://localhost:3000`

3. 使用測試帳號登入：
   - Email: `admin@safenet.com`
   - Password: `admin123456`

4. 確認可以成功登入並看到儀表板

## 6. 創建更多測試資料（選用）

您可以通過管理介面創建：

- 更多社區
- 長者資料
- 設備
- 閘道器
- 警報記錄

或者直接在 Firestore Console 中手動添加測試資料。

## 常見問題

### Q: 登入時出現 "用戶資料不存在" 錯誤

A: 確保在 Firestore 的 `users` 集合中創建了對應的文檔，且文檔 ID 必須與 Firebase Auth 中的 User UID 完全一致。

### Q: 無法讀取資料

A: 檢查 Firestore 安全規則是否已正確設置為開放模式（`allow read, write: if true;`）。

### Q: 索引錯誤

A: 點擊錯誤訊息中的連結創建所需的索引，或等待 Firebase 自動創建。

### Q: 如何重置測試資料

A: 在 Firestore Console 中可以手動刪除集合或文檔，或使用 Firebase Admin SDK 編寫清理腳本。

## 安全提醒

⚠️ **重要**：

- 目前使用的是開放的安全規則，僅適用於開發測試
- 在部署到生產環境前，必須更新為基於角色的安全規則
- 定期更改測試帳號密碼
- 不要在生產環境中使用簡單密碼

## 下一步

完成以上設置後，您的 Firebase 後端就已經準備就緒！您可以：

1. 開始使用管理介面創建資料
2. 測試即時監聽功能
3. 開發新功能
4. 準備部署到生產環境
