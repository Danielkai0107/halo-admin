# LINE LIFF 使用指南

## 正確的訪問方式

### ⚠️ 錯誤的訪問方式

- ❌ 直接訪問：`https://safe-net-tw.web.app/liff`（會顯示「缺少社區 ID 參數」錯誤）
- ❌ 只用 LIFF ID：`https://liff.line.me/2008889284-MuPboxSM`（缺少 tenantId）

### ✅ 正確的訪問方式

**完整的 LIFF 連結格式：**

```
https://liff.line.me/{LIFF_ID}?tenantId={社區ID}
```

**實際範例：**

```
https://liff.line.me/2008889284-MuPboxSM?tenantId=MWsT3I62yzygKPYl520f
```

## 🔧 設定步驟（完整流程）

### 步驟 1：在 LINE Developers Console 創建 LIFF

1. 進入您的 LINE Channel
2. 前往 LIFF 標籤頁
3. 點擊「Add」新增 LIFF app
4. 填寫設定：
   - **LIFF app name**: [社區名稱] 長者照護系統
   - **Size**: Full
   - **Endpoint URL**: `https://safe-net-tw.web.app/liff`
   - **Scope**: 勾選 `profile`, `openid`, `email`
   - **Bot link feature**: On (Aggressive)
5. 點擊「Add」後會獲得 **LIFF ID**（例如：`2008889284-MuPboxSM`）
6. 複製這個 LIFF ID

### 步驟 2：在後台管理系統設定社區

1. 登入後台管理系統
2. 進入「社區管理」
3. 找到要設定的社區，點擊「編輯」
4. 滾動到「LINE 通知設定」區塊
5. 填寫以下資訊：
   - **LINE LIFF ID**: `2008889284-MuPboxSM`（從步驟 1 複製）
   - **LIFF Endpoint URL**: `https://safe-net-tw.web.app/liff`
   - **Channel Access Token**: 從 LINE Developers > Messaging API 複製
   - **Channel Secret**: 從 LINE Developers > Basic settings 複製
6. 點擊「更新」儲存

### 步驟 3：複製 LIFF 連結

1. 回到「社區管理」列表頁面
2. 找到剛才設定的社區
3. 在「管理」欄位中，點擊 🔗（橘色的連結圖示）
4. 系統會自動生成完整連結並複製到剪貼簿
5. 會顯示類似：`https://liff.line.me/2008889284-MuPboxSM?tenantId=MWsT3I62yzygKPYl520f`

### 步驟 4：設定 LINE 圖文選單

1. 進入 LINE Official Account Manager
2. 前往「圖文選單」設定
3. 創建新的圖文選單或編輯現有的
4. 在某個區塊的「動作」中選擇「連結」
5. 貼上剛才複製的 LIFF 連結（完整的，含 tenantId 參數）
6. 儲存並發布圖文選單

### 步驟 5：設定 App 成員管理員

1. 在後台「社區管理」中，點擊該社區的 👥（App 成員管理）
2. 找到要設為管理員的成員
3. 點擊「設為管理員」按鈕
4. 管理員在 LIFF 中會有額外權限（新增長輩、分配警報）

## 🧪 測試流程

### 首次使用測試

1. 在 LINE App 中開啟您的 OA
2. 點擊圖文選單
3. 首次會進行 LINE Login 授權
4. 授權後應該會看到兩個 Tab：
   - 長輩管理
   - 警報管理

### 驗證功能

**一般成員可以：**

- 查看長輩列表
- 查看長輩詳情和行蹤記錄
- 查看警報列表
- 查看警報詳情

**管理員額外可以：**

- 新增長輩（長輩列表右上角有「+」按鈕）
- 分配警報給成員處理
- 接收被拒絕的警報通知

## ❓ 常見問題

### Q: 顯示「缺少社區 ID 參數」錯誤

**A**: 請確認：

1. 訪問的連結是否包含 `?tenantId=` 參數
2. 是否從 LINE 環境中開啟
3. 圖文選單中的連結是否完整

### Q: 顯示「找不到社區資料」錯誤

**A**: 請檢查：

1. tenantId 是否正確
2. 該社區是否存在於 Firestore 中

### Q: 顯示「此社區尚未設定 LINE LIFF ID」錯誤

**A**: 請在後台編輯社區，填寫「LINE LIFF ID」欄位

### Q: 顯示「您尚未加入此社區」錯誤

**A**: 此用戶需要先：

1. 在 App 中註冊帳號
2. 申請加入該社區
3. 管理員在後台「App 成員管理」中批准

## 🚀 快速部署

以後如果修改了 LIFF 代碼，可以使用以下命令快速部署：

```bash
# 使用腳本部署
./deploy-liff.sh

# 或手動執行
cd liff && npm run build && cd .. && \
mkdir -p dist/liff && cp -r liff/dist/* dist/liff/ && \
firebase deploy --only hosting
```

## 📞 完整的連結範例

**您的社區 LIFF 連結：**

```
https://liff.line.me/2008889284-MuPboxSM?tenantId=MWsT3I62yzygKPYl520f
```

這個連結：

- ✅ 包含 LIFF ID：`2008889284-MuPboxSM`
- ✅ 包含社區 ID：`MWsT3I62yzygKPYl520f`
- ✅ 可以直接設定到圖文選單
