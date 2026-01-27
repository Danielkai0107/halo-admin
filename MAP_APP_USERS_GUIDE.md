# Line 用戶管理管理功能指南

## 功能概述

已成功建立 `mapAppUsers` 集合管理功能，用於管理Line 用戶管理及其設備綁定。

## 已完成的功能

### 1. 資料結構

#### MapAppUser 類型

```typescript
interface MapAppUser {
  id: string;
  email?: string;
  name: string;
  phone?: string;
  avatar?: string;
  boundDeviceId?: string; // 綁定的設備 ID
  boundAt?: string; // 綁定時間
  deviceNickname?: string; // 設備暱稱（不與設備綁死）
  deviceOwnerAge?: number; // 使用者年齡（不與設備綁死）
  fcmToken?: string; // Firebase Cloud Messaging Token
  notificationEnabled: boolean; // 是否開啟通知
  isActive: boolean; // 是否啟用
  createdAt: string;
  updatedAt: string;
}
```

### 2. 服務層 (`mapAppUserService.ts`)

提供完整的 CRUD 操作和特殊功能：

- ✅ `getAll(page, limit)` - 分頁獲取用戶列表
- ✅ `subscribe(callback)` - 即時監聽用戶列表變化
- ✅ `getAllForSelection()` - 獲取啟用的用戶（用於選擇器）
- ✅ `getOne(id)` - 獲取單個用戶
- ✅ `create(data)` - 創建用戶
- ✅ `update(id, data)` - 更新用戶
- ✅ `toggleActive(id)` - 切換啟用/停用狀態
- ✅ `toggleNotification(id)` - 切換通知開關
- ✅ `bindDevice(id, deviceId, nickname, age)` - 綁定設備
- ✅ `unbindDevice(id)` - 解綁設備
- ✅ `delete(id)` - 刪除用戶

### 3. 管理頁面 (`MapAppUsersPage.tsx`)

#### 頁面功能

- ✅ 用戶列表顯示（即時更新）
- ✅ 統計卡片顯示：
  - 總用戶數
  - 啟用用戶數
  - 已綁定設備數
  - 開啟通知數
- ✅ 用戶資訊展示：
  - 基本資訊（姓名、頭像、暱稱、年齡）
  - 聯絡方式（Email、電話）
  - 綁定設備資訊（設備名稱、UUID、Major/Minor、綁定時間）
  - 狀態顯示（啟用/停用、通知開啟/關閉）
- ✅ 操作功能：
  - 新增用戶
  - 編輯用戶
  - 刪除用戶
  - 啟用/停用用戶
  - 開啟/關閉通知
  - 綁定設備
  - 解綁設備
- ✅ 分頁功能

#### 特色功能

1. **設備綁定管理**
   - 智能篩選可綁定設備（PUBLIC 池或未綁定的設備）
   - 顯示設備詳細資訊（UUID、Major/Minor）
   - 支持設置設備暱稱和使用者年齡

2. **即時更新**
   - 使用 Firestore 訂閱，數據即時同步
   - 無需手動刷新頁面

3. **友善的用戶界面**
   - 清晰的狀態標籤（啟用/停用、通知開啟/關閉）
   - 直觀的操作按鈕（綁定/解綁、通知開關等）
   - 詳細的設備綁定資訊展示

### 4. 路由配置

已在 `App.tsx` 中添加路由：

```typescript
<Route path="map-app-users" element={<MapAppUsersPage />} />
```

### 5. 導航菜單

已在 `DashboardLayout.tsx` 中添加菜單項：

```typescript
{ path: '/map-app-users', icon: MapPin, label: 'Line 用戶管理' }
```

位置：在「Line 好友成員」之後

### 6. Firestore 規則

已在 `firestore.rules` 中添加規則（生產環境使用）：

```javascript
// MapAppUsers 集合（Line 用戶管理）
match /mapAppUsers/{mapAppUserId} {
  allow read: if isAuthenticated();
  allow write: if isSuperAdmin() || isTenantAdmin();
}
```

同時也添加了相關集合的規則：

