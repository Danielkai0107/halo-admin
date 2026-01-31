# 通知點管理使用說明

## 已部署完成

- ✅ Admin 管理後台（含修正的 SaaS 用戶管理）
- ✅ Community Portal（含新的通知點 UI）
- ✅ Firebase Hosting 路由配置已更新

---

## 通知點頁面功能說明

### 訪問方式

**本地開發**：
- URL: `http://localhost:3003/community/notification-points`
- （Port 可能是 3002 或 3003，視哪個可用）

**生產環境**：
- URL: `https://safe-net-tw.web.app/community/notification-points`
- 需要先登入

---

## UI 設計（勾選式）

### 頁面佈局

```
┌─────────────────────────────────────┐
│  通知點管理                    共 X 個接收器，Y 個通知點
├─────────────────────────────────────┤
│  ℹ️ 如何使用                         │
│  - 勾選接收器，將其設定為通知點      │
│  - 當長者經過已勾選的接收器時...     │
├─────────────────────────────────────┤
│  ☑️ 社區大門                         │
│     台北市大安區...                  │
│     g-26-01-0001                    │
│     ✓ 已設為通知點                  │
│     自訂通知訊息：                   │
│     [長者經過社區大門_______________] [更新] │
├─────────────────────────────────────┤
│  ☐ 活動中心                         │
│     台北市大安區...                  │
│     g-26-01-0002                    │
├─────────────────────────────────────┤
│  ☑️ 社區公園                         │
│     台北市大安區...                  │
│     g-26-01-0003                    │
│     ✓ 已設為通知點                  │
└─────────────────────────────────────┘
```

### 操作說明

1. **勾選接收器**
   - 點擊勾選框
   - 該 gateway 立即成為通知點
   - 顯示「已設為通知點」綠色標籤
   - 下方出現自訂訊息輸入框

2. **設定自訂訊息**
   - 在輸入框輸入訊息
   - 點擊「更新」按鈕
   - 訊息保存成功

3. **取消勾選**
   - 再次點擊勾選框
   - 通知點被停用
   - 自訂訊息仍保留

---

## 測試步驟

### 前置條件

1. **確認有 Gateway 資料**
   
   在 Admin 的「GateWay 管理」頁面：
   - [ ] 至少有一個接收器
   - [ ] 接收器的「所屬社區」已設定
   - [ ] 接收器狀態為「啟用」

2. **如果沒有 Gateway**
   
   在 Admin 新增：
   1. 前往「GateWay 管理」
   2. 點擊「新增閘道器」
   3. 填寫：
      ```
      接收點序號: g-26-01-0001（自動生成）
      名稱: 社區大門
      位置: 社區入口
      所屬社區: （選擇測試社區）
      類型: 安全區域
      ```
   4. 點擊「新增」

### 測試通知點功能

1. **登入 Community Portal**
   ```
   URL: https://safe-net-tw.web.app/community/login
   或本地: http://localhost:3003/community/login
   ```

2. **前往通知點頁面**
   - 點擊側邊欄「通知點」
   - 或訪問：`https://safe-net-tw.web.app/community/notification-points`

3. **確認頁面顯示**
   - [ ] 顯示藍色資訊框（「如何使用」）
   - [ ] 顯示所有社區的 gateways（卡片列表）
   - [ ] 每個 gateway 前面有勾選框

4. **勾選第一個 gateway**
   - [ ] 點擊勾選框
   - [ ] 勾選框打勾
   - [ ] 顯示「已設為通知點」綠色標籤
   - [ ] 下方出現「自訂通知訊息」輸入框和「更新」按鈕

5. **設定自訂訊息**
   - 在輸入框輸入：「長者經過社區大門」
   - 點擊「更新」
   - [ ] 顯示「自訂訊息已更新」
   - [ ] 訊息顯示在輸入框下方

6. **測試取消勾選**
   - 點擊勾選框取消勾選
   - [ ] 勾選框取消
   - [ ] 「已設為通知點」標籤消失
   - [ ] 自訂訊息輸入框隱藏

7. **重新勾選**
   - 再次勾選
   - [ ] 之前的自訂訊息仍然保留

---

## 如果頁面沒有顯示 Gateway

### 問題診斷

1. **開啟瀏覽器開發者工具（F12）**
   - 切換到 Console 標籤
   - 查看是否有錯誤訊息

