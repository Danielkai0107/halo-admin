# 認證隔離問題修正

## 問題描述

### 症狀
1. Admin 和 Community Portal 不能同時登入
2. 登入其中一個會登出另一個
3. 多個客戶同時使用會互相干擾

### 根本原因

**Firebase Auth 狀態衝突**：

兩個應用使用：
- 相同的 Firebase Project
- 相同的 Domain（safe-net-tw.web.app）
- 相同的 localStorage 存儲空間

導致認證狀態互相覆蓋：
```
Admin 登入 → localStorage['firebase:authUser:...'] = Admin User
Community Portal 登入 → localStorage['firebase:authUser:...'] = Community User (覆蓋)
回到 Admin → 發現認證變了 → 被登出
```

---

## 解決方案

### 技術實作

為每個應用設置**唯一的 Firebase App 實例名稱**：

**Admin（src/config/firebase.ts）**：
```typescript
const app = initializeApp(firebaseConfig, 'AdminApp');  // ← 唯一名稱
```

**Community Portal（community-portal/src/config/firebase.ts）**：
```typescript
const app = initializeApp(firebaseConfig, 'CommunityPortalApp');  // ← 唯一名稱
```

### 運作原理

Firebase SDK 會根據 app name 使用不同的 localStorage key：
```
AdminApp → firebase:authUser:AdminApp:...
CommunityPortalApp → firebase:authUser:CommunityPortalApp:...
```

這樣兩個應用的認證狀態就不會互相干擾。

---

## 驗證修正

### 測試步驟

**1. 清除瀏覽器快取**
```
1. 開啟瀏覽器開發者工具（F12）
2. Application 標籤 → Storage → Clear site data
3. 或使用無痕模式測試
```

**2. 測試同時登入**

**開兩個分頁**：

**分頁 1 - Admin**：
```
1. 訪問 https://safe-net-tw.web.app
2. 登入 Admin（SUPER_ADMIN 帳號）
3. 確認登入成功
```

**分頁 2 - Community Portal**：
```
1. 訪問 https://safe-net-tw.web.app/community
2. 登入 Community Portal（SaaS 用戶帳號）
3. 確認登入成功
```

**3. 驗證互不干擾**

切換回分頁 1（Admin）：
- [ ] Admin 仍保持登入狀態
- [ ] 沒有被登出
- [ ] 可以正常使用

切換到分頁 2（Community Portal）：
- [ ] Community Portal 仍保持登入狀態
- [ ] 沒有被登出
- [ ] 可以正常使用

**4. 檢查 localStorage**

在開發者工具的 Application 標籤：
```
Local Storage → https://safe-net-tw.web.app

應該看到兩組不同的 key：
- firebase:authUser:AdminApp:...
- firebase:authUser:CommunityPortalApp:...
```

---

## 多客戶同時使用

### 情境測試

**測試設定**：
- 客戶 A 登入社區 A
- 客戶 B 登入社區 B
- 客戶 C 登入社區 C

**預期結果**：
- ✅ 每個客戶獨立登入
- ✅ 互不干擾
- ✅ 同時操作無問題

### 原理

每個客戶使用：
- 不同的瀏覽器或設備
- 各自的 localStorage
- 各自的認證 token

只要不是：
- ❌ 同一台電腦
- ❌ 同一個瀏覽器
- ❌ 同一個用戶 profile

就不會互相干擾。

---

## 同一瀏覽器多帳號

### 支援情況

**✅ 支援的場景**：

1. **同一瀏覽器，不同分頁**
   - Admin 在分頁 1
   - Community Portal 在分頁 2
   - ✅ 可以同時登入

2. **同一瀏覽器，不同應用**
   - Admin（admin@company.com）
   - Community Portal（admin@community-a.com）
   - ✅ 可以同時登入

3. **不同瀏覽器**
   - Chrome 登入 Admin
   - Firefox 登入 Community Portal
   - ✅ 完全獨立

**❌ 不支援的場景**：

1. **同一應用，不同帳號**
   - Community Portal 登入社區 A
   - 同一分頁切換登入社區 B
   - ❌ 會登出社區 A（這是正常的）

2. **無痕模式限制**
   - 無痕模式關閉後認證會清除
   - 這是瀏覽器的正常行為

---

## 技術細節

### Firebase App 實例隔離

```typescript
// Admin
const adminApp = initializeApp(config, 'AdminApp');
const adminAuth = getAuth(adminApp);
// localStorage key: firebase:authUser:AdminApp:...

// Community Portal
const communityApp = initializeApp(config, 'CommunityPortalApp');
const communityAuth = getAuth(communityApp);
// localStorage key: firebase:authUser:CommunityPortalApp:...
```

### 持久化策略

