# Community Portal 測試檢查表

## 快速測試（15 分鐘）

### 前置準備

```bash
# 終端機 1: Admin
npm run dev
# → http://localhost:3000

# 終端機 2: Community Portal
cd community-portal && npm run dev
# → http://localhost:3002
```

---

## 測試 1: 建立 SaaS 用戶（2 分鐘）

- [ ] 訪問 Admin: `http://localhost:3000/saas-users`
- [ ] 點擊「新增用戶」
- [ ] 填寫資訊：
  ```
  Email: admin@test.com
  密碼: test123456
  姓名: 測試管理員
  社區: （選擇有 gateway 的社區）
  角色: 管理員
  ```
- [ ] 點擊「新增」
- [ ] 確認用戶出現在列表中

**如果失敗**：檢查是否有可選擇的社區（先在「Line OA 管理」建立）

---

## 測試 2: 登入 Community Portal（1 分鐘）

- [ ] 訪問: `http://localhost:3002/community/login`
- [ ] 輸入剛建立的 Email 和密碼
- [ ] 點擊「登入」
- [ ] **預期**：重定向到長者管理頁面
- [ ] **預期**：頂部顯示社區名稱
- [ ] **預期**：側邊欄顯示所有功能選單

**如果失敗**：

- 開啟瀏覽器開發者工具（F12）
- 查看 Console 錯誤訊息
- 參考 `TESTING_NOTIFICATION_POINTS.md` 的除錯步驟

---

## 測試 3: 設備清單（2 分鐘）

- [ ] 在 Community Portal 點擊「設備清單」
- [ ] **預期**：顯示有該社區 tag 的設備
- [ ] **預期**：顯示綁定狀態、電池、信號
- [ ] 測試篩選器（全部/已綁定/未綁定）

**如果沒有顯示設備**：

1. 在 Admin「Beacon 管理」檢查：
   - [ ] 是否有設備
   - [ ] tags 欄位是否包含社區 ID
   - [ ] isActive 是否為 true

2. 修正方法：
   - 編輯設備
   - tags 輸入：`社區ID,批次2024`（逗號分隔）
   - 儲存

3. 重新整理 Community Portal 頁面

---

## 測試 4: 通知點勾選（3 分鐘）

- [ ] 在 Community Portal 點擊「通知點」
- [ ] **預期**：顯示社區的所有 gateways（列表）
- [ ] **預期**：每個 gateway 前面有勾選框

**如果沒有顯示 gateways**：

1. 在 Admin「GateWay 管理」檢查：
   - [ ] 是否有接收器
   - [ ] tenantId 是否設定為該社區
   - [ ] isActive 是否為 true

2. 修正方法：
   - 編輯 gateway
   - 設定所屬社區
   - 儲存

3. 重新整理 Community Portal 頁面

**測試勾選功能**：

- [ ] 勾選一個 gateway
- [ ] **預期**：顯示「已設為通知點」綠色標籤
- [ ] **預期**：下方出現「自訂通知訊息」輸入框
- [ ] 輸入訊息：「長者經過社區大門」
- [ ] 點擊「更新」
- [ ] **預期**：顯示「自訂訊息已更新」

---

## 測試 5: 長者管理（2 分鐘）

- [ ] 點擊「長者管理」
- [ ] 點擊「新增長者」
- [ ] 填寫基本資訊
- [ ] 點擊「新增」
- [ ] **預期**：長者出現在列表中
- [ ] 點擊長者卡片查看詳情
- [ ] **預期**：顯示完整資訊

---

## 測試 6: LINE 通知觸發（5 分鐘）

### 前置條件檢查

在開始前確認：

**A. 長者已綁定設備**

- [ ] 在 Community Portal「長者管理」
- [ ] 點擊長者詳情
- [ ] 確認有顯示綁定的設備

**B. 社區有 LINE 設定**

- [ ] 在 Admin「Line OA 管理」
- [ ] 確認 lineChannelAccessToken 有值

**C. 有 LINE 接收者**

- [ ] 在 Firestore Console 查看 `tenants/{id}/members`
- [ ] 確認有 status='APPROVED' 的成員
- [ ] 查看對應的 appUsers 有 lineUserId