2. **常見錯誤**

**錯誤**: `Missing or insufficient permissions`
- **原因**: Firestore Security Rules 限制
- **解決**: 確認 saas_users 記錄存在且 tenantId 正確

**錯誤**: `No gateways found`（Console 訊息）
- **原因**: 該社區沒有 gateway
- **解決**: 在 Admin「GateWay 管理」新增接收器

**畫面**: 「此社區暫無接收器」
- **原因**: gateway 的 tenantId 沒有設定或不匹配
- **解決**: 編輯 gateway，設定正確的所屬社區

### 檢查 Gateway 設定

在 Firestore Console 確認：

```javascript
// Collection: gateways
{
  id: "gateway_123",
  serialNumber: "g-26-01-0001",
  name: "社區大門",
  tenantId: "YOUR_TENANT_ID",  // ← 必須與登入用戶的 tenantId 相同
  type: "SAFE_ZONE",
  isActive: true
}
```

### 檢查 SaaS User 設定

在 Firestore Console 確認：

```javascript
// Collection: saas_users/{firebaseUid}
{
  firebaseUid: "abc123...",
  email: "admin@test.com",
  tenantId: "YOUR_TENANT_ID",  // ← 必須與 gateway 的 tenantId 相同
  role: "ADMIN",
  isActive: true
}
```

---

## 通知觸發邏輯

### 當長者經過通知點時

1. 設備上傳資料到 `receiveBeaconData` Function
2. Function 檢查設備的 `bindingType`
3. 如果是 `ELDER`：
   - 取得長者和社區資料
   - 查詢該 gateway 是否為通知點
   - 如果是 → 發送通知點通知（含自訂訊息）
   - 否則 → 發送一般位置更新通知
4. 記錄到 `elders/{id}/activities` 子集合
5. 顯示在「通知記錄」頁面

### 查詢條件

通知點觸發需要同時滿足：

```javascript
tenantNotificationPoints 集合查詢：
- tenantId == elder.tenantId
- gatewayId == gateway.id
- isActive == true
- notifyOnElderActivity == true
```

---

## 測試 LINE 通知

### 使用 Beacon Test 頁面

1. 在 Admin 前往「Line 通知測試」

2. 填寫資訊：
   ```
   UUID: （長者設備的 UUID）
   Major: （長者設備的 Major）
   Minor: （長者設備的 Minor）
   Gateway Serial: （通知點的 gateway serialNumber）
   ```

3. 點擊「發送測試資料」

4. **預期結果**：
   - [ ] Cloud Functions 日誌顯示「passed through notification point」
   - [ ] LINE 收到通知（標題：「通知點提醒」）
   - [ ] 通知內容包含自訂訊息
   - [ ] Community Portal「通知記錄」出現新記錄

---

## 當前狀態

- ✅ 本地開發伺服器運行中（port 3003）
- ✅ 已部署到生產環境
- ✅ firebase.json 路由配置正確
- ✅ 通知點 UI 為勾選式設計

---

## 立即測試

### 訪問生產環境

```
https://safe-net-tw.web.app/community/notification-points
```

**應該看到**：
- 登入頁面（如果未登入）
- 通知點管理頁面（如果已登入）
  - 藍色資訊框
  - Gateway 列表（如果有資料）
  - 每個 gateway 前面有勾選框

### 本地測試

```
http://localhost:3003/community/notification-points
```

功能相同，用於開發測試。

---

## 確認清單

部署完成後確認：

- [ ] `https://safe-net-tw.web.app/community` 可以訪問
- [ ] 登入功能正常
- [ ] 側邊欄「通知點」可以點擊
- [ ] 通知點頁面顯示 gateway 列表（如果有資料）
- [ ] 可以勾選/取消勾選 gateway
- [ ] 可以設定自訂訊息
- [ ] 訊息更新後保存成功

---

## 下一步

1. 訪問生產環境測試通知點功能
2. 在 Admin 確認有 gateway 資料
3. 勾選通知點並設定訊息
4. 使用 Beacon Test 測試 LINE 通知
5. 確認通知記錄顯示

需要協助請參考：
- `TESTING_NOTIFICATION_POINTS.md` - 完整測試指南
- `TEST_CHECKLIST.md` - 測試檢查表
