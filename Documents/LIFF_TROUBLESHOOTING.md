# LIFF 地圖功能疑難排解指南

## 問題：打開 LIFF 沒有自動登入

### 可能原因與解決方案

#### 1. LIFF ID 配置問題

**檢查步驟**：
```bash
# 查看當前配置的 LIFF ID
cat liff/src/hooks/useAuth.ts | grep GLOBAL_LIFF_ID
```

**當前配置**：`2008889284-MuPboxSM`

**解決方案**：
1. 確認這是您的正確 LIFF ID
2. 到 LINE Developers Console 查看 LIFF ID
3. 如需更改，修改 `liff/src/hooks/useAuth.ts` 第 22 行

#### 2. 從外部瀏覽器打開

**現象**：
- 從 Chrome、Safari 等外部瀏覽器打開
- 不在 LINE 應用內

**解決方案**：
- ✅ LIFF 會自動跳轉到 LINE 登入頁面
- ✅ 登入後會返回到應用
- 這是**正常行為**

**建議使用方式**：
1. 在 LINE 中分享連結
2. 從 LINE 圖文選單開啟
3. 使用 LINE 內建瀏覽器

#### 3. LIFF 端點 URL 設定

**檢查**：在 LINE Developers Console 確認：
- Endpoint URL: `https://safe-net-tw.web.app/liff/map`
- 或: `https://safe-net-tw.web.app/liff`

#### 4. Firebase Hosting 配置

**檢查 firebase.json**：
```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/liff",
        "destination": "/liff/index.html"
      },
      {
        "source": "/liff/**",
        "destination": "/liff/index.html"
      }
    ]
  }
}
```
✅ 已正確配置

## 🔍 調試步驟

### 1. 檢查瀏覽器 Console

打開 Chrome DevTools（F12），查看 Console 輸出：

**正常輸出應該包含**：
```
Initializing LIFF with ID: 2008889284-MuPboxSM
LIFF initialized successfully
Is logged in: true
Is in client: true
Starting authentication...
Profile: {userId: "...", displayName: "..."}
```

**如果看到錯誤**：
- `LIFF initialization failed` → LIFF ID 錯誤
- `Authentication error` → Firebase 連接問題
- `User not logged in, redirecting to LINE login...` → 正在跳轉登入（正常）

### 2. 檢查網路請求

在 Network 標籤檢查：
- LIFF API 請求（access.line.me）
- Firebase API 請求
- Cloud Functions 請求

### 3. 測試不同環境

| 環境 | 是否自動登入 | 說明 |
|------|-------------|------|
| LINE 內建瀏覽器 | ✅ 是 | 最佳體驗 |
| LINE 外部瀏覽器 | ⚠️ 需跳轉 | 會跳轉到 LINE 登入 |
| 桌面瀏覽器 | ⚠️ 需跳轉 | 會跳轉到 LINE 登入 |

## 🔧 手動測試

### 方法 1：從 LINE 分享
1. 在 LINE 中開啟任何聊天
2. 貼上連結：`https://liff.line.me/2008889284-MuPboxSM/map`
3. 點擊連結
4. 應該會自動登入

### 方法 2：設定 LINE 圖文選單
1. 到 LINE Official Account Manager
2. 設定圖文選單
3. 動作類型：連結
4. URL：`https://liff.line.me/2008889284-MuPboxSM/map`

### 方法 3：QR Code
創建 QR Code 連結到：
```
https://liff.line.me/2008889284-MuPboxSM/map
```

## 🐛 常見錯誤

### Error: "LIFF ID is not valid"
**解決**：
1. 檢查 LIFF ID 格式
2. 確認 LIFF 已在 LINE Developers Console 創建
3. 確認 LIFF 狀態為「已發布」

### Error: "Endpoint URL is not match"
**解決**：
1. 到 LINE Developers Console
2. 檢查 LIFF 的 Endpoint URL
3. 確保設定為：`https://safe-net-tw.web.app/liff`

### 一直顯示「正在載入...」
**可能原因**：
- Firebase 配置錯誤
- Firestore 規則限制
- 網路連接問題

**解決**：
1. 檢查 `liff/src/config/firebase.ts` 配置
2. 檢查 Firestore 規則允許讀取 `line_users`、`tenants`
3. 檢查網路連接

## 📱 建議的開啟方式

### ✅ 推薦方式
1. **從 LINE 應用內開啟**
   - 透過圖文選單
   - 透過分享連結
   - 透過 LINE 官方帳號訊息

2. **使用完整 LIFF URL**
   ```
   https://liff.line.me/2008889284-MuPboxSM/map
   ```

### ⚠️ 不推薦方式
- 直接從外部瀏覽器開啟 `https://safe-net-tw.web.app/liff/map`
- 需要手動跳轉到 LINE 登入

## 🔄 重新部署（如有修改）

如果修改了代碼，重新部署：

```bash
# 前端
cd liff
npm run build
cd ..
firebase deploy --only hosting

# 後端（如有修改）
cd functions
npm run build
cd ..
firebase deploy --only functions
```

## 📞 需要幫助？

### 檢查清單
- [ ] LIFF ID 正確
- [ ] LINE Developers Console 中 LIFF 狀態為「已發布」
- [ ] Endpoint URL 設定正確
- [ ] Firebase Hosting 已部署
- [ ] 從 LINE 內開啟連結
- [ ] 檢查瀏覽器 Console 輸出

### 調試工具
1. **Chrome DevTools** - 查看 Console 和 Network
2. **LINE LIFF Inspector** - LINE 提供的調試工具
3. **Firebase Console** - 查看 Firestore 和 Functions 日誌

## 💡 快速測試

**最簡單的測試方法**：
1. 打開 LINE 應用
2. 找到任何聊天室
3. 輸入並發送：`https://liff.line.me/2008889284-MuPboxSM/map`
4. 點擊連結
5. 應該會看到地圖載入

如果這樣可以正常登入，表示系統正常運作！
