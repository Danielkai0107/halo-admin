# SaaS 用戶密碼欄位修正

## 問題描述

在 Admin 管理後台的「SaaS 用戶管理」頁面，點擊「新增用戶」時，表單中沒有顯示密碼欄位。

## 原因分析

表單初始化時 `reset()` 函數沒有明確清空所有欄位，導致 `editingUser` 狀態可能有殘留，影響密碼欄位的顯示條件判斷。

## 修正內容

### 修改檔案
`src/pages/SaasUsersPage.tsx`

### 修正程式碼

**修正前**：
```typescript
const handleCreate = () => {
  setEditingUser(null);
  reset({
    role: 'ADMIN',
  });
  setShowModal(true);
};
```

**修正後**：
```typescript
const handleCreate = () => {
  setEditingUser(null);
  reset({
    email: '',
    password: '',    // ← 明確初始化密碼欄位
    name: '',
    phone: '',
    tenantId: '',
    role: 'ADMIN',
  });
  setShowModal(true);
};
```

## 表單欄位說明

### 新增用戶模式（editingUser = null）

顯示的欄位：
- ✅ Email（必填）
- ✅ **密碼**（必填，至少 6 個字元）← 修正後會顯示
- ✅ 姓名（必填）
- ✅ 電話（選填）
- ✅ 所屬社區（必填，下拉選單）
- ✅ 角色（必填，ADMIN/MEMBER）

### 編輯用戶模式（editingUser != null）

顯示的欄位：
- Email（停用，無法修改）
- **密碼欄位隱藏**（顯示黃色提示框）
- 姓名（可修改）
- 電話（可修改）
- 所屬社區（可修改）
- 角色（可修改）

## 測試步驟

### 1. 重新啟動 Admin

```bash
# 停止當前的 dev server（Ctrl+C）
npm run dev
```

### 2. 測試新增用戶

1. 訪問 `http://localhost:3000/saas-users`
2. 點擊「新增用戶」按鈕
3. **確認表單顯示**：
   - [ ] Email 輸入框
   - [ ] **密碼輸入框**（type="password"，佔位符："至少 6 個字元"）
   - [ ] 姓名輸入框
   - [ ] 電話輸入框
   - [ ] 所屬社區下拉選單
   - [ ] 角色下拉選單

### 3. 填寫表單

```
Email: test@community.com
密碼: test123456      ← 應該可以輸入
姓名: 測試管理員
電話: 0912345678
所屬社區: （選擇一個社區）
角色: 管理員
```

### 4. 提交並驗證

- [ ] 點擊「新增」
- [ ] **預期**：顯示「新增成功」
- [ ] **預期**：用戶出現在列表中
- [ ] **預期**：可以用此帳號登入 Community Portal

### 5. 測試編輯用戶

1. 點擊用戶列表中的「編輯」圖示
2. **確認表單顯示**：
   - [ ] Email（顯示但不可修改，灰色）
   - [ ] **密碼欄位不顯示**（正確行為）
   - [ ] 顯示黃色提示框：「注意：目前無法透過介面修改密碼...」
   - [ ] 姓名、電話、社區、角色都可修改

## 密碼欄位顯示邏輯

```typescript
{/* Password */}
{!editingUser && (  // ← 只有在新增模式才顯示
  <div>
    <label>密碼 <span className="text-red-500">*</span></label>
    <input
      type="password"
      {...register('password', { 
        required: !editingUser ? '請輸入密碼' : false,
        minLength: { value: 6, message: '密碼至少需要 6 個字元' }
      })}
      placeholder="至少 6 個字元"
    />
  </div>
)}
```

關鍵條件：
- `!editingUser` 為 true（新增模式）
- `editingUser` 為 null

## 如果還是沒有顯示密碼欄位

### 除錯步驟

1. **開啟瀏覽器開發者工具**（F12）

2. **檢查 Console**
   - 查看是否有錯誤訊息

3. **檢查 editingUser 狀態**
   - 在 handleCreate 函數加入 console.log：
   ```typescript
   const handleCreate = () => {
     console.log('Creating new user, editingUser:', editingUser);
     setEditingUser(null);
     // ...
   };
   ```

4. **檢查 DOM**
   - 在開發者工具的 Elements 標籤
   - 搜尋 "password"
   - 確認是否有密碼輸入框的 HTML 元素

5. **強制重新整理**
   - 按 Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)
   - 清除快取並重新載入

### 暫時解決方案

如果仍無法透過介面設定密碼，可以使用命令列腳本：

```bash
cd functions
node create-saas-user.cjs admin@test.com test123456 "測試管理員" TENANT_ID
```

但這應該不是必要的，因為程式碼中確實有密碼欄位。

## 驗證修正

編譯狀態：
- ✅ TypeScript 編譯通過
- ✅ Vite 建置成功
- ✅ 無警告錯誤

建議：
1. 重新啟動 dev server
2. 清除瀏覽器快取
3. 再次測試新增用戶功能

## 程式碼確認

表單邏輯正確：
- ✅ 新增模式：顯示密碼欄位（editingUser = null）
- ✅ 編輯模式：隱藏密碼欄位（editingUser != null）
- ✅ 表單初始化：所有欄位都有初始值
- ✅ 驗證規則：密碼必填且至少 6 個字元

---

## 快速測試

1. 停止 dev server（Ctrl+C）
2. 重新啟動：`npm run dev`
3. 訪問 `http://localhost:3000/saas-users`
4. 點擊「新增用戶」
5. **確認密碼欄位存在**
6. 填寫並提交
7. 測試登入 Community Portal

如果成功，問題已解決！
