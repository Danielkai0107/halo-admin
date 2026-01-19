# LINE LIFF 應用部署指南

## 已完成項目

### 1. 後台功能擴充
- ✅ Alert 資料模型添加分配欄位（assignedTo, assignedAt, assignmentStatus）
- ✅ 社區管理頁面添加「複製 LIFF 連結」按鈕
- ✅ Tenant 資料模型添加 LINE 設定欄位（lineLiffId, lineLiffEndpointUrl, lineChannelAccessToken, lineChannelSecret）
- ✅ App 用戶和成員管理顯示 LINE 資訊（lineUserId, lineDisplayName, linePictureUrl）

### 2. LIFF 應用
- ✅ 專案結構建立（/liff 目錄）
- ✅ 依賴安裝完成
- ✅ Firebase 和 LIFF SDK 配置
- ✅ 身份驗證 Hook (useAuth)
- ✅ 長輩管理功能（列表、詳情、新增）
- ✅ 警報管理功能（列表、詳情）

### 3. Firebase Cloud Functions
- ✅ Functions 專案建立（/functions 目錄）
- ✅ assignAlert - 分配警報並發送 LINE 通知
- ✅ acceptAlertAssignment - 接受警報處理
- ✅ declineAlertAssignment - 拒絕警報處理

### 4. 部署
- ✅ LIFF 應用已部署到：https://safe-net-tw.web.app/liff
- ✅ Cloud Functions 已部署（us-central1）

## 使用方式

### 1. 在 LINE Developers Console 設定 LIFF

**為每個社區創建獨立的 LIFF app：**
- **LIFF app name**: [社區名稱] 長者照護系統
- **Size**: Full ✅
- **Endpoint URL**: `https://safe-net-tw.web.app/liff` ✅
- **Scope**: 勾選 `profile`, `openid`, `email`
- **Bot link feature**: 選擇 On (Aggressive) 或 On (Normal)
- 創建後會獲得 **LIFF ID**（格式：`1234567890-abcdefgh`）

### 2. 在後台管理系統設定社區

進入「社區管理」→ 編輯社區 → 填寫「LINE 通知設定」：

1. **LINE LIFF ID**: 從 LINE Developers 複製 LIFF ID（例如：`2008889284-MuPboxSM`）⭐
2. **LIFF Endpoint URL**: `https://safe-net-tw.web.app/liff`
3. **Channel Access Token**: 從 Messaging API 設定中複製
4. **Channel Secret**: 從基本設定中複製

### 3. 複製並設定圖文選單連結

1. 在社區管理列表中，找到要設定的社區
2. 點擊「管理」欄位中的 🔗 (複製 LIFF 連結) 按鈕
3. 系統會自動生成標準 LINE LIFF URL：`https://liff.line.me/{LIFF_ID}?tenantId={社區ID}`
   - 例如：`https://liff.line.me/2008889284-MuPboxSM?tenantId=MWsT3I62yzygKPYl520f`
4. 將此連結設定到 LINE OA 的圖文選單中

### 4. 設定 App 成員管理員

1. 進入「社區管理」→ 點擊 👥 (App 成員管理)
2. 找到要設為管理員的成員
3. 點擊「設為管理員」按鈕
4. 管理員可以在 LIFF 中新增長輩和分配警報

## LIFF 應用功能

### 長輩管理 Tab
- 查看所有長輩列表
- 點擊進入長輩詳情（基本資料、緊急聯絡人、設備資訊、行蹤記錄）
- 管理員可以新增長輩

### 警報管理 Tab
- 查看所有警報列表
- 點擊進入警報詳情
- 管理員可以分配警報給成員處理
- 被分配者會收到 LINE 通知

## 測試流程

1. **設定 LIFF**: 在 LINE Developers Console 完成設定
2. **設定社區**: 在後台填寫 LINE 設定並複製連結
3. **設定圖文選單**: 將 LIFF 連結加入 LINE OA 圖文選單
4. **測試訪問**: 從 LINE OA 點擊圖文選單，應該會開啟 LIFF 應用
5. **驗證身份**: 首次使用會進行 LINE Login
6. **確認權限**: 查看是否能正常瀏覽長輩和警報資料

## 注意事項

- 每個社區使用獨立的 LIFF ID（在 LINE Developers Console 中需要為每個社區創建獨立的 LIFF app）
- 確保社區的 Channel Access Token 和 Secret 正確設定
- 管理員權限在「社區管理 → App 成員管理」中設定
- LIFF 連結包含 tenantId 參數，不同社區有不同的連結
