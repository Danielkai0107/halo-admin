# SaaS 用戶管理修正：登出和路由問題

## 修正日期
2026-01-25

---

## 問題 1: 新增 SaaS 用戶時管理員被登出

### 問題描述
在 Admin 管理後台的「SaaS 用戶管理」頁面新增用戶時，當前登入的管理員會被自動登出。

### 根本原因
使用 `createUserWithEmailAndPassword` 建立新用戶時，Firebase Auth 會自動將當前 session 切換到新建立的用戶，導致原本的管理員被登出。

### 解決方案
使用第二個 Firebase App 實例來建立新用戶，這樣不會影響主要 App 的認證狀態。

### 技術實作

**建立第二個 Firebase App 實例**：

```typescript
// saasUserService.ts

// 建立第二個 Firebase App 實例（用於建立用戶）
const firebaseConfig = { /* 相同的配置 */ };

let secondaryApp = null;
let secondaryAuth = null;

const getSecondaryApp = () => {
  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, 'Secondary');
    secondaryAuth = getAuth(secondaryApp);
  }
  return { auth: secondaryAuth };
};
```

**建立用戶時使用第二個實例**：

```typescript
create: async (data) => {
  // 1. 使用第二個 App 實例建立用戶
  const { auth: secondAuth } = getSecondaryApp();
  const userCredential = await createUserWithEmailAndPassword(
    secondAuth,
    data.email,
    data.password
  );
  
  const firebaseUid = userCredential.user.uid;
  
  // 2. 立即登出新用戶（在第二個實例）
  await signOut(secondAuth);
  
  // 3. 在主要 db 建立 Firestore 記錄
  await setDoc(doc(db, 'saas_users', firebaseUid), saasUserData);
  
  // 主要 App 的認證狀態不受影響！
}
```

### 修正效果

- ✅ 新增 SaaS 用戶時，管理員不會被登出
- ✅ 新用戶成功建立在 Firebase Auth
- ✅ Firestore 記錄正確建立
- ✅ 管理員可以繼續使用 Admin 介面

---

## 問題 2: 生產環境 Community Portal 無法訪問

### 問題描述
訪問 `https://safe-net-tw.web.app/community` 時顯示錯誤或 404。

### 根本原因
`firebase.json` 的 rewrites 規則沒有包含 `/community/**` 路徑，導致 Firebase Hosting 無法正確處理 Community Portal 的路由。

### 解決方案
在 `firebase.json` 中添加 community 的 rewrites 規則。

### 修正內容

