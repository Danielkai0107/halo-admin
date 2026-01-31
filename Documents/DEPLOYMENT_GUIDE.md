# 部署指南

本專案包含三個前端應用和一套 Cloud Functions，可以使用提供的部署腳本進行部署。

## 專案結構

```
admin/
├── src/                     # Admin 管理後台（總公司用）
├── liff/                    # LINE LIFF 應用（社區成員用）
├── community-portal/        # Line OA 管理網頁版（Line OA 管理員用）
└── functions/              # Cloud Functions（後端 API）
```

## 部署腳本

### 1. deploy-community-portal.sh

部署Line OA 管理網頁版

```bash
./deploy-community-portal.sh
```

**執行步驟**：

1. 構建 community-portal 應用
2. 複製建置文件到 dist/community
3. 部署到 Firebase Hosting

**部署後 URL**：`https://safe-net-tw.web.app/community`

---

### 2. deploy-liff.sh

部署 LINE LIFF 應用

```bash
./deploy-liff.sh
```

**執行步驟**：

1. 構建 liff 應用
2. 複製建置文件到 dist/liff
3. 部署到 Firebase Hosting

**部署後 URL**：`https://safe-net-tw.web.app/liff`

---

### 3. deploy-all.sh

完整部署（互動式）

```bash
./deploy-all.sh
```

**特點**：

- 互動式選擇要部署的項目
- 支援部署：
  - Admin 管理後台
  - LIFF 應用
  - Community Portal
  - Cloud Functions
- 自動檢測構建錯誤
- 構建失敗時詢問是否繼續部署成功的項目

**執行流程**：

```
是否部署 Admin 管理後台？ (y/n)
是否部署 LIFF 應用？ (y/n)
是否部署 Community Portal？ (y/n)
是否部署 Cloud Functions？ (y/n)
```

---

## 手動部署

### 只部署前端

```bash
# 構建所有前端應用
npm run build                    # Admin
cd liff && npm run build && cd ..
cd community-portal && npm run build && cd ..

# 複製到 dist 目錄
rm -rf dist/liff dist/community
mkdir -p dist/liff dist/community
cp -r liff/dist/* dist/liff/
cp -r community-portal/dist/* dist/community/

# 部署
firebase deploy --only hosting
```

### 只部署 Cloud Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### 部署特定 Function

```bash
# 部署單個 function
firebase deploy --only functions:functionName

# 部署多個 functions
firebase deploy --only functions:func1,functions:func2
```

### 部署 Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 部署 Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

---

## 部署前檢查清單

### Community Portal 首次部署

- [ ] 已建立測試帳號（Firebase Auth + saas_users）
- [ ] 已確認社區資料存在
- [ ] 已設定 Firebase 配置（community-portal/src/config/firebase.ts）
- [ ] 已測試本地開發環境（`npm run dev`）
- [ ] 已編譯無錯誤（`npm run build`）

### Cloud Functions 部署

- [ ] 已編譯 TypeScript（`npm run build`）
- [ ] 已測試本地模擬器（如有需要）
- [ ] 已確認環境變數設定
- [ ] 已確認 Firebase 專案配置

### 全專案部署

- [ ] 所有前端應用本地測試通過
- [ ] Cloud Functions 編譯無錯誤
- [ ] Firestore Rules 已更新
- [ ] Firebase Hosting 配置正確（firebase.json）

---

## 建置輸出目錄

```
dist/
├── index.html                  # Admin 管理後台
├── assets/
│   └── ...
├── liff/                       # LIFF 應用
│   ├── index.html
│   └── assets/
└── community/                  # Community Portal
    ├── index.html
    └── assets/
```

---

## Firebase Hosting 路由配置

在 `firebase.json` 中設定：

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "/liff/**",
        "destination": "/liff/index.html"
      },
      {
        "source": "/community/**",
        "destination": "/community/index.html"
      }
    ]
  }
}
```

---

## 常見問題

### Q: 構建失敗怎麼辦？

**A**:

1. 檢查 Node.js 版本（建議 18+）
2. 刪除 node_modules 並重新安裝：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. 檢查 TypeScript 錯誤
4. 查看具體錯誤訊息

### Q: 部署後頁面空白或 404

**A**:

1. 確認 `firebase.json` 的 rewrites 設定正確
2. 確認 `vite.config.ts` 的 base 路徑設定：
   - Admin: `base: '/'`
   - LIFF: `base: '/liff/'`
   - Community Portal: `base: '/community/'`
3. 清除瀏覽器快取並重新載入

### Q: Cloud Functions 部署失敗

**A**:

1. 確認 Firebase 專案計費方案（Functions 需要 Blaze 計畫）
2. 檢查 functions/package.json 的依賴版本
3. 查看 Firebase Console 的 Functions 日誌

### Q: 部署後看不到最新變更

**A**:

1. 清除瀏覽器快取（Cmd+Shift+R 或 Ctrl+Shift+R）
2. 確認部署成功：
   ```bash
   firebase hosting:channel:deploy preview
   ```
3. 檢查是否部署到正確的 Firebase 專案

---

## 部署流程圖

```
開發 → 測試 → 構建 → 部署 → 驗證
 ↓      ↓      ↓      ↓      ↓
本地   本地   npm    firebase  測試
環境   測試   build  deploy   生產
```

---

## 回滾策略

### 前端回滾

Firebase Hosting 會保留歷史版本：

```bash
# 查看部署歷史
firebase hosting:channel:list

# 回滾到前一版本
firebase hosting:rollback
```

### Cloud Functions 回滾

1. 前往 Firebase Console > Functions
2. 找到要回滾的 function
3. 點擊「版本歷史」
4. 選擇要回滾的版本

或使用 git 回滾到舊版本後重新部署：

```bash
git checkout <commit-hash>
cd functions
npm run build
firebase deploy --only functions
```

---

## 監控與日誌

### 查看 Hosting 日誌

```bash
firebase hosting:channel:list
```

### 查看 Functions 日誌

```bash
# 即時查看
firebase functions:log

# 查看特定 function
firebase functions:log --only functionName

# 或在 Firebase Console 查看
```

---

## 最佳實踐

1. **版本控制**
   - 部署前確保代碼已提交到 git
   - 為每次部署打 tag：`git tag v1.0.0`

2. **測試環境**
   - 使用 Firebase Hosting 的預覽頻道測試：
     ```bash
     firebase hosting:channel:deploy preview
     ```

3. **漸進式部署**
   - 先部署到測試環境
   - 驗證無誤後再部署到生產環境
   - 逐步部署各個模組，不要一次全部部署

4. **備份**
   - 部署前備份 Firestore 資料
   - 保留上一版本的建置文件

5. **監控**
   - 部署後監控 Firebase Console 的錯誤日誌
   - 檢查用戶回報的問題
   - 使用 Google Analytics 監控流量變化

---

## 緊急回滾程序

如果部署後發現嚴重問題：

1. **立即通知團隊**
2. **回滾前端**（5分鐘內）
   ```bash
   firebase hosting:rollback
   ```
3. **回滾 Functions**（如需要）
   - 在 Firebase Console 操作
4. **調查問題**
   - 查看日誌
   - 複現問題
5. **修復並重新部署**

---

## 聯絡資訊

如有部署問題，請聯絡：

- 技術負責人：[聯絡方式]
- Firebase 專案：safe-net-tw
- 文檔：參考 `COMMUNITY_PORTAL_SETUP.md`