### 發送測試通知

**方法 A：使用 Beacon Test（推薦）**

1. 在 Admin 訪問「Line 通知測試」
2. 填寫表單：
   - UUID: 長者設備的 UUID
   - Major: 長者設備的 Major
   - Minor: 長者設備的 Minor
   - Gateway Serial: 通知點的 gateway serialNumber
3. 點擊「發送測試資料」
4. 等待 5-10 秒

**方法 B：使用實際設備**

1. 將實際 Beacon 設備靠近通知點的接收器
2. 等待資料自動上傳

### 驗證結果

- [ ] LINE 收到通知（檢查 LINE OA）
- [ ] 通知標題：「通知點提醒」
- [ ] 通知內容包含自訂訊息
- [ ] 顯示長者姓名、地點、時間
- [ ] 有「查看地圖」按鈕

- [ ] Community Portal「通知記錄」出現新記錄
- [ ] 顯示正確的時間、長者、位置

### 如果沒收到通知

1. **檢查 Cloud Functions 日誌**：

   ```bash
   firebase functions:log --only receiveBeaconData --lines 50
   ```

2. **查看關鍵訊息**：
   - ✅ 「Elder xxx passed through notification point」
   - ❌ 「No approved members found」→ 沒有社區成員
   - ❌ 「has no LINE Channel Access Token」→ 沒有 LINE 設定
   - ❌ 錯誤訊息 → 檢查錯誤內容

3. **使用除錯工具**：
   - 在 `TESTING_NOTIFICATION_POINTS.md` 查看完整除錯步驟

---

## 測試 7: 通知記錄查詢（2 分鐘）

- [ ] 在 Community Portal 點擊「通知記錄」
- [ ] **預期**：顯示已發送的通知記錄
- [ ] 測試日期範圍篩選
- [ ] 測試按長者篩選
- [ ] 點擊記錄查看詳細資訊

---

## 完整測試通過標準

所有以下項目打勾表示功能正常：

- [ ] 可以在 Admin 建立 SaaS 用戶
- [ ] 可以用 SaaS 帳號登入 Community Portal
- [ ] 設備清單顯示正確的設備
- [ ] 可以從 gateway 列表勾選通知點
- [ ] 可以設定自訂通知訊息
- [ ] 長者經過通知點時收到 LINE 通知
- [ ] 通知內容包含自訂訊息
- [ ] 通知記錄正確顯示

---

## 時間估算

- 基本功能測試：15 分鐘
- LINE 通知測試：10 分鐘（含等待時間）
- 完整測試：30 分鐘

---

## 測試環境要求

### 必須有的資料

1. **至少一個社區**（tenants 集合）
   - 有 lineChannelAccessToken

2. **至少一個 gateway**（gateways 集合）
   - tenantId 設為測試社區
   - isActive = true

3. **至少一個設備**（devices 集合）
   - tags 包含測試社區 ID
   - isActive = true

4. **至少一個 LINE 接收者**
   - appUsers 有 lineUserId
   - tenants/{id}/members 有 APPROVED 成員

### 如果缺少資料

在 Admin 管理後台建立：

- 社區：「Line OA 管理」頁面
- Gateway：「GateWay 管理」頁面
- 設備：「Beacon 管理」頁面
- LINE 成員：使用 LIFF app 加入

---

## 快速指令

```bash
# 開發
npm run dev                           # Admin
cd community-portal && npm run dev    # Community Portal

# 建置
npm run build                         # Admin
cd community-portal && npm run build  # Community Portal
cd functions && npm run build         # Functions

# 部署
./deploy-all.sh                       # 互動式部署

# 查看日誌
firebase functions:log --only receiveBeaconData
```

---

## 完成！

所有修正已完成，可以開始測試。

建議測試順序：

1. 基本功能（登入、設備清單）→ 5 分鐘
2. 通知點勾選 → 3 分鐘
3. LINE 通知測試 → 10 分鐘

如遇問題，參考：

- `TESTING_NOTIFICATION_POINTS.md` - 詳細測試指南
- `CHANGES_COMMUNITY_PORTAL.md` - 變更摘要
