# LINE Developers Console 完整設定指南

## 第一步：創建 LINE Official Account（如已有可跳過）

1. 前往 https://manager.line.biz/
2. 創建新的 Official Account
3. 完成基本設定

## 🔧 第二步：設定 LINE Developers Console

### A. 進入 Providers 和 Channel

1. 前往 https://developers.line.biz/console/
2. 選擇您的 Provider（或創建新的）
3. 選擇您的 Messaging API Channel

---

## 📋 第三步：LIFF 設定（重要！）

### 在 LINE Developers Console 中設定 LIFF

**位置**：Channel 設定 → LIFF 標籤

1. 點擊「Add」按鈕新增 LIFF app

2. **填寫 LIFF 設定**：

   **LIFF app name（必填）**

   ```
   [您的社區名稱] 長者照護系統
   例如：大愛社區 長者照護系統
   ```

   **Size（必填）**

   ```
   選擇：Full
   ```

   ✅ 這樣 LIFF 會佔滿整個畫面

   **Endpoint URL（必填）**

   ```
   https://safe-net-tw.web.app/liff
   ```

   ⚠️ 注意：末尾沒有斜線 `/`

   **Scope（必填，請全部勾選）**
   - ☑️ `profile` - 取得用戶的顯示名稱、頭像等
   - ☑️ `openid` - OpenID Connect 身份驗證
   - ☑️ `email` - 取得用戶的 email（如果有）

   **Bot link feature（選填）**

   ```
   選擇：On (Aggressive) 或 On (Normal)
   ```

   這樣可以讓用戶加入您的 OA 好友

   **Scan QR（選填）**

   ```
   不用勾選
   ```

   **Module mode（選填）**

   ```
   不用勾選
   ```

3. **點擊「Add」按鈕**

4. **複製 LIFF ID**
   - 創建成功後會顯示 LIFF ID
   - 格式類似：`2008889284-MuPboxSM`
   - 請妥善保存這個 ID！

---

## 🔑 第四步：取得 Channel Access Token

**位置**：Channel 設定 → Messaging API 標籤

1. 滾動到「Channel access token (long-lived)」區塊
2. 如果沒有 token，點擊「Issue」按鈕
3. 複製生成的 Token（很長的字串）
4. **重要**：這個 Token 只會顯示一次，請妥善保存

---

## 🔐 第五步：取得 Channel Secret

**位置**：Channel 設定 → Basic settings 標籤

1. 找到「Channel secret」欄位
2. 點擊「Show」按鈕
3. 複製顯示的 Secret
4. 妥善保存

---

## 💾 第六步：在後台管理系統填寫設定

1. 登入後台：https://safe-net-tw.web.app/
2. 進入「社區管理」
3. 找到您的社區，點擊「編輯」
4. 滾動到「LINE 通知設定」區塊
5. 填寫以下四個欄位：

   ```
   LINE LIFF ID: 2008889284-MuPboxSM
   （從第三步複製）

   LIFF Endpoint URL: https://safe-net-tw.web.app/liff
   （固定值）

   Channel Access Token: eyJhbGciOiJIUzI1NiJ9...
   （從第四步複製，很長的字串）

   Channel Secret: abc123def456...
   （從第五步複製）
   ```

6. 點擊「更新」儲存

---

## 📲 第七步：複製 LIFF 連結到圖文選單

### 在後台管理系統

1. 回到「社區管理」列表頁面
2. 找到剛才設定的社區
3. 在「管理」欄位中，點擊 🔗（橘色連結圖示）
4. 系統會彈出提示並自動複製連結
5. 複製的格式類似：
   ```
   https://liff.line.me/2008889284-MuPboxSM?tenantId=MWsT3I62yzygKPYl520f
   ```

### 在 LINE Official Account Manager

1. 前往 https://manager.line.biz/
2. 選擇您的 OA
3. 前往「圖文選單」（Rich Menu）
4. 創建新的圖文選單或編輯現有的
5. 選擇一個區塊，設定動作：
   - 類型：連結（Link）
   - URL：貼上剛才複製的完整 LIFF 連結
6. 儲存並發布圖文選單

---

## ✅ 完整設定檢查清單

在 LINE Developers Console 檢查：

- [ ] 已創建 LIFF app
- [ ] LIFF Size 設為 Full
- [ ] LIFF Endpoint URL 設為 `https://safe-net-tw.web.app/liff`
- [ ] LIFF Scope 包含 `profile`, `openid`, `email`
- [ ] 已複製 LIFF ID（格式：`xxxxxxxxxx-xxxxxxxx`）
- [ ] 已發行 Channel Access Token
- [ ] 已複製 Channel Secret

在後台管理系統檢查：

- [ ] 社區的「LINE LIFF ID」已填寫
- [ ] 社區的「LIFF Endpoint URL」已填寫
- [ ] 社區的「Channel Access Token」已填寫
- [ ] 社區的「Channel Secret」已填寫
- [ ] 已點擊 🔗 按鈕複製 LIFF 連結

在 LINE OA Manager 檢查：

- [ ] 圖文選單已設定
- [ ] 圖文選單中的連結是完整的（含 `?tenantId=` 參數）
- [ ] 圖文選單已發布

---

## 🧪 測試步驟

1. **在 LINE App 中開啟您的 OA**
2. **點擊圖文選單**
3. **預期結果**：
   - 首次使用會要求 LINE Login 授權
   - 授權後應該看到載入畫面
   - 然後顯示「長者管理」和「警報管理」兩個 Tab

---

## ❌ 如果還是失敗，請檢查

### 常見問題 1：LIFF ID 錯誤

**錯誤訊息**：LIFF initialization failed
**解決方法**：

- 確認後台填寫的 LIFF ID 是否正確
- LIFF ID 格式應為：`數字-英數字`（例如：`2008889284-MuPboxSM`）

### 常見問題 2：缺少 tenantId

**錯誤訊息**：缺少社區 ID 參數
**解決方法**：

- 確認圖文選單中的連結是否包含 `?tenantId=` 參數
- 應該是：`https://liff.line.me/{LIFF_ID}?tenantId={社區ID}`

### 常見問題 3：CORS 或網路錯誤

**解決方法**：

- 確認 Endpoint URL 設定正確
- 確認應用已成功部署到 Firebase

### 常見問題 4：找不到社區資料

**錯誤訊息**：找不到社區資料
**解決方法**：

- 確認 tenantId 是否正確
- 檢查 Firestore 中是否存在該社區

---

## 📞 需要協助？

如果您能提供以下資訊，我可以幫您檢查：

1. LINE Developers Console 的截圖（LIFF 設定頁面）
2. 後台社區管理中的 LINE 設定截圖
3. 圖文選單中設定的連結
4. 完整的錯誤訊息
