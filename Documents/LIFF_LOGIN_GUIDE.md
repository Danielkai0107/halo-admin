# LIFF 登入問題解決指南

## 問題：瀏覽器打得開 LIFF 但登入不了

### 症狀
- 可以訪問 https://safe-net-tw.web.app/liff/map
- 頁面可以載入
- 但一直卡在登入畫面或顯示錯誤

### 原因分析

#### 情況 1：從外部瀏覽器開啟（Chrome、Safari 等）
**這是正常的！** LIFF 設計為在 LINE 應用內使用。

**解決方法**：
1. **複製連結**：
   ```
   https://liff.line.me/2008889284-MuPboxSM/map
   ```

2. **在 LINE 中開啟**：
   - 打開 LINE 應用
   - 找到任何聊天室
   - 貼上連結並發送
   - 點擊連結開啟

3. 或直接在 LINE 中輸入給自己（記事本）：
   - 開啟「記事本」聊天
   - 貼上連結
   - 點擊開啟

#### 情況 2：LIFF ID 配置問題

**檢查步驟**：
1. 到 LINE Developers Console
2. 進入您的 Provider
3. 選擇 Channel（Messaging API）
4. 點擊「LIFF」標籤
5. 確認 LIFF ID 是否為：`2008889284-MuPboxSM`

**如果不同**：
需要更新 `liff/src/hooks/useAuth.ts` 第 22 行：
```typescript
const GLOBAL_LIFF_ID = '您的實際LIFF_ID';
```

#### 情況 3：LIFF Endpoint URL 設定錯誤

**在 LINE Developers Console 檢查**：
- LIFF 的 Endpoint URL 應該設定為：
  ```
  https://safe-net-tw.web.app/liff
  ```
  或
  ```
  https://safe-net-tw.web.app/liff/map
  ```

#### 情況 4：LIFF 狀態未發布

**檢查**：
- LIFF 狀態必須是「已發布」（Published）
- 不能是「草稿」（Draft）

## 🛠️ 逐步排查

### Step 1：確認 LIFF 設定

在 LINE Developers Console 確認：
```
✅ LIFF ID: 2008889284-MuPboxSM
✅ Endpoint URL: https://safe-net-tw.web.app/liff
✅ 狀態: 已發布
✅ Scope: profile, openid
```

### Step 2：檢查瀏覽器 Console

按 F12 開啟 DevTools，查看 Console：

**正常的輸出**：
```
Initializing LIFF with ID: 2008889284-MuPboxSM
LIFF initialized successfully
Is logged in: true/false
Is in client: true/false
```

**如果看到錯誤**：
```
LIFF initialization failed: [錯誤訊息]
```
請提供錯誤訊息，我可以幫您診斷。

### Step 3：測試登入流程

**測試 1 - LINE 內開啟**：
```
1. 在 LINE 應用內開啟連結
2. 應該自動登入
3. 看到地圖畫面
```

**測試 2 - 外部瀏覽器**：
```
1. 在 Chrome 開啟連結
2. 看到「User not logged in, redirecting to LINE login...」
3. 自動跳轉到 LINE 登入頁面
4. 登入後返回應用
```

## 🔧 可能的解決方案

### 方案 1：清除快取並重新載入
```
1. 按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)
2. 強制重新載入頁面
```

### 方案 2：確認 LIFF 權限
在 LINE Developers Console 確認 LIFF 的權限範圍（Scopes）：
```
✅ profile
✅ openid
```

### 方案 3：檢查 LINE 帳號狀態
- 確認 LINE 帳號正常
- 確認網路連接正常
- 嘗試登出 LINE 再重新登入

### 方案 4：使用正確的連結格式
**不要用**：
```
❌ https://safe-net-tw.web.app/liff/map
```

**應該用**：
```
✅ https://liff.line.me/2008889284-MuPboxSM/map
```

## 📱 正確的使用流程

```
1. 在 LINE 應用中
   ↓
2. 開啟連結：https://liff.line.me/2008889284-MuPboxSM/map
   ↓
3. LIFF 自動初始化
   ↓
4. 檢查登入狀態
   ↓
5. 如果已登入 → 直接顯示地圖
   如果未登入 → 自動跳轉 LINE 登入
   ↓
6. 登入成功後返回應用
   ↓
7. 查詢或創建 line_users 記錄
   ↓
8. 顯示地圖畫面
```

## 🆘 仍然無法登入？

請提供以下資訊：
1. **使用的瀏覽器/環境**：LINE 內？Chrome？Safari？
2. **錯誤訊息**：Console 中的錯誤（按 F12 查看）
3. **卡在哪個步驟**：一直載入？顯示錯誤？跳轉失敗？

我可以根據具體情況進一步協助！

## 💡 臨時測試方案

如果想快速測試功能，可以開啟 Mock 模式：

1. 修改 `liff/src/config/mockMode.ts`：
   ```typescript
   export const MOCK_MODE = true;  // 改為 true
   ```

2. 重新編譯和部署：
   ```bash
   cd liff
   npm run build
   cd ..
   firebase deploy --only hosting
   ```

3. 現在可以不需要 LINE 登入直接測試功能

**注意**：Mock 模式僅用於開發測試，正式環境應該關閉。
