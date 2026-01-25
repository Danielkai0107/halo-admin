# SaaS 用戶管理快速指南

## 目前狀態

所有程式碼已完成並成功編譯：
- Admin 管理後台（含 SaaS 用戶管理）✓
- Community Portal ✓
- Cloud Functions ✓

## 立即開始

### 1. 啟動 Admin 管理後台

```bash
npm run dev
# 訪問 http://localhost:3000
```

### 2. 登入並建立第一個社區管理員

1. 使用超級管理員帳號登入 Admin
2. 側邊欄找到「SaaS 用戶管理」（盾牌圖示）
3. 點擊「新增用戶」
4. 填寫表單：
   ```
   Email: admin@test.com
   密碼: test123456（至少 6 個字元）
   姓名: 測試管理員
   電話: （選填）
   所屬社區: （從下拉選單選擇）
   角色: 管理員
   ```
5. 點擊「新增」

### 3. 測試 Community Portal 登入

```bash
cd community-portal
npm run dev
# 訪問 http://localhost:3002/community/login
```

使用剛建立的帳號登入。

---

## 功能簡介

### Admin 管理後台 - SaaS 用戶管理頁面

**位置**：側邊欄最下方「SaaS 用戶管理」

**功能**：
- 查看所有社區管理員
- 新增管理員（自動建立 Firebase Auth + Firestore）
- 編輯資訊（姓名、電話、社區、角色）
- 啟用/停用帳號
- 按社區篩選
- 查看統計（總數、啟用數、管理員數）

**權限**：只有 SUPER_ADMIN 可以使用

---

### Community Portal - 社區管理網頁版

**訪問**：`http://localhost:3002/community/login`

**功能模組**：
1. **長者管理** - 新增、編輯、查看長者，綁定設備
2. **設備清單** - 查看社區設備（唯讀）
3. **通知記錄** - 查看已發送的 LINE 通知記錄
4. **通知點** - 設定固定通知點位

**權限**：
- ADMIN：可以新增/編輯/刪除
- MEMBER：只能查看

---

## 部署

### 測試完成後部署

```bash
# 方法 1: 使用腳本（推薦）
./deploy-community-portal.sh  # 只部署 Community Portal
./deploy-all.sh                # 互動式選擇要部署的項目

# 方法 2: 手動部署
npm run build                           # Admin
cd community-portal && npm run build    # Community Portal
cd ..
firebase deploy --only hosting
```

---

## 建立的檔案清單

### Admin 管理後台
- `src/services/saasUserService.ts` - SaaS 用戶服務
- `src/pages/SaasUsersPage.tsx` - 管理頁面
- `src/types/index.ts` - 新增 SaasUser 類型（已修改）
- `src/App.tsx` - 新增路由（已修改）
- `src/layouts/DashboardLayout.tsx` - 新增選單（已修改）

### Community Portal（新專案）
- 完整的專案結構（43 個檔案）
- 包含認證、長者管理、設備查看、通知功能

### Cloud Functions
- `functions/src/beacon/receiveBeaconData.ts` - 支援通知點觸發（已修改）

### 腳本和文檔
- `deploy-community-portal.sh` - Community Portal 部署腳本
- `deploy-all.sh` - 完整部署腳本
- `functions/create-saas-user.cjs` - 命令列建立用戶腳本
- `SAAS_USERS_MANAGEMENT.md` - 完整功能說明
- `COMMUNITY_PORTAL_SETUP.md` - Community Portal 設置指南
- `CREATE_TEST_ACCOUNT.md` - 帳號建立指南
- `DEPLOYMENT_GUIDE.md` - 部署指南

---

## 架構總覽

```
┌──────────────────────┐
│ Admin 管理後台        │ ← 您在這裡建立社區管理員
│ (SUPER_ADMIN)        │
│ /saas-users 頁面     │
└──────────────────────┘
         ↓ 建立帳號
┌──────────────────────┐
│ saas_users 集合       │
│ - firebaseUid         │
│ - email               │
│ - tenantId           │
│ - role: ADMIN/MEMBER │
└──────────────────────┘
         ↓ 登入使用
┌──────────────────────┐
│ Community Portal     │ ← 社區管理員在這裡工作
│ (Email 登入)          │
│ - 長者管理           │
│ - 設備查看           │
│ - 通知記錄           │
│ - 通知點設定         │
└──────────────────────┘
```

---

## 常見問題

### Q: 找不到社區可以選擇

A: 先在 Admin 的「社區管理」頁面建立社區

### Q: 新增用戶時顯示「此 Email 已被使用」

A: 該 Email 已註冊，請使用其他 Email

### Q: 用戶建立成功但無法登入

A: 開啟瀏覽器開發者工具查看 Console 錯誤訊息

### Q: Community Portal 顯示空白

A: 確認：
- Vite 建置成功
- base 路徑設定為 `/community/`
- 訪問正確的 URL（包含 /community/）

---

## 下一步

1. 建立測試帳號
2. 測試 Community Portal 所有功能
3. 為實際社區建立管理員帳號
4. 部署到生產環境

---

## 需要協助？

查看詳細文檔：
- `SAAS_USERS_MANAGEMENT.md` - 完整功能說明
- `COMMUNITY_PORTAL_SETUP.md` - Community Portal 設置
- `DEPLOYMENT_GUIDE.md` - 部署指南
