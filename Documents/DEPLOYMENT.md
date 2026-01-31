# 🚀 Firebase Hosting 部署指南

## 部署準備

### 前置條件

1. ✅ Firebase 專案已創建（safe-net-tw）
2. ✅ Firestore 已設置
3. ✅ Firebase Authentication 已啟用
4. ✅ 測試用戶已創建

## 快速部署

### 方法一：使用 Firebase CLI（推薦）

```bash
# 1. 安裝 Firebase CLI（如果還沒安裝）
npm install -g firebase-tools

# 2. 登入 Firebase
firebase login

# 3. 構建生產版本
npm run build

# 4. 部署到 Firebase Hosting
firebase deploy --only hosting

# 完成！應用將部署到：
# https://safe-net-tw.web.app
# 或
# https://safe-net-tw.firebaseapp.com
```

### 方法二：一鍵部署腳本

```bash
# 構建並部署
npm run build && firebase deploy --only hosting
```

### 方法三：完整部署（包含 Firestore 規則和索引）

```bash
# 部署所有內容
firebase deploy
```

這將部署：

- ✅ Hosting（網站）
- ✅ Firestore Rules（安全規則）
- ✅ Firestore Indexes（索引）

## 部署配置

### Firebase 配置文件

已創建以下配置文件：

1. **`.firebaserc`** - 專案配置

   ```json
   {
     "projects": {
       "default": "safe-net-tw"
     }
   }
   ```

2. **`firebase.json`** - Hosting 配置
   - 輸出目錄：`dist`
   - SPA 路由重寫
   - 快取設置

3. **`firestore.rules`** - Firestore 安全規則
   - 開發模式（當前啟用）
   - 生產環境規則（註解中）

4. **`firestore.indexes.json`** - Firestore 索引
   - 預定義常用查詢索引

## 部署後驗證

### 1. 檢查部署狀態

```bash
# 查看部署歷史
firebase hosting:channel:list

# 查看當前 Hosting 配置
firebase hosting:channel:open live
```

### 2. 訪問網站

部署成功後，您的網站將在以下網址可用：

- **主要網址：** https://safe-net-tw.web.app
- **備用網址：** https://safe-net-tw.firebaseapp.com

### 3. 測試功能

1. 開啟網站
2. 使用測試帳號登入
3. 驗證所有功能：
   - ✅ 登入認證
   - ✅ 儀表板顯示
   - ✅ Line OA 管理
   - ✅ 長者管理
   - ✅ 設備管理
   - ✅ 接收點管理
   - ✅ 警報管理
   - ✅ 即時更新

## 更新部署

### 更新網站內容

```bash
# 1. 修改代碼
# 2. 構建
npm run build

# 3. 重新部署
firebase deploy --only hosting
```

### 更新 Firestore 規則

```bash
# 僅部署 Firestore 規則
firebase deploy --only firestore:rules
```

### 更新 Firestore 索引

```bash
# 僅部署 Firestore 索引
firebase deploy --only firestore:indexes
```

## 環境變量（選用）

如果需要使用環境變量：

### 1. 創建環境文件

```bash
# .env.production
VITE_FIREBASE_API_KEY=AIzaSyArXubl605fS6mpgzni0gb1_3YZhgQGMxo
VITE_FIREBASE_AUTH_DOMAIN=safe-net-tw.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=safe-net-tw
VITE_FIREBASE_STORAGE_BUCKET=safe-net-tw.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=290555063879
VITE_FIREBASE_APP_ID=1:290555063879:web:fac080454a35863dbd4b62
VITE_FIREBASE_MEASUREMENT_ID=G-ES7GQHHYS6
```

### 2. 修改 Firebase 配置

更新 `src/config/firebase.ts` 使用環境變量：

```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
```

## 自定義域名（選用）

### 連接自定義域名

```bash
# 1. 在 Firebase Console 添加自定義域名
# 2. 設置 DNS 記錄
# 3. 等待驗證

# 或使用 CLI
firebase hosting:channel:deploy custom-domain
```

## 預覽部署（測試環境）

### 創建預覽頻道

```bash
# 部署到預覽頻道
firebase hosting:channel:deploy preview

# 會生成預覽網址：
# https://safe-net-tw--preview-xxxxx.web.app
```