**修正前**：
```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/liff/**",
        "destination": "/liff/index.html"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**修正後**：
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
      },
      {
        "source": "/community",
        "destination": "/community/index.html"
      },
      {
        "source": "/community/**",
        "destination": "/community/index.html"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 修正效果

- ✅ `/community` 路徑正確重定向到 community portal
- ✅ `/community/*` 所有子路徑正常運作
- ✅ React Router 的前端路由正常工作

---

## 部署更新

### 建置狀態

所有專案編譯成功：
- ✅ Admin: 995 KB
- ✅ Community Portal: 652 KB

### 部署指令

```bash
# 方法 1: 使用部署腳本
./deploy-all.sh
# 選擇：
# Admin: y
# Community Portal: y
# Functions: n (不需要)

# 方法 2: 手動部署
firebase deploy --only hosting
```

### 部署後驗證

1. **Admin 管理後台**：
   - 訪問：`https://safe-net-tw.web.app/saas-users`
   - 測試新增用戶
   - **驗證**：不會被登出

2. **Community Portal**：
   - 訪問：`https://safe-net-tw.web.app/community`
   - **驗證**：正常顯示登入頁面
   - 測試登入
   - **驗證**：所有路由正常工作

---

## 測試步驟

### 測試 1: Admin 不會被登出

1. 啟動 Admin：`npm run dev`
2. 登入 Admin（`http://localhost:3000`）
3. 前往「SaaS 用戶管理」
4. 點擊「新增用戶」
5. 填寫完整資訊（包含密碼）
6. 點擊「新增」
7. **驗證**：
   - [ ] 顯示「新增成功」
   - [ ] 管理員仍保持登入狀態
   - [ ] 可以繼續使用 Admin 介面
   - [ ] 新用戶出現在列表中

### 測試 2: Community Portal 路由正常

**本地測試**：
1. 啟動：`cd community-portal && npm run dev`
2. 訪問：`http://localhost:3002/community`
3. 測試所有路由

**生產環境測試**（部署後）：
1. 訪問：`https://safe-net-tw.web.app/community`
2. **驗證**：顯示登入頁面（不是錯誤）
3. 登入後測試所有路由：
   - [ ] `/community/elders` - 長者管理
   - [ ] `/community/devices` - 設備清單
   - [ ] `/community/notification-logs` - 通知記錄
   - [ ] `/community/notification-points` - 通知點

---

## 技術細節

### Firebase App 實例隔離

Firebase SDK 支援多個 App 實例：

```typescript
// 主要 App（管理員使用）
const mainApp = initializeApp(config);
const mainAuth = getAuth(mainApp);

// 第二個 App（建立新用戶用）
const secondaryApp = initializeApp(config, 'Secondary');
const secondaryAuth = getAuth(secondaryApp);

// 兩個實例的認證狀態互不影響
```

### Hosting Rewrites 順序

Firebase Hosting 的 rewrites 規則按順序匹配：

```json
[
  { "source": "/liff/**", ... },      // 1. 優先匹配 /liff
  { "source": "/community/**", ... }, // 2. 優先匹配 /community
  { "source": "**", ... }             // 3. 其他所有路徑（Admin）
]
```

**重要**：更具體的規則要放在前面，`**` 萬用規則要放最後。

---

## 常見問題

### Q: 為什麼不使用 Firebase Admin SDK？

A: Admin SDK 只能在 Node.js 後端使用（Cloud Functions），前端無法使用。使用第二個 App 實例是前端的最佳解決方案。

### Q: 第二個 App 實例會增加成本嗎？

A: 不會。這只是客戶端的不同實例，共用同一個 Firebase 專案，不會產生額外費用。

### Q: 為什麼要立即登出新用戶？

A: 即使使用第二個實例，也建議登出以保持狀態清潔，避免潛在的認證衝突。

### Q: 部署後 community portal 還是顯示錯誤？

A: 檢查：
1. 是否執行了 `firebase deploy --only hosting`
2. 清除瀏覽器快取（Cmd+Shift+R）
3. 檢查 dist/community 目錄是否有建置文件
4. 查看 Firebase Console > Hosting 的部署狀態

---

## 修改的檔案

1. **src/services/saasUserService.ts**
   - 新增第二個 Firebase App 實例
   - 修改 create 方法使用第二個實例
   - 建立後立即登出

2. **firebase.json**
   - 新增 `/community` 和 `/community/**` rewrites
   - 確保路由順序正確

3. **src/pages/SaasUsersPage.tsx**
   - 修正 handleCreate 表單初始化（確保密碼欄位顯示）

---

## 部署後檢查

部署完成後確認：

- [ ] Admin 可以正常新增 SaaS 用戶且不被登出
- [ ] `https://safe-net-tw.web.app/community` 顯示登入頁面
- [ ] 可以登入並使用所有功能
- [ ] 所有路由正常工作

---

## 回滾方案

如果部署後仍有問題：

```bash
# 回滾 Hosting
firebase hosting:rollback

# 或重新部署舊版本
git checkout HEAD~1
npm run build
cd community-portal && npm run build && cd ..
firebase deploy --only hosting
```

---

## 下一步

1. 重新部署到生產環境
2. 測試 Admin 新增用戶（確認不被登出）
3. 測試生產環境 Community Portal 訪問
4. 確認所有功能正常

部署指令：
```bash
firebase deploy --only hosting
```

或使用腳本：
```bash
./deploy-all.sh
# 選擇 Admin: y, Community Portal: y
```
