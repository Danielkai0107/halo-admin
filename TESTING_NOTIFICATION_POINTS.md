# 通知點功能測試指南

## 修正內容總結

### 1. 設備清單查詢修正

- **問題**：tags 查詢格式錯誤，使用了 `tenant_${tenantId}` 但實際是直接存 `tenantId`
- **修正**：改為 `where('tags', 'array-contains', tenantId)`
- **影響**：現在可以正確顯示有該社區 tag 的設備

### 2. 通知點管理 UI 重新設計

- **問題**：原本是用 Modal 新建通知點
- **修正**：改為從現有 gateway 列表中勾選
- **新功能**：
  - 顯示所有社區的 gateways
  - 勾選框切換通知點狀態
  - 直接在列表中編輯自訂通知訊息

### 3. LINE 通知觸發邏輯

- **實作**：已在 Cloud Functions 中正確處理
- **流程**：
  1. 長者綁定的設備經過 gateway
  2. 檢查該 gateway 是否為通知點
  3. 如果是，發送通知點的自訂訊息
  4. 記錄到活動記錄

---

## 完整測試流程

### 前置準備

**1. 確認 Firestore 有資料**

在 Firestore Console 確認：

- `tenants` 集合有測試社區
- `gateways` 集合有測試接收器（tenantId 設為該社區 ID）
- `devices` 集合有測試設備（tags 陣列包含社區 ID）
- `elders` 集合有測試長者（tenantId 設為該社區 ID）

**2. 建立測試 SaaS 用戶**

```bash
# 啟動 Admin
npm run dev

# 訪問 http://localhost:3000/saas-users
# 新增用戶並記下登入資訊
```

---

### 測試 1: 設備清單顯示

**目標**：確認設備清單能正確顯示有社區 tag 的設備

**步驟**：

1. 在 Admin 管理後台的「Beacon 管理」確認有設備，且 tags 包含社區 ID

   檢查設備的 tags 欄位：

   ```
   tags: ["YOUR_TENANT_ID", "批次2024"]
   ```

2. 啟動 Community Portal：

   ```bash
   cd community-portal
   npm run dev
   ```

3. 訪問 `http://localhost:3002/community/login` 並登入

4. 前往「設備清單」頁面

5. **預期結果**：
   - 顯示所有 tags 包含該社區 ID 的設備
   - 顯示綁定狀態（已綁定/未綁定）
   - 顯示電池電量、信號強度
   - 篩選器功能正常

6. **如果沒有顯示設備**：
   - 檢查瀏覽器 Console 的錯誤訊息
   - 確認設備的 tags 陣列包含正確的社區 ID
   - 確認設備的 isActive 為 true

---

### 測試 2: 通知點管理（新 UI）

**目標**：確認可以從 gateway 列表中勾選通知點

**步驟**：

1. 在 Admin 的「GateWay 管理」確認有接收器，tenantId 設為測試社區

2. 在 Community Portal 前往「通知點」頁面

3. **預期結果**：
   - 顯示所有社區的 gateways（列表式）
   - 每個 gateway 前面有勾選框
   - 顯示接收器名稱、位置、類型

4. 勾選一個接收器

5. **預期結果**：
   - 勾選框打勾
   - 顯示「已設為通知點」綠色標籤
   - 下方出現「自訂通知訊息」輸入框

6. 輸入自訂訊息（例如：「長者經過社區大門」）並點擊「更新」

7. **預期結果**：
   - 顯示「自訂訊息已更新」
   - 訊息保存成功

8. 取消勾選

9. **預期結果**：
   - 通知點被停用
   - 勾選框取消

**注意事項**：

- 只有 ADMIN 角色可以勾選/取消勾選
- MEMBER 角色只能查看

---

### 測試 3: LINE 通知觸發

**目標**：確認長者經過通知點時，正確發送 LINE 通知

**前置條件**：

- 長者已綁定設備
- 設備有社區 tag
- 社區有設定 LINE Channel Access Token
- 社區有 LINE LIFF 成員（appUsers 有 lineUserId）

**步驟**：

1. 在 Community Portal 確認：
   - 長者已綁定設備（長者詳情頁面可看到設備資訊）
   - 通知點已設定（勾選某個 gateway）

2. 確認社區設定：
   - 在 Admin「Line OA 管理」確認 lineChannelAccessToken 有值

3. 確認有 LINE 接收者：
   - 在 Firestore Console 查看 `appUsers` 集合
   - 確認有該社區成員且有 `lineUserId`
   - 或在 LIFF app 中確認有成員

