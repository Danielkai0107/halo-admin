# LIFF 地圖功能部署總結

## ✅ 部署成功

**部署時間**：2026-01-27

### 後端 Cloud Functions

- **專案**：safe-net-tw
- **區域**：us-central1
- **狀態**：✅ 已部署

#### 新增的 LINE User API

- ✅ `bindDeviceToLineUser` - https://binddevicetolineuser-kmzfyt3t5a-uc.a.run.app
- ✅ `unbindDeviceFromLineUser` - https://unbinddevicefromlineuser-kmzfyt3t5a-uc.a.run.app
- ✅ `addLineUserNotificationPoint` - https://addlineusernotificationpoint-kmzfyt3t5a-uc.a.run.app
- ✅ `removeLineUserNotificationPoint` - https://removelineusernotificationpoint-kmzfyt3t5a-uc.a.run.app
- ✅ `getLineUserNotificationPoints` - https://getlineusernotificationpoints-kmzfyt3t5a-uc.a.run.app
- ✅ `getLineUserActivities` - https://getlineuseractivities-kmzfyt3t5a-uc.a.run.app

#### 更新的函數

- ✅ `receiveBeaconData` - 新增 LINE_USER 通知支援

### 前端 LIFF

- **網址**：https://safe-net-tw.web.app/liff/map
- **狀態**：✅ 已部署

## 📋 已實作功能清單

### 基礎功能

1. ✅ **Gateway 地圖顯示**
   - 四種類型：SAFE_ZONE、SCHOOL_ZONE、OBSERVE_ZONE、INACTIVE
   - 不同顏色和圖標

2. ✅ **LINE 登入**
   - 自動記錄到 line_users 集合
   - 自動更新 LINE 個人資訊

3. ✅ **設備綁定**
   - 輸入產品序號、暱稱、年齡、性別
   - 綁定到 Line 用戶管理
   - bindingType: "LINE_USER"

4. ✅ **通知點設定**
   - 點擊地圖上的 Gateway
   - 只有 SAFE_ZONE 和 SCHOOL_ZONE 可設為通知點
   - 更新 devices.inheritedNotificationPointIds

5. ✅ **通知點管理**
   - 查看所有已設定的通知點
   - 刪除通知點

6. ✅ **活動時間軸**
   - 即時訂閱設備活動記錄
   - 按日期分組顯示
   - 顯示今日活動數和總活動數
   - 點擊活動定位到地圖

7. ✅ **設備解綁**
   - 顯示設備資訊
   - 解綁時匿名化活動記錄

8. ✅ **通知觸發**
   - 設備通過通知點時創建警報
   - 警報只對該用戶可見（visibleTo）
   - 發送 LINE Messaging API 通知

### 進階功能

1. ✅ **LINE Messaging API 通知**
   - Flex Message 格式
   - 包含地圖連結
   - 顯示設備和地點資訊

2. ✅ **統計圖表**
   - 24小時活動分布圖
   - 近7天活動趨勢圖
   - 熱門地點 TOP 5
   - 左右滑動切換時間軸/統計分析

3. ✅ **Gateway 聚合顯示**
   - 當 Gateway 數量 > 10 時自動聚合
   - 根據縮放級別動態調整聚合距離
   - 集群圖標顯示數量
   - 點擊集群自動放大

## ⚙️ 環境配置

### LINE Channel Access Token 設定

**重要**：系統會自動從 `tenants` 集合中讀取 `lineChannelAccessToken`

當 LINE_USER 設備觸發通知時：

1. 系統會查找用戶所屬的 tenant（通過 `line_users.joinedFromTenantId` 或 membership）
2. 從該 tenant 的 `lineChannelAccessToken` 欄位獲取 token
3. 使用該 token 發送 LINE 通知

**無需額外設定環境變數**，只需確保 tenant 文檔中有設定 `lineChannelAccessToken` 欄位

### API Base URL 配置

前端服務會使用 Cloud Functions 的 URL：

```
https://[function-name]-kmzfyt3t5a-uc.a.run.app
```

## 📱 使用方式

### 1. 訪問地圖

```
https://safe-net-tw.web.app/liff/map
```

### 2. LINE 登入

- 自動執行 LINE 登入流程
- 首次登入會創建 line_users 記錄

### 3. 綁定設備

- 點擊「綁定設備」按鈕（左側浮動按鈕）
- 輸入產品序號（例如：1-1001）
- 填寫暱稱、年齡、性別（選填）
- 確認綁定

### 4. 設定通知點

- 點擊地圖上的 Gateway 標記
- 如果是 SAFE_ZONE 或 SCHOOL_ZONE，會顯示「設為通知點」按鈕
- 點擊後該 Gateway 會加入通知點列表

### 5. 管理通知點

- 點擊「通知點管理」按鈕
- 查看所有已設定的通知點
- 點擊垃圾桶圖標刪除通知點

### 6. 查看活動記錄

- 底部 Bottom Sheet 會顯示設備活動
- 點擊「📅 時間軸」查看活動記錄
- 點擊「📊 統計分析」查看圖表
- 左右滑動可切換面板

## 🎯 功能驗證

### 測試步驟

1. ✅ 打開 https://safe-net-tw.web.app/liff/map
2. ✅ 確認 LINE 登入成功
3. ✅ 確認地圖載入並顯示 Gateway
4. ✅ 測試綁定設備功能
5. ✅ 測試設定通知點功能
6. ✅ 測試通知點管理功能
7. ⏳ 等待設備通過通知點，確認 LINE 通知（需要實體設備）
8. ✅ 查看活動時間軸
9. ✅ 查看統計圖表
10. ✅ 測試 Gateway 聚合顯示

## 📝 後續工作

### LINE Channel Access Token 設定

需要執行以下命令設定 TOKEN：

```bash
cd functions
echo "LINE_CHANNEL_ACCESS_TOKEN=your_actual_token" >> .env
firebase deploy --only functions
```

### 驗證通知功能

1. 確認 LINE Channel Access Token 已設定
2. 使用實體設備測試 Beacon 訊號
3. 確認 LINE 收到通知

### 監控與維護

- Firebase Console：https://console.firebase.google.com/project/safe-net-tw/overview
- 查看 Functions 日誌
- 監控錯誤和性能

## 🎉 部署完成

所有功能已成功部署！

- ✅ 8 個基礎功能
- ✅ 3 個進階功能
- ✅ 6 個新的 LINE User API
- ✅ 完整的前端 UI

**訪問地址**：https://safe-net-tw.web.app/liff/map
