# 社區管理網頁版 - 使用說明

## 快速開始（3 步驟）

### 第 1 步：啟動 Admin 並建立管理員帳號

```bash
# 啟動 Admin 管理後台
npm run dev
```

1. 訪問 `http://localhost:3000`
2. 登入後點擊側邊欄「SaaS 用戶管理」（盾牌圖示）
3. 點擊「新增用戶」
4. 填寫資訊並提交

### 第 2 步：測試登入 Community Portal

```bash
# 開新終端機
cd community-portal
npm run dev
```

訪問 `http://localhost:3002/community/login` 並使用剛建立的帳號登入

### 第 3 步：測試功能

- 新增長者
- 查看設備列表
- 建立通知點
- 查看通知記錄

---

## 三個系統說明

### 1️⃣ Admin 管理後台（總公司）

**用途**：系統管理、建立社區管理員
**訪問**：`http://localhost:3000`
**用戶**：users 集合（SUPER_ADMIN）

### 2️⃣ Community Portal（社區管理員）

**用途**：社區管理、長者管理、通知點設定
**訪問**：`http://localhost:3002/community`
**用戶**：saas_users 集合（ADMIN/MEMBER）

### 3️⃣ LIFF App（社區成員）

**用途**：查看長者、接收警報
**訪問**：`http://localhost:3001/liff`
**用戶**：appUsers 集合（LINE 登入）

---

## Community Portal 功能

| 頁面 | 路徑 | 功能 | ADMIN | MEMBER |
|------|------|------|-------|--------|
| 長者管理 | /elders | 查看、新增、編輯 | ✓ | 查看 |
| 設備清單 | /devices | 查看社區設備 | ✓ | ✓ |
| 通知記錄 | /notification-logs | 查看 LINE 通知記錄 | ✓ | ✓ |
| 通知點 | /notification-points | 設定通知點位 | ✓ | 查看 |

---

## 重要概念

### saas_users 資料結構

```javascript
// Firestore: saas_users/{firebaseUid}
{
  firebaseUid: "abc123...",     // 與 Firebase Auth UID 相同
  email: "admin@test.com",      // 登入 Email
  name: "管理員",
  tenantId: "tenant_001",       // 所屬社區
  role: "ADMIN",                // 或 "MEMBER"
  isActive: true
}
```

### 通知點運作流程

```
1. 在 Community Portal 建立通知點
   ↓
2. 選擇 gateway（如「社區大門」）
   ↓
3. 設定自訂通知訊息
   ↓
4. 長者經過該 gateway
   ↓
5. Cloud Function 檢測到通知點
   ↓
6. 發送 LINE 通知給社區成員
   ↓
7. 記錄到通知記錄
```

---

## 部署

### 開發完成後部署

```bash
# 推薦：使用部署腳本
./deploy-all.sh

# 選擇要部署的項目：
# Admin: y
# LIFF: n (不需要)
# Community Portal: y
# Cloud Functions: y
```

### 生產環境 URL

- Admin: `https://safe-net-tw.web.app/saas-users`
- Community Portal: `https://safe-net-tw.web.app/community`

---

## 故障排除

### 建立用戶失敗

**錯誤**：「此 Email 已被使用」
- 使用其他 Email，或在 Firebase Console 刪除舊帳號

**錯誤**：「找不到社區」
- 先在「社區管理」頁面建立社區

### 登入 Community Portal 失敗

**症狀**：登入後重定向到登入頁面
- 開啟瀏覽器開發者工具（F12）
- 查看 Console 錯誤訊息
- 確認 saas_users 文件 ID = Firebase UID

**症狀**：顯示「找不到社區資料」
- 確認 tenantId 有值且對應的社區存在

### 看不到設備

**原因**：設備的 tags 陣列沒有包含 `tenant_{tenantId}`

**解決**：在 Admin 的「Beacon 管理」為設備新增正確的 tag

---

## 快速指令

```bash
# 啟動開發環境
npm run dev                                # Admin
cd liff && npm run dev                     # LIFF
cd community-portal && npm run dev         # Community Portal

# 建置
npm run build                              # Admin
cd liff && npm run build                   # LIFF
cd community-portal && npm run build       # Community Portal
cd functions && npm run build              # Functions

# 部署
./deploy-community-portal.sh               # 只部署 Community Portal
./deploy-all.sh                            # 互動式完整部署
firebase deploy                            # 部署所有
```

---

## 檢查清單

部署前確認：

- [ ] 所有應用建置成功（無 TypeScript 錯誤）
- [ ] 已在 Admin 建立測試 SaaS 用戶
- [ ] 已測試 Community Portal 登入
- [ ] 已測試長者管理功能
- [ ] 已測試通知點建立
- [ ] Firebase 專案計費方案已啟用（Functions 需要 Blaze）

---

## 完成時間

- 專案規劃：2026/01/25
- 開發完成：2026/01/25
- 測試通過：待確認
- 生產部署：待執行

---

## 聯絡與支援

技術文檔：
- `SAAS_USERS_QUICK_GUIDE.md` - 快速指南
- `COMMUNITY_PORTAL_COMPLETE.md` - 完整總結
- `DEPLOYMENT_GUIDE.md` - 部署指南

Firebase Console：
- 專案：safe-net-tw
- 網址：https://console.firebase.google.com/project/safe-net-tw

---

準備就緒！可以開始測試了。