4. 模擬長者經過通知點：

   **方法 A：使用 Beacon Test 頁面**
   - 在 Admin 的「Line 通知測試」頁面
   - 選擇長者綁定的設備（UUID/Major/Minor）
   - 選擇通知點的 gateway
   - 點擊「發送測試資料」

   **方法 B：使用實際 Beacon 設備**
   - 讓實際的 Beacon 設備靠近通知點的接收器
   - 等待資料上傳

5. **預期結果**：

   **在 LINE 中**：
   - 社區成員的 LINE 收到通知
   - 通知標題：「通知點提醒」
   - 通知內容：自訂訊息（或預設訊息）
   - 顯示長者姓名、地點、時間
   - 有「查看地圖」按鈕

   **在 Community Portal「通知記錄」**：
   - 出現新的通知記錄
   - 顯示長者姓名
   - 顯示接收器名稱
   - 顯示通知發送時間

6. **除錯步驟**（如果沒收到通知）：

   a. 檢查 Cloud Functions 日誌：

   ```bash
   firebase functions:log --only receiveBeaconData
   ```

   b. 查看日誌中的訊息：
   - 是否有「Elder xxx passed through notification point」
   - 是否有「No approved members found」
   - 是否有「has no LINE Channel Access Token」
   - 是否有錯誤訊息

   c. 確認通知點設定：
   - Firestore Console → tenantNotificationPoints
   - 確認：
     - tenantId 正確
     - gatewayId 正確
     - isActive = true
     - notifyOnElderActivity = true

   d. 確認社區成員：
   - Firestore Console → tenants/{id}/members
   - 確認有 status='APPROVED' 的成員
   - 記下 appUserId
   - 在 appUsers 集合確認該 appUserId 有 lineUserId

---

## 資料結構檢查清單

### devices 集合

```javascript
{
  uuid: "FDA50693-A4E2-4FB1-AFCF-C6EB07647825",
  major: 1,
  minor: 101,
  tags: ["YOUR_TENANT_ID"],  // ← 重要：直接是 tenantId
  bindingType: "ELDER",
  boundTo: "ELDER_ID",
  isActive: true
}
```

### gateways 集合

```javascript
{
  serialNumber: "g-26-01-0001",
  name: "社區大門",
  tenantId: "YOUR_TENANT_ID",  // ← 必須設定
  type: "SAFE_ZONE",
  isActive: true
}
```

### tenantNotificationPoints 集合

```javascript
{
  tenantId: "YOUR_TENANT_ID",
  gatewayId: "GATEWAY_ID",
  name: "社區大門",
  notificationMessage: "長者經過社區大門",  // 選填
  notifyOnElderActivity: true,
  isActive: true
}
```

### tenants 集合

```javascript
{
  name: "測試社區",
  code: "TEST001",
  lineChannelAccessToken: "YOUR_LINE_CHANNEL_ACCESS_TOKEN",  // ← 必須設定
  lineChannelSecret: "YOUR_LINE_CHANNEL_SECRET",
  isActive: true
}
```

### appUsers + tenants/members

```javascript
// appUsers 集合
{
  lineUserId: "U1234567890abcdef",  // ← LINE User ID
  lineDisplayName: "測試用戶",
  name: "測試用戶",
  email: "test@example.com",
  isActive: true
}

// tenants/{TENANT_ID}/members 子集合
{
  appUserId: "APP_USER_ID",  // ← 對應到上面的 appUsers 文件 ID
  role: "MEMBER",
  status: "APPROVED",  // ← 必須是 APPROVED
  createdAt: "2026-01-25T..."
}
```

---

## 快速驗證命令

### 檢查設備 tags

在 Firestore Console 執行查詢：

```
Collection: devices
Filters: tags array-contains YOUR_TENANT_ID
```

### 檢查 gateways

```
Collection: gateways
Filters: tenantId == YOUR_TENANT_ID
         isActive == true
```

### 檢查通知點

```
Collection: tenantNotificationPoints
Filters: tenantId == YOUR_TENANT_ID
         isActive == true
```

### 檢查 LINE 接收者

```
Collection: tenants/{YOUR_TENANT_ID}/members
Filters: status == APPROVED
```

然後查看對應的 appUsers 是否有 lineUserId

---

## 常見問題

### Q: 設備清單是空的

**檢查**：

1. Firestore Console → devices 集合
2. 確認 tags 陣列包含正確的社區 ID（不是 "tenant_xxx" 格式）
3. 確認 isActive = true

