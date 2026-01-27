# 建立測試帳號指南

## 方法 1: 使用自動化腳本（推薦）

### 步驟 1: 準備 Firebase Service Account Key

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇您的專案（safe-net-tw）
3. 點擊左上角齒輪圖示 > 專案設定
4. 切換到「服務帳戶」標籤
5. 點擊「產生新的私密金鑰」
6. 下載 JSON 檔案
7. 將檔案重命名為 `service-account-key.json`
8. 放到 `functions/` 目錄下

**重要**：此檔案包含敏感資訊，請勿提交到 Git！

### 步驟 2: 查詢可用的社區 ID

在 [Firestore Console](https://console.firebase.google.com/project/safe-net-tw/firestore) 中：

1. 開啟 `tenants` 集合
2. 記下您要使用的社區文件 ID（例如：`tenant_001` 或自動生成的 ID）

### 步驟 3: 執行腳本建立用戶

```bash
cd functions
node create-saas-user.cjs <email> <password> <name> <tenantId> [phone]
```

**範例**：

```bash
# 基本用法
node create-saas-user.cjs admin@test.com test123456 "測試管理員" YOUR_TENANT_ID

# 包含電話號碼
node create-saas-user.cjs admin@dalove.com admin123 "大愛Line OA 管理員" dalove_001 0912345678
```

### 步驟 4: 測試登入

1. 啟動開發伺服器：

   ```bash
   cd community-portal
   npm run dev
   ```

2. 訪問：`http://localhost:3002/community/login`

3. 使用剛建立的帳號登入

---

## 方法 2: 手動建立（Firebase Console）

### 步驟 1: 建立 Firebase Auth 用戶

1. 前往 [Firebase Console > Authentication](https://console.firebase.google.com/project/safe-net-tw/authentication/users)
2. 點擊「新增使用者」
3. 輸入：
   - Email: `admin@test.com`
   - 密碼: `test123456`
4. 點擊「新增使用者」
5. **重要**：記下生成的「使用者 UID」（例如：`abc123xyz456`）

### 步驟 2: 在 Firestore 建立 saas_users 記錄

1. 前往 [Firestore Console](https://console.firebase.google.com/project/safe-net-tw/firestore)
2. 點擊「開始集合」或找到 `saas_users` 集合
3. 點擊「新增文件」
4. **文件 ID**：輸入步驟 1 的「使用者 UID」（必須相同！）
5. 新增以下欄位：

| 欄位        | 類型      | 值                           |
| ----------- | --------- | ---------------------------- |
| firebaseUid | string    | （步驟 1 的 UID）            |
| email       | string    | admin@test.com               |
| name        | string    | 測試管理員                   |
| phone       | string    | 0912345678（選填）           |
| avatar      | string    | null（選填）                 |
| tenantId    | string    | YOUR_TENANT_ID               |
| role        | string    | ADMIN                        |
| isActive    | boolean   | true                         |
| createdAt   | timestamp | （點擊時鐘圖示選擇當前時間） |
| updatedAt   | timestamp | （點擊時鐘圖示選擇當前時間） |

6. 點擊「儲存」

### 步驟 3: 確認社區存在

確保 `tenants` 集合中有對應的社區記錄（ID 與 tenantId 相同）。

如果沒有，建立一個：

1. 在 Firestore Console 中開啟 `tenants` 集合
2. 新增文件：

| 欄位                   | 類型      | 值                                  |
| ---------------------- | --------- | ----------------------------------- |
| code                   | string    | COMMUNITY001                        |
| name                   | string    | 測試社區                            |
| address                | string    | 測試地址                            |
| contactPerson          | string    | 聯絡人                              |
| contactPhone           | string    | 0912345678                          |
| lineChannelAccessToken | string    | （LINE Channel Access Token，選填） |
| lineChannelSecret      | string    | （LINE Channel Secret，選填）       |
| isActive               | boolean   | true                                |
| createdAt              | timestamp | （當前時間）                        |
| updatedAt              | timestamp | （當前時間）                        |

---

## 建立多個測試帳號

### 不同角色的測試帳號

#### 管理員帳號

```bash
node create-saas-user.cjs admin@test.com admin123 "Line OA 管理員" YOUR_TENANT_ID
```

#### 一般成員帳號

建立後手動修改 `role` 為 `MEMBER`：

```bash
node create-saas-user.cjs member@test.com member123 "社區成員" YOUR_TENANT_ID
```

然後在 Firestore Console 將該用戶的 `role` 欄位改為 `MEMBER`。

### 不同社區的測試帳號

```bash
# 社區 A
node create-saas-user.cjs admin-a@test.com test123 "社區A管理員" tenant_a

# 社區 B
node create-saas-user.cjs admin-b@test.com test123 "社區B管理員" tenant_b
```

---

## 驗證帳號

### 檢查清單

- [ ] Firebase Auth 中有該用戶（Authentication > Users）
- [ ] saas_users 集合中有記錄（文件 ID = Firebase UID）
- [ ] firebaseUid 欄位值與 Firebase UID 相同
- [ ] isActive 為 true
- [ ] tenantId 有值且對應的社區存在
- [ ] tenants 集合中有對應的社區記錄

### 測試登入

1. 開啟瀏覽器開發者工具（F12）
2. 訪問登入頁面
3. 輸入 Email 和密碼
4. 點擊登入
5. 檢查 Console 是否有錯誤訊息

**常見錯誤**：

| 錯誤訊息       | 原因                          | 解決方法                   |
| -------------- | ----------------------------- | -------------------------- |
| 找不到用戶記錄 | saas_users 不存在或 ID 不匹配 | 確認文件 ID = Firebase UID |
| 找不到社區資料 | tenantId 指向不存在的社區     | 建立對應的 tenant 記錄     |
| 帳號已被停用   | isActive = false              | 在 Firestore 改為 true     |
| 帳號或密碼錯誤 | 密碼錯誤或用戶不存在          | 在 Firebase Auth 重設密碼  |

---

## 重設密碼

### 使用 Firebase Console

1. 前往 Authentication > Users
2. 找到該用戶
3. 點擊三個點 > 重設密碼
4. 輸入新密碼

### 使用腳本

重新執行建立腳本，會自動更新密碼：

```bash
node create-saas-user.cjs admin@test.com NEW_PASSWORD "測試管理員" YOUR_TENANT_ID
```

---

## 刪除測試帳號

### 完整刪除步驟

1. **刪除 Firebase Auth 用戶**
   - Firebase Console > Authentication > Users
   - 找到用戶 > 刪除

2. **刪除 Firestore 記錄**
   - Firestore Console > saas_users
   - 找到對應文件 > 刪除

---

## 快速測試腳本

將以下內容儲存為 `quick-test.sh`：

```bash
#!/bin/bash

# 快速建立測試帳號並啟動開發伺服器

echo "建立測試帳號..."
cd functions
node create-saas-user.cjs admin@test.com test123456 "測試管理員" YOUR_TENANT_ID

echo ""
echo "啟動 Community Portal 開發伺服器..."
cd ../community-portal
npm run dev
```

使用：

```bash
chmod +x quick-test.sh
./quick-test.sh
```

---

## 故障排除

### 腳本執行錯誤

**錯誤**: `Cannot find module './service-account-key.json'`

**解決**: 確認 service-account-key.json 檔案在 functions/ 目錄下

---

**錯誤**: `社區 xxx 不存在`

**解決**:

1. 前往 Firestore Console 查看 tenants 集合
2. 確認社區 ID 正確
3. 或建立新的社區記錄

---

**錯誤**: `auth/email-already-exists`

**解決**: 該 Email 已被使用，腳本會自動使用現有用戶並更新密碼

---

### 登入問題

**問題**: 登入後重定向到登入頁面

**原因**: useAuth hook 驗證失敗

**檢查**:

1. 瀏覽器 Console 的錯誤訊息
2. saas_users 文件 ID 是否等於 Firebase UID
3. tenantId 是否有效

---

## 生產環境注意事項

1. **不要使用弱密碼**
   - 生產環境密碼至少 12 字元
   - 包含大小寫字母、數字、特殊符號

2. **保護 Service Account Key**
   - 不要提交到 Git
   - 不要分享給他人
   - 定期輪換

3. **啟用安全規則**
   - 部署前將 firestore.rules 改為生產環境規則
   - 移除開發模式的 allow all 規則

4. **設定適當權限**
   - 只給必要的人員 ADMIN 角色
   - 一般用戶使用 MEMBER 角色

---

## 下一步

建立測試帳號後：

1. 測試登入功能
2. 新增測試長者資料
3. 建立通知點
4. 測試設備綁定
5. 確認所有功能正常運作

參考 `COMMUNITY_PORTAL_SETUP.md` 中的完整測試清單。
