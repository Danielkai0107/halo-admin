# 立即部署指南

## 修正完成

以下問題已修正並編譯成功：

1. ✅ Admin 新增 SaaS 用戶時不會被登出（使用第二個 Firebase App 實例）
2. ✅ firebase.json 已添加 community 路由規則
3. ✅ 密碼欄位顯示問題已修正
4. ✅ 所有編譯錯誤已解決

---

## 快速部署（2 分鐘）

### 選項 1: 使用部署腳本（推薦）

```bash
./deploy-all.sh
```

選擇：
- Admin: **y**
- LIFF: n
- Community Portal: **y**
- Functions: n

### 選項 2: 只部署 Hosting

```bash
firebase deploy --only hosting
```

這會同時部署 Admin 和 Community Portal。

### 選項 3: 分別部署

```bash
# 只部署 Community Portal
./deploy-community-portal.sh

# 然後部署 Admin
npm run build
firebase deploy --only hosting
```

---

## 部署後驗證

### 1. 測試 Admin（不被登出）

1. 訪問：`https://safe-net-tw.web.app/saas-users`
2. 登入 Admin
3. 點擊「新增用戶」
4. 填寫資訊：
   ```
   Email: test@community.com
   密碼: test123456
   姓名: 測試管理員
   所屬社區: （選擇）
   角色: 管理員
   ```
5. 點擊「新增」
6. **驗證**：
   - [ ] 顯示「新增成功」
   - [ ] 管理員仍保持登入（沒有被登出）
   - [ ] 新用戶出現在列表中

### 2. 測試 Community Portal（路由正常）

1. 訪問：`https://safe-net-tw.web.app/community`
2. **驗證**：顯示登入頁面（不是 404 或錯誤）
3. 使用剛建立的帳號登入
4. **驗證**：
   - [ ] 登入成功
   - [ ] 顯示社區名稱
   - [ ] 側邊欄功能完整
5. 測試所有路由：
   - [ ] 長者管理
   - [ ] 設備清單
   - [ ] 通知記錄
   - [ ] 通知點

---

## 如果部署失敗

### 錯誤：權限不足

```bash
# 重新登入 Firebase
firebase login

# 確認專案
firebase use safe-net-tw
```

### 錯誤：建置文件不存在

```bash
# 確認建置目錄
ls -la dist/
ls -la dist/community/

# 如果沒有文件，重新建置
npm run build
cd community-portal && npm run build && cd ..
```

### 錯誤：部署卡住

```bash
# 中斷並重試
Ctrl+C
firebase deploy --only hosting --force
```

---

## 部署完成後

### 更新文檔

在相關文檔中標記部署狀態：
- ✅ Admin SaaS 用戶管理已部署
- ✅ Community Portal 已部署
- ✅ 路由配置已更新

### 通知團隊

**生產環境 URL**：
- Admin: `https://safe-net-tw.web.app/saas-users`
- Community Portal: `https://safe-net-tw.web.app/community`

**測試帳號**：
請使用 Admin 介面建立或使用命令列腳本建立。

### 監控

部署後 24 小時內監控：
- Firebase Console > Hosting 流量
- Cloud Functions 日誌（如有錯誤）
- 用戶回報的問題

---

## 快速指令

```bash
# 完整部署
./deploy-all.sh

# 只部署前端
firebase deploy --only hosting

# 查看部署狀態
firebase hosting:channel:list

# 查看即時日誌
firebase functions:log
```

---

## 緊急回滾

如果發現嚴重問題：

```bash
# 回滾 Hosting（5 分鐘內可用）
firebase hosting:rollback

# 或部署舊版本
git checkout <previous-commit>
npm run build
cd community-portal && npm run build && cd ..
firebase deploy --only hosting
```

---

## 修改文件清單

1. `src/services/saasUserService.ts` - 使用第二個 Firebase App 實例
2. `firebase.json` - 新增 community rewrites
3. `src/pages/SaasUsersPage.tsx` - 修正表單初始化

---

## 編譯狀態

✅ 所有專案編譯成功，無錯誤

---

準備好了嗎？執行部署指令：

```bash
firebase deploy --only hosting
```

或

```bash
./deploy-all.sh
```

部署完成後參考上方的「部署後驗證」章節進行測試。