**修正**：
在 Admin「Beacon 管理」編輯設備，tags 輸入社區 ID

---

### Q: 通知點頁面是空的

**檢查**：

1. Firestore Console → gateways 集合
2. 確認 tenantId 欄位有值且等於測試社區 ID
3. 確認 isActive = true

**修正**：
在 Admin「GateWay 管理」編輯接收器，設定所屬社區

---

### Q: 勾選通知點後沒收到 LINE 通知

**檢查順序**：

1. **通知點設定**
   - tenantNotificationPoints 集合有記錄
   - isActive = true
   - notifyOnElderActivity = true

2. **社區 LINE 設定**
   - tenants 集合有 lineChannelAccessToken
   - Token 有效且正確

3. **有 LINE 接收者**
   - tenants/{id}/members 有 APPROVED 成員
   - appUsers 對應記錄有 lineUserId

4. **長者設備綁定**
   - 長者有 deviceId
   - 設備的 boundTo 等於長者 ID
   - 設備的 bindingType = 'ELDER'

5. **Cloud Functions 日誌**
   ```bash
   firebase functions:log --only receiveBeaconData
   ```
   查看是否有錯誤訊息

---

## 測試場景

### 場景 1: 基本通知點觸發

1. 設定通知點「社區大門」
2. 長者 A 綁定設備
3. 設備經過「社區大門」接收器
4. 社區成員收到 LINE 通知：「[長者A] 經過 社區大門」

### 場景 2: 自訂訊息

1. 設定通知點「社區大門」
2. 設定自訂訊息：「長者已安全回到社區」
3. 長者經過
4. 社區成員收到 LINE 通知：「長者已安全回到社區」

### 場景 3: 多個通知點

1. 設定多個通知點：「社區大門」、「活動中心」、「公園」
2. 長者經過不同位置
3. 每個位置都正確發送對應的通知

### 場景 4: 停用通知點

1. 取消勾選某個通知點
2. 長者經過該位置
3. 不發送通知（或發送一般通知，取決於其他設定）

---

## 部署更新

修改完成後需要重新部署：

```bash
# 編譯 Cloud Functions
cd functions
npm run build

# 編譯 Community Portal
cd ../community-portal
npm run build

# 部署
cd ..
firebase deploy --only functions,hosting
```

或使用部署腳本：

```bash
./deploy-all.sh
# 選擇：Community Portal (y), Functions (y)
```

---

## 監控與除錯

### 即時監控 Cloud Functions

```bash
# 開新終端機，持續監控日誌
firebase functions:log --only receiveBeaconData
```

### 查看特定時間的日誌

```bash
firebase functions:log --only receiveBeaconData --lines 100
```

### 關鍵日誌訊息

**成功觸發通知點**：

```
Elder [名稱] passed through notification point: [通知點名稱]
Sent notification point alert to member [LINE User ID]
```

**沒有通知點**：

```
No notification points for tenant [ID] at gateway [ID]
```

**沒有 LINE 接收者**：

```
No members with LINE accounts found for tenant [ID]
```

---

## 資料流程圖

```
設備上傳資料
    ↓
receiveBeaconData Function
    ↓
檢查設備綁定類型 = ELDER？
    ↓ 是
取得長者和社區資料
    ↓
檢查 gateway 是否為通知點？
    ├─ 是 → 發送通知點通知（含自訂訊息）
    └─ 否 → 發送一般位置更新通知
    ↓
記錄到 activities 子集合
    ↓
顯示在「通知記錄」頁面
```

---

## 成功標準

以下所有測試通過表示功能正常：

- [ ] 設備清單顯示正確數量的設備
- [ ] 可以看到設備的綁定狀態和電池資訊
- [ ] 通知點頁面顯示所有社區的 gateways
- [ ] 可以勾選/取消勾選通知點
- [ ] 可以設定和更新自訂通知訊息
- [ ] 長者經過通知點時，社區成員收到 LINE 通知
- [ ] 通知內容包含自訂訊息（如果有設定）
- [ ] 通知記錄正確顯示在「通知記錄」頁面

---

## 下一步

測試通過後：

1. 為實際社區設定通知點
2. 培訓Line OA 管理員使用
3. 收集使用回饋
4. 根據需求調整功能

---

## 需要協助？

如遇到問題：

1. 查看瀏覽器 Console 錯誤
2. 查看 Cloud Functions 日誌
3. 檢查 Firestore 資料結構
4. 參考此文檔的檢查清單