### 用途

- 測試新功能
- 給客戶預覽
- CI/CD 整合

## CI/CD 整合

### GitHub Actions 範例

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: "${{ secrets.GITHUB_TOKEN }}"
          firebaseServiceAccount: "${{ secrets.FIREBASE_SERVICE_ACCOUNT }}"
          channelId: live
          projectId: safe-net-tw
```

## 部署 Checklist

### 首次部署前

- [ ] 確認 Firebase 專案正確
- [ ] Firestore 安全規則已設置
- [ ] Firebase Authentication 已啟用
- [ ] 測試用戶已創建
- [ ] 本地測試通過
- [ ] 構建無錯誤

### 每次部署前

- [ ] 代碼已提交到 Git
- [ ] 測試所有功能
- [ ] 構建成功
- [ ] 檢查 linter 錯誤
- [ ] 確認環境變量

### 部署後

- [ ] 訪問生產網站
- [ ] 測試登入功能
- [ ] 驗證即時更新
- [ ] 檢查瀏覽器控制台無錯誤
- [ ] 測試所有主要功能

## 回滾部署

### 回滾到上一個版本

```bash
# 查看部署歷史
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live

# 或在 Firebase Console 操作
# Hosting > 發布記錄 > 回滾
```

## 監控和分析

### Firebase Performance Monitoring

```bash
# 啟用 Performance Monitoring
npm install firebase

# 在代碼中添加
import { getPerformance } from 'firebase/performance';
const perf = getPerformance(app);
```

### Firebase Analytics

已配置 Google Analytics（measurementId: G-ES7GQHHYS6）

## 成本估算

### Firebase Hosting 免費配額

- ✅ 10 GB 儲存空間
- ✅ 360 MB/日 傳輸
- ✅ SSL 證書（自動）

### Firestore 免費配額

- ✅ 1 GB 儲存
- ✅ 50,000 讀取/日
- ✅ 20,000 寫入/日
- ✅ 20,000 刪除/日

### 估算使用量

小型社區（100 長者）：

- 讀取：~5,000/日（遠低於限制）
- 寫入：~1,000/日（遠低於限制）
- 儲存：~100 MB（遠低於限制）

**結論：** 在免費配額內綽綽有餘！

## 故障排除

### 部署失敗

```bash
# 1. 檢查 Firebase CLI 版本
firebase --version

# 2. 重新登入
firebase logout
firebase login

# 3. 清除快取並重建
rm -rf dist node_modules
npm install
npm run build

# 4. 重新部署
firebase deploy --only hosting
```

### 網站無法訪問

1. 檢查部署狀態：`firebase hosting:channel:list`
2. 檢查 Firestore 規則
3. 檢查瀏覽器控制台錯誤
4. 清除瀏覽器快取

### 認證失敗

1. 檢查 Firebase Auth 設置
2. 確認測試用戶存在
3. 檢查 Firestore users 集合
4. 驗證安全規則

## 安全性建議

### 部署到生產環境前

1. **更新 Firestore 規則**

   ```bash
   # 編輯 firestore.rules，啟用生產環境規則
   # 然後部署
   firebase deploy --only firestore:rules
   ```

2. **啟用 App Check**（防止濫用）

   ```bash
   # 在 Firebase Console 啟用 App Check
   ```

3. **設置使用配額**
   - Firebase Console > Firestore > 配額
   - 設置每日讀寫限制

4. **監控使用量**
   - 定期檢查 Firebase Console > 用量
   - 設置預算警報

## 常用命令

```bash
# 構建
npm run build

# 本地預覽構建結果
firebase serve

# 部署
firebase deploy --only hosting

# 查看日誌
firebase hosting:channel:list

# 登出
firebase logout

# 切換專案
firebase use safe-net-tw
```

## 支援

- [Firebase Hosting 文檔](https://firebase.google.com/docs/hosting)
- [Firebase CLI 參考](https://firebase.google.com/docs/cli)
- [Firestore 安全規則](https://firebase.google.com/docs/firestore/security/get-started)

---

**準備好了嗎？開始部署！** 🚀

```bash
npm run build && firebase deploy --only hosting
```
