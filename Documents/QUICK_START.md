# LIFF 地圖功能快速啟動指南

## 🚀 已完成部署

### 後端 API

✅ 所有 Cloud Functions 已部署到 Firebase  
✅ LINE User API 已上線  
✅ 通知觸發機制已更新

### 前端 LIFF

✅ 已部署到：https://safe-net-tw.web.app/liff/map

## ✅ 完整功能清單

### 基礎功能（8項）

1. ✅ 地圖顯示所有 Gateway（四種類型：SAFE_ZONE、SCHOOL_ZONE、OBSERVE_ZONE、INACTIVE）
2. ✅ LINE 登入自動記錄到 line_users
3. ✅ 設備綁定（序號、暱稱、年齡、性別）
4. ✅ 設為通知點（inheritedNotificationPointIds）
5. ✅ 通知點管理和刪除
6. ✅ Bottom Sheet 時間軸和足跡資訊
7. ✅ 設備資訊顯示和解綁
8. ✅ 通知觸發（visibleTo 只給該用戶）

### 進階功能（3項）

1. ✅ LINE Messaging API 通知（Flex Message）
2. ✅ 統計圖表（24小時分布、7天趨勢、熱點 TOP 5）
3. ✅ Gateway 聚合顯示（智能聚合算法）

## 🔧 系統需求

### Firestore 資料結構

確保以下集合存在：

- `line_users` - Line 用戶管理記錄
- `devices` - 設備記錄
- `gateways` - Gateway 接收點
- `tenants` - 社區資料（包含 lineChannelAccessToken）
- `alerts` - 警報記錄
- `anonymousActivities` - 匿名化活動記錄

### Tenant 設定

**重要**：每個 tenant 必須包含以下欄位：

```typescript
{
  lineChannelAccessToken: string,  // LINE Bot Channel Access Token
  lineLiffId: string,              // LINE LIFF ID
  // ... 其他欄位
}
```

## 📱 使用流程

### 1. 打開 LIFF

```
https://safe-net-tw.web.app/liff/map
```

### 2. LINE 登入

- 自動執行 LINE 登入
- 記錄到 `line_users` 集合
- 關聯到對應的 tenant

### 3. 綁定設備

1. 點擊左側「綁定設備」按鈕（手機圖標）
2. 輸入產品序號（例如：1-1001）
3. 填寫暱稱、年齡、性別（選填）
4. 確認綁定

### 4. 設定通知點

1. 點擊地圖上的 Gateway 標記
2. 如果是 SAFE_ZONE 或 SCHOOL_ZONE，會顯示「設為通知點」按鈕
3. 點擊後 Gateway 加入通知點列表

### 5. 管理通知點

1. 點擊「通知點管理」按鈕（鈴鐺圖標）
2. 查看所有已設定的通知點
3. 點擊垃圾桶圖標刪除

### 6. 查看活動記錄

1. 底部 Bottom Sheet 顯示設備活動
2. 點擊標籤或左右滑動切換：
   - 📅 時間軸：活動記錄列表
   - 📊 統計分析：圖表和熱點分析

### 7. 解除綁定

1. 再次點擊「綁定設備」按鈕
2. 會顯示設備資訊
3. 點擊「解除綁定」按鈕
4. 確認後解綁（活動記錄會匿名化）

## 🔔 通知機制

### 觸發條件

當設備被 Gateway 接收到訊號，且該 Gateway 在用戶的 `inheritedNotificationPointIds` 中。

### 通知內容

- 通知點名稱
- 設備暱稱
- 通過時間
- 地圖連結

### 警報記錄

- 創建到 `alerts` 集合
- `visibleTo` 只包含該用戶的 lineUserId
- 與社區警報分開管理

## 🎯 測試檢查清單

- [x] 後端 Functions 編譯成功
- [x] 後端 Functions 部署成功
- [x] 前端 LIFF 編譯成功
- [x] 前端 LIFF 部署成功
- [ ] LINE 登入測試
- [ ] 設備綁定測試
- [ ] 通知點設定測試
- [ ] 活動記錄顯示測試
- [ ] 統計圖表顯示測試
- [ ] Gateway 聚合顯示測試
- [ ] LINE 通知測試（需要實體設備）

## 📊 系統架構

```
┌─────────────────────────────────────────────┐
│            LIFF 地圖前端                      │
│  https://safe-net-tw.web.app/liff/map      │
├─────────────────────────────────────────────┤
│ MapScreen.tsx                                │
│   ├─ LINE 登入（useAuth）                    │
│   ├─ 設備綁定 UI                             │
│   ├─ 通知點管理 UI                           │
│   ├─ 時間軸顯示                              │
│   └─ 統計圖表（可滑動切換）                  │
└─────────────────────────────────────────────┘
                    ↕ API 呼叫
┌─────────────────────────────────────────────┐
│          Cloud Functions (後端)              │
├─────────────────────────────────────────────┤
│ LINE User APIs:                              │
│   ├─ bindDeviceToLineUser                   │
│   ├─ unbindDeviceFromLineUser               │
│   ├─ addLineUserNotificationPoint           │
│   ├─ removeLineUserNotificationPoint        │
│   ├─ getLineUserNotificationPoints          │
│   └─ getLineUserActivities                  │
│                                              │
│ Beacon Processing:                           │
│   └─ receiveBeaconData                      │
│       └─ handleLineUserNotification         │
│           ├─ 檢查通知點                      │
│           ├─ 創建警報                        │
│           └─ 發送 LINE 通知                  │
└─────────────────────────────────────────────┘
                    ↕ 讀寫資料
┌─────────────────────────────────────────────┐
│           Firestore 資料庫                   │
├─────────────────────────────────────────────┤
│ line_users (用戶)                            │
│ devices (設備)                               │
│ gateways (接收點)                            │
│ tenants (社區，含 lineChannelAccessToken)   │
│ alerts (警報)                                │
│ devices/{id}/activities (活動記錄)          │
└─────────────────────────────────────────────┘
```

## 💡 重要提示

### LINE Channel Access Token

- **不需要**在環境變數中設定
- **自動從** tenants 集合讀取
- 每個 tenant 使用自己的 LINE Bot token

### 資料流程

```
用戶 LINE 登入
    ↓
找到所屬 tenant (joinedFromTenantId 或 membership)
    ↓
綁定設備 (bindingType: "LINE_USER")
    ↓
設定通知點 (inheritedNotificationPointIds)
    ↓
設備通過通知點
    ↓
使用 tenant 的 lineChannelAccessToken 發送通知
```

## 📞 支援

如有問題，請查看：

- [基礎功能文檔](liff/LIFF_MAP_IMPLEMENTATION.md)
- [進階功能文檔](liff/ADVANCED_FEATURES.md)
- [部署總結](DEPLOYMENT_SUMMARY.md)
- Firebase Console: https://console.firebase.google.com/project/safe-net-tw

## ✅ 所有功能已完成並部署！
