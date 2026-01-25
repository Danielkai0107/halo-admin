# SaaS 用戶管理快速開始

## 快速建立第一個社區管理員帳號

### 方法 1: 透過 Admin 介面（推薦）

1. **啟動 Admin 管理後台**
   ```bash
   npm run dev
   ```
   訪問：`http://localhost:3000`

2. **登入 Admin**
   使用超級管理員帳號登入

3. **前往 SaaS 用戶管理**
   - 點擊側邊欄的「SaaS 用戶管理」（Shield 圖示）
   - 或訪問：`http://localhost:3000/saas-users`

4. **新增用戶**
   - 點擊「新增用戶」按鈕
   - 填寫資訊：
     ```
     Email: admin@test.com
     密碼: test123456
     姓名: 測試管理員
     所屬社區: （從下拉選單選擇）
     角色: 管理員
     ```
   - 點擊「新增」

5. **測試登入 Community Portal**
   ```bash
   cd community-portal
   npm run dev
   ```
   訪問：`http://localhost:3002/community/login`
   使用剛建立的帳號登入

---

### 方法 2: 使用自動化腳本

如果 Admin 介面無法使用，可以使用腳本：

```bash
cd functions
node create-saas-user.cjs admin@test.com test123456 "測試管理員" YOUR_TENANT_ID
```

---

## 如何找到社區 ID

### 在 Admin 介面中

1. 前往「社區管理」頁面
2. 社區列表中可以看到每個社區的資訊
3. 記下社區的 ID（通常在 URL 或資料中顯示）

### 在 Firestore Console 中

1. 訪問 [Firestore Console](https://console.firebase.google.com/project/safe-net-tw/firestore)
2. 開啟 `tenants` 集合
3. 文件 ID 就是社區 ID

---

## 完整測試流程

### 步驟 1: 準備環境

```bash
# 專案根目錄
npm install

# Community Portal
cd community-portal
npm install
cd ..

# 確認 Firebase 配置正確
```

### 步驟 2: 確認有可用的社區

**選項 A: 使用現有社區**
- 在 Admin 管理後台查看現有社區
- 記下社區 ID

**選項 B: 建立新社區**
1. 啟動 Admin：`npm run dev`
2. 登入並前往「社區管理」
3. 新增一個測試社區
4. 記下社區 ID

### 步驟 3: 建立 SaaS 用戶

使用 Admin 介面：
1. 訪問 `http://localhost:3000/saas-users`
2. 點擊「新增用戶」
3. 填寫表單並提交

### 步驟 4: 測試登入

1. 啟動 Community Portal：
   ```bash
   cd community-portal
   npm run dev
   ```

2. 訪問：`http://localhost:3002/community/login`

3. 使用建立的帳號登入

4. 確認能看到：
   - 社區名稱顯示在頂部
   - 側邊欄導航功能
   - 長者管理頁面（預設首頁）

### 步驟 5: 測試功能

- [ ] 新增長者
- [ ] 查看設備列表
- [ ] 建立通知點
- [ ] 查看通知記錄

---

## 管理多個社區

### 為不同社區建立管理員

```bash
# 社區 A
在 Admin 介面新增：
- Email: admin-a@test.com
- 社區: 社區 A
- 角色: 管理員

# 社區 B
在 Admin 介面新增：
- Email: admin-b@test.com
- 社區: 社區 B
- 角色: 管理員
```

每個管理員登入後只能看到和管理自己社區的資料。

---

## 故障排除

### 建立用戶時出錯

**錯誤**: "此 Email 已被使用"
- **原因**: Email 已在 Firebase Auth 中註冊
- **解決**: 使用其他 Email，或在 Firebase Console 刪除舊帳號

**錯誤**: "密碼強度不足"
- **原因**: 密碼少於 6 個字元
- **解決**: 使用至少 6 個字元的密碼

**錯誤**: "請選擇社區"
- **原因**: 未選擇社區
- **解決**: 確認 tenants 集合有資料，並在下拉選單中選擇

### 用戶無法登入 Community Portal

檢查以下項目：

1. **Firestore 記錄檢查**
   - 開啟 Firestore Console
   - 查看 `saas_users/{uid}` 文件
   - 確認：
     - 文件 ID = Firebase Auth UID
     - `firebaseUid` 欄位值正確
     - `isActive` = true
     - `tenantId` 有值

2. **社區資料檢查**
   - 確認 `tenants/{tenantId}` 記錄存在
   - `isActive` = true

3. **瀏覽器 Console**
   - 開啟開發者工具
   - 查看 Console 的錯誤訊息
   - 根據錯誤訊息排查

### 看不到用戶列表

- 確認已登入 Admin 管理後台
- 確認有 SUPER_ADMIN 權限
- 檢查 Firestore `saas_users` 集合是否有資料
- 查看瀏覽器 Console 是否有錯誤

---

## 開發提示

### 測試不同角色

建立兩個測試帳號：

**管理員測試帳號**：
```
Email: admin-test@community.com
密碼: test123456
角色: ADMIN
```

**成員測試帳號**：
```
Email: member-test@community.com
密碼: test123456
角色: MEMBER
```

分別登入測試不同權限的功能。

### 本地開發

同時運行兩個開發伺服器：

**終端機 1** - Admin 管理後台：
```bash
npm run dev
# http://localhost:3000
```

**終端機 2** - Community Portal：
```bash
cd community-portal
npm run dev
# http://localhost:3002
```

---

## 生產環境部署

### 部署前檢查

- [ ] 已建立所需的社區記錄
- [ ] 已建立管理員帳號
- [ ] 已測試登入功能
- [ ] 已確認權限正常運作

### 部署步驟

```bash
# 構建並部署 Admin
npm run build
firebase deploy --only hosting

# 或使用部署腳本
./deploy-all.sh
```

部署後訪問：
- Admin: `https://safe-net-tw.web.app/saas-users`
- Community Portal: `https://safe-net-tw.web.app/community`

---

## 下一步

1. 建立測試帳號
2. 測試所有功能
3. 為實際使用的社區建立管理員帳號
4. 提供登入資訊給各社區管理員
5. 培訓社區管理員使用 Community Portal

---

## 相關文檔

- `SAAS_USERS_MANAGEMENT.md` - 完整功能說明
- `COMMUNITY_PORTAL_SETUP.md` - Community Portal 設置指南
- `CREATE_TEST_ACCOUNT.md` - 測試帳號建立指南（腳本方式）
- `DEPLOYMENT_GUIDE.md` - 部署指南
