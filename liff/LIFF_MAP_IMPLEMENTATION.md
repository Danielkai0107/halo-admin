# LIFF 地圖功能實作說明

## 功能概覽

本專案實現了 LINE LIFF 地圖功能，包含以下主要功能：

1. **設備綁定/解綁** - 用戶可以將設備綁定到自己的 LINE 帳號
2. **通知點管理** - 用戶可以設定哪些 Gateway 作為通知點
3. **活動記錄** - 顯示設備的時間軸和足跡資訊
4. **地圖顯示** - 在 Google Maps 上顯示所有 Gateway 和設備位置
5. **通知觸發** - 當設備通過通知點時自動創建警報

## 架構說明

### 後端 API

#### 設備綁定 API

- `POST /bindDeviceToLineUser` - 綁定設備到 Line 用戶管理
- `POST /unbindDeviceFromLineUser` - 解綁設備

#### 通知點管理 API

- `POST /addLineUserNotificationPoint` - 新增通知點
- `POST /removeLineUserNotificationPoint` - 移除通知點
- `GET /getLineUserNotificationPoints` - 查詢所有通知點

#### 活動記錄 API

- `GET /getLineUserActivities` - 查詢設備活動記錄

### 前端服務層

- `liff/src/services/deviceService.ts` - 設備綁定服務
- `liff/src/services/notificationPointService.ts` - 通知點服務
- `liff/src/services/activityService.ts` - 活動記錄服務

### 資料結構

#### line_users 集合

```typescript
{
  lineUserId: string,
  lineDisplayName: string,
  linePictureUrl: string,
  name: string,
  boundDeviceId?: string,  // 綁定的設備 ID
  isActive: boolean,
  createdAt: string,
  updatedAt: string,
  lastLoginAt: string
}
```

#### devices 集合

```typescript
{
  uuid: string,
  major: number,
  minor: number,
  deviceName: string,
  bindingType: "LINE_USER",  // 綁定類型
  boundTo: string,  // line_users 文檔 ID
  boundAt: string,
  mapUserNickname: string,
  mapUserAge: number,
  mapUserGender: "MALE" | "FEMALE" | "OTHER",
  inheritedNotificationPointIds: string[],  // Gateway IDs
  isActive: boolean
}
```

#### alerts 集合（用於 LINE_USER 通知）

```typescript
{
  type: "NOTIFICATION_POINT",
  deviceId: string,
  lineUserId: string,  // Line 用戶管理 ID
  gatewayId: string,
  gatewayName: string,
  latitude: number,
  longitude: number,
  title: string,
  message: string,
  status: "PENDING",
  triggeredAt: string,
  visibleTo: [string],  // 可見用戶 ID 列表
  tenantId: null
}
```

## 部署步驟

### 1. 部署後端 Functions

```bash
# 在專案根目錄
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 2. 部署前端 LIFF

```bash
# 在 liff 目錄
cd liff
npm install
npm run build
firebase deploy --only hosting:liff
```

### 3. 配置環境變數

確保設定以下環境變數（如果需要）：

```bash
# .env 或 Firebase Config
VITE_FUNCTIONS_BASE_URL=https://your-project.cloudfunctions.net
```

## 使用流程

### 用戶端使用流程

1. **打開 LIFF 地圖**
   - 用戶透過 LINE 打開 liff/map
   - 自動執行 LINE 登入
   - 記錄到 line_users 集合

2. **綁定設備**
   - 點擊「綁定設備」按鈕
   - 輸入產品序號、暱稱、年齡、性別
   - 確認綁定

3. **設定通知點**
   - 點擊地圖上的 Gateway（SAFE_ZONE 或 SCHOOL_ZONE）
   - 點擊「設為通知點」按鈕
   - Gateway 會被加入到 `inheritedNotificationPointIds`

4. **查看活動記錄**
   - 底部 Bottom Sheet 會顯示設備的活動時間軸
   - 包含今日活動數、總活動數等統計資訊
   - 按日期分組顯示活動記錄

5. **管理通知點**
   - 點擊「通知點管理」按鈕
   - 查看所有已設定的通知點
   - 可以刪除不需要的通知點

6. **解除綁定**
   - 打開綁定設備對話框
   - 點擊「解除綁定」按鈕
   - 確認後解綁（活動記錄會被匿名化）

### 通知觸發流程

當設備被 Gateway 接收到訊號時：

1. Beacon 資料接收函數處理
2. 查找設備並判斷 `bindingType`
3. 如果是 `LINE_USER` 類型：
   - 檢查 `inheritedNotificationPointIds`
   - 如果 Gateway ID 在列表中
   - 創建警報記錄（`visibleTo` 只包含該用戶）
   - 記錄到 `devices/{deviceId}/activities`

## Gateway 類型說明

| 類型         | 顏色           | 用途     | 可設為通知點 |
| ------------ | -------------- | -------- | ------------ |
| SAFE_ZONE    | 藍綠色 #4ECDC4 | 安全區域 | ✅           |
| SCHOOL_ZONE  | 粉紅色 #FF6A95 | 學校區域 | ✅           |
| OBSERVE_ZONE | 青色 #00CCEA   | 觀察區域 | ❌           |
| INACTIVE     | 灰色 #C4C4C4   | 未啟用   | ❌           |

## 注意事項

### 安全性

- 所有 API 需要驗證 Line 用戶管理身份
- 防止用戶綁定/解綁他人的設備
- 警報記錄的 `visibleTo` 欄位必須正確設定

### 資料一致性

- 綁定/解綁時確保雙向更新（devices + line_users）
- 解綁時必須匿名化活動記錄
- 通知點變更時即時更新 UI

### 效能優化

- 活動記錄使用 Firestore 訂閱（即時更新）
- 活動記錄限制為 100 筆（可調整）
- Gateway 列表使用快取策略

### 用戶體驗

- 所有操作都有載入狀態指示器
- 錯誤訊息清晰友好
- 操作成功後給予明確反饋
- 重要操作需要二次確認（解綁、刪除通知點）

## 測試建議

### 功能測試

1. 測試設備綁定流程（正常綁定、重複綁定、錯誤序號）
2. 測試通知點設定（添加、移除、管理）
3. 測試活動記錄顯示（即時更新、按日期分組）
4. 測試解綁流程（確認活動記錄匿名化）

### 整合測試

1. 測試 Beacon 資料接收和通知觸發
2. 測試多個用戶同時使用
3. 測試 Gateway 類型過濾
4. 測試通知點限制（只允許 SAFE_ZONE 和 SCHOOL_ZONE）

### 邊界測試

1. 測試未綁定設備時的 UI 顯示
2. 測試無活動記錄時的 UI 顯示
3. 測試無通知點時的 UI 顯示
4. 測試網路錯誤處理

## 已知限制

1. **LINE 通知**：目前後端只創建警報記錄，尚未實作 LINE Messaging API 發送通知（標記為 TODO）
2. **活動記錄分頁**：目前限制為 100 筆，如果資料量大需要實作分頁
3. **離線支援**：目前不支援離線模式

## 未來改進方向

1. 實作 LINE Messaging API 發送通知
2. 添加活動記錄分頁功能
3. 添加活動記錄搜尋和篩選功能
4. 添加統計圖表（活動趨勢、熱點分析等）
5. 添加路線規劃功能
6. 添加 Gateway 聚合顯示（當數量多時）
7. 添加離線支援和快取策略
