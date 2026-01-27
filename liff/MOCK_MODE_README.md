# 切版模式使用說明

## 快速切換真實/假資料模式

本專案支援**切版模式 (Mock Mode)**，讓您可以在不需要真實 Firebase 和 LINE 登入的情況下進行 UI 開發和測試。

## 如何切換模式

只需要修改一個檔案中的一個參數：

### 檔案位置
```
liff/src/config/mockMode.ts
```

### 切換方法

1. **啟用切版模式（假資料）**
   ```typescript
   export const MOCK_MODE = true;  // 使用假資料，不需要登入
   ```

2. **啟用真實模式（正式環境）**
   ```typescript
   export const MOCK_MODE = false; // 使用真實 Firebase 資料和 LINE 登入
   ```

## 模式差異

### 切版模式 (MOCK_MODE = true)
- ✅ 不需要 LINE 登入
- ✅ 不需要 Firebase 連線
- ✅ 使用假的用戶和社區資料
- ✅ 所有功能都預設為管理員權限
- ✅ 可以快速查看和調整 UI
- ❌ 無法讀取真實資料
- ❌ 無法進行真實的 CRUD 操作

### 真實模式 (MOCK_MODE = false)
- ✅ 完整的 LINE 登入流程
- ✅ 連接真實 Firebase 資料庫
- ✅ 真實的用戶權限控制
- ✅ 可以進行所有 CRUD 操作
- ❌ 需要從 LINE 開啟或配置 LIFF
- ❌ 需要完整的 Firebase 設定

## 自訂假資料

您可以在 `liff/src/config/mockMode.ts` 中自訂假資料：

```typescript
export const MOCK_DATA = {
  // 自訂用戶資料
  user: {
    userId: 'mock-user-001',
    displayName: '您的名字',
    pictureUrl: 'https://example.com/avatar.jpg',
    email: 'your@email.com',
  },
  
  // 自訂社區資料
  tenant: {
    id: 'mock-tenant-001',
    name: '您的社區名稱',
    address: '您的社區地址',
    // ...
  },
  
  // 自訂權限
  permissions: {
    isAdmin: true,  // 設為 false 測試一般用戶權限
    isLoading: false,
    appUserId: 'mock-app-user-001',
  },
};
```

## 注意事項

1. **部署前務必切換到真實模式**
   ```typescript
   export const MOCK_MODE = false;
   ```

2. **切換模式後需要重新啟動開發伺服器**
   ```bash
   # 停止當前伺服器 (Ctrl+C)
   # 重新啟動
   npm run dev
   ```

3. **切版模式下的限制**
   - 無法測試真實的 Firebase Firestore 查詢
   - 無法測試 LINE LIFF API
   - 無法測試真實的通知推送
   - 資料不會持久化儲存

## 開發流程建議

1. **UI 開發階段** → 使用 `MOCK_MODE = true`
   - 快速開發和調整介面
   - 不需要擔心資料庫連線
   - 可以專注於前端邏輯

2. **功能測試階段** → 使用 `MOCK_MODE = false`
   - 測試真實的資料流
   - 驗證權限控制
   - 測試 Firebase 整合

3. **部署前** → 確認 `MOCK_MODE = false`
   - 雙重檢查配置
   - 執行完整測試
   - 確保所有功能正常

## 檔案結構

```
liff/
├── src/
│   ├── config/
│   │   └── mockMode.ts          ← 切換模式的配置檔
│   ├── hooks/
│   │   ├── useAuth.ts           ← 真實的 auth hook
│   │   └── useMockAuth.ts       ← 假資料的 auth hook
│   └── App.tsx                  ← 根據 MOCK_MODE 選擇使用哪個 hook
```

## 疑難排解

### 修改了 MOCK_MODE 但沒有生效？
- 確認檔案已儲存
- 重新啟動開發伺服器 (`npm run dev`)
- 清除瀏覽器快取 (Cmd+Shift+R 或 Ctrl+Shift+R)

### 切版模式下看不到資料？
- 這是正常的，因為不會連接 Firebase
- 您需要自己添加假資料到元件中，或修改 `MOCK_DATA` 配置

### 真實模式下無法登入？
- 檢查 Firebase 配置是否正確
- 確認 LIFF ID 設定正確
- 確認從 LINE 中開啟應用