- `mapUserNotificationPoints` - 用戶通知點位
- `mapUserActivities` - 用戶活動記錄

## 使用方式

### 1. 訪問頁面

在系統中點擊側邊欄的「Line 用戶管理」即可進入管理頁面。

### 2. 創建用戶

1. 點擊右上角的「新增用戶」按鈕
2. 填寫必填資訊：
   - 姓名（必填）
   - Email（選填）
   - 電話（選填）
   - 設備暱稱（選填）
   - 使用者年齡（選填）
3. 點擊「創建」

### 3. 綁定設備

1. 找到需要綁定設備的用戶
2. 點擊「綁定」圖標（🔗）
3. 在彈出的對話框中：
   - 選擇要綁定的設備
   - 設置設備暱稱（選填）
   - 設置使用者年齡（選填）
4. 點擊「綁定」確認

### 4. 解綁設備

1. 找到已綁定設備的用戶
2. 點擊「解綁」圖標
3. 確認解綁操作

### 5. 管理通知

- 點擊鈴鐺圖標可以開啟/關閉用戶的通知功能
- 通知狀態會以標籤顯示在狀態欄中

### 6. 啟用/停用用戶

- 點擊用戶狀態切換圖標即可啟用或停用用戶
- 停用的用戶將無法使用地圖 App 功能

## 與其他功能的關聯

### 與 Device（Beacon）的關聯

- 用戶可以綁定一個設備
- 設備必須是 PUBLIC 池或未被其他用戶綁定
- 綁定後，用戶可以追蹤該設備的位置

### 與 Gateway 的關聯

- 用戶可以設置通知點位（`mapUserNotificationPoints`）
- 當綁定的設備經過特定 Gateway 時，系統會發送通知

### 與 AppUsers（LINE 好友）的區別

- `appUsers` 是透過 LINE 加入的社區成員
- `mapAppUsers` 是使用地圖 App 的用戶
- 兩者是獨立的用戶系統，服務不同的使用場景

## 資料庫集合

### 主要集合

- `mapAppUsers` - Line 用戶管理主表

### 相關集合（未來擴展）

- `mapUserNotificationPoints` - 用戶通知點位
- `mapUserActivities` - 用戶活動記錄

## 注意事項

1. **設備綁定限制**
   - 每個用戶只能綁定一個設備
   - 設備只能被一個用戶綁定（除非是 PUBLIC 池的設備）
   - 綁定前請確認設備正確

2. **通知功能**
   - 需要用戶在 App 中授權推送通知
   - fcmToken 會在用戶登入 App 時自動更新

3. **權限管理**
   - SUPER_ADMIN：完全訪問權限
   - TENANT_ADMIN：可以管理本社區相關的用戶
   - 其他角色：只讀權限

4. **數據同步**
   - 使用 Firestore 即時監聽，數據會自動同步
   - 無需手動刷新頁面

## 後續擴展建議

1. **通知點位管理**
   - 為用戶設置自定義通知點位
   - 管理通知消息模板

2. **活動記錄**
   - 查看用戶的設備活動歷史
   - 生成活動報表

3. **批量操作**
   - 批量導入用戶
   - 批量綁定設備
   - 批量通知設置

4. **統計分析**
   - 用戶活躍度分析
   - 設備使用統計
   - 通知送達率分析

## 技術細節

### 使用的技術

- React + TypeScript
- React Hook Form（表單管理）
- Lucide React（圖標庫）
- Firestore（資料庫）
- 即時訂閱（Firestore Snapshot）

### 性能優化

- 使用 Firestore 訂閱而非輪詢
- 懶加載設備列表
- 客戶端分頁處理

### 安全性

- 遵循 Firestore 安全規則
- 敏感操作需要確認對話框
- 權限分級管理

## 支持與維護

如有問題或需要擴展功能，請參考：

- `src/services/mapAppUserService.ts` - 服務層實現
- `src/pages/MapAppUsersPage.tsx` - 頁面實現
- `src/types/index.ts` - 類型定義
- `firestore.rules` - 安全規則

---

**版本**: 1.0.0  
**更新日期**: 2026-01-21  
**狀態**: ✅ 已完成