使用 `browserLocalPersistence`：
- 認證狀態保存在 localStorage
- 瀏覽器關閉後仍保持登入
- 適合長期使用

如需更短期的 session：
```typescript
// 可選：使用 sessionStorage（關閉分頁就登出）
setPersistence(auth, browserSessionPersistence);
```

---

## 部署狀態

✅ **已部署修正版本**（2026-01-25 22:34）

修正內容：
1. Admin 使用 'AdminApp' 實例名稱
2. Community Portal 使用 'CommunityPortalApp' 實例名稱
3. 兩者認證狀態完全隔離

---

## 立即測試

### 快速驗證（2分鐘）

1. **開啟無痕視窗**（Cmd+Shift+N）

2. **開兩個分頁**：
   - 分頁 1：`https://safe-net-tw.web.app`（Admin）
   - 分頁 2：`https://safe-net-tw.web.app/community`（Community Portal）

3. **分別登入**：
   - 分頁 1 登入 Admin 帳號
   - 分頁 2 登入 Community Portal 帳號

4. **來回切換測試**：
   - 切換到分頁 1 → 應該仍然登入
   - 切換到分頁 2 → 應該仍然登入
   - 重複幾次確認

5. **✅ 成功標準**：
   - 兩個分頁都保持登入
   - 沒有互相登出
   - 可以正常操作

---

## 如果還是會登出

### 檢查步驟

**1. 清除所有快取**
```
開發者工具（F12）
→ Application
→ Storage
→ Clear site data
→ 勾選所有選項
→ Clear site data
```

**2. 確認部署版本**
```
開發者工具（F12）
→ Console
→ 輸入：localStorage
→ 查看是否有兩組不同的 firebase:authUser key
```

**3. 檢查是否為快取問題**
```
使用無痕模式測試（確保沒有舊快取）
```

### 可能的其他原因

**原因 1：瀏覽器擴充功能**
- 某些擴充功能可能干擾 localStorage
- 嘗試停用擴充功能

**原因 2：瀏覽器設定**
- 檢查是否啟用第三方 cookies
- 檢查 localStorage 是否被禁用

**原因 3：舊版本快取**
- 強制重新整理（Cmd+Shift+R）
- 或清除快取

---

## 進階解決方案（如果基本方案不夠）

### 方案 A：使用不同的持久化模式

**Admin 使用 localStorage**：
```typescript
setPersistence(auth, browserLocalPersistence);
```

**Community Portal 使用 sessionStorage**：
```typescript
import { browserSessionPersistence } from 'firebase/auth';
setPersistence(auth, browserSessionPersistence);
```

優點：完全隔離
缺點：Community Portal 關閉分頁就登出

### 方案 B：使用自訂 Storage Key

實作自訂的認證狀態管理：
```typescript
// 使用不同的 prefix
const ADMIN_STORAGE_PREFIX = 'admin_';
const COMMUNITY_STORAGE_PREFIX = 'community_';
```

### 方案 C：部署到不同的子域名

如果有自訂域名：
- Admin: `admin.safe-net.com`
- Community Portal: `community.safe-net.com`

完全不同的域名 = 完全不同的 localStorage

---

## 當前實作驗證

### 理論上應該有效

使用不同的 app name 會導致 Firebase SDK 使用不同的 storage key。

### 需要實際測試

請按照「立即測試」章節進行驗證。

### 如果測試失敗

請回報以下資訊：
1. 瀏覽器類型和版本
2. localStorage 中的 key 列表（開發者工具截圖）
3. Console 中的任何錯誤訊息

我們可以實施進階解決方案。

---

## 部署資訊

**已部署**：2026-01-25 22:34

**修改檔案**：
- `src/config/firebase.ts` - Admin app name
- `community-portal/src/config/firebase.ts` - Community Portal app name

**編譯狀態**：
- ✅ Admin: 995 KB
- ✅ Community Portal: 656 KB

---

## 測試清單

同時登入測試：

- [ ] 清除瀏覽器快取
- [ ] 分頁 1 登入 Admin
- [ ] 分頁 2 登入 Community Portal
- [ ] 切換回分頁 1，確認仍登入
- [ ] 切換回分頁 2，確認仍登入
- [ ] 在兩個分頁中操作功能
- [ ] 重新整理兩個分頁
- [ ] 確認都仍保持登入

---

## 立即驗證

請執行以下測試並回報結果：

```
1. 開啟無痕視窗
2. 訪問 https://safe-net-tw.web.app
3. 登入 Admin
4. 開新分頁訪問 https://safe-net-tw.web.app/community
5. 登入 Community Portal
6. 切換回 Admin 分頁
7. 確認是否仍登入？
```

如果仍登入 = ✅ 修正成功
如果被登出 = ❌ 需要進階方案
