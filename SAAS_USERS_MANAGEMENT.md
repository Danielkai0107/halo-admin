# SaaS 用戶管理功能

## 功能說明

在 Admin 管理後台新增了「SaaS 用戶管理」頁面，用於管理社區管理網頁版（Community Portal）的用戶帳號。

## 訪問方式

1. 登入 Admin 管理後台
2. 側邊欄選單中找到「SaaS 用戶管理」（Shield 圖示）
3. 或直接訪問：`http://localhost:3000/saas-users`

## 主要功能

### 1. 查看用戶列表

顯示所有 SaaS 用戶的資訊：
- 姓名、Email、電話
- 所屬社區
- 角色（管理員/成員）
- 啟用狀態

支援按社區篩選。

### 2. 新增用戶

點擊「新增用戶」按鈕，填寫以下資訊：

**必填欄位**：
- Email（作為登入帳號）
- 密碼（至少 6 個字元）
- 姓名
- 所屬社區
- 角色

**選填欄位**：
- 電話

**角色說明**：
- **管理員（ADMIN）**：可新增/編輯/刪除長者、設定通知點等
- **成員（MEMBER）**：只能查看資料，無法編輯

### 3. 編輯用戶

點擊用戶列表中的「編輯」圖示，可以修改：
- 姓名
- 電話
- 所屬社區
- 角色

**注意**：
- Email 無法修改
- 無法透過介面修改密碼（需使用 Firebase Console）

### 4. 啟用/停用用戶

點擊「啟用/停用」圖示，快速切換用戶狀態。

停用的用戶無法登入 Community Portal。

### 5. 刪除用戶

點擊「刪除」圖示，將用戶設為停用狀態。

**注意**：這是軟刪除，用戶記錄仍保留在資料庫中。

## 技術實作

### 資料流程

```
1. 新增用戶
   ↓
2. Firebase Auth 建立帳號（createUserWithEmailAndPassword）
   ↓
3. 取得 Firebase UID
   ↓
4. Firestore 建立 saas_users 記錄（文件 ID = Firebase UID）
   ↓
5. 完成
```

### 資料結構

**Collection**: `saas_users`

**Document ID**: Firebase Auth UID（重要！）

**欄位**：
```typescript
{
  firebaseUid: string,      // 與 Firebase Auth UID 相同
  email: string,            // 登入 Email
  name: string,             // 用戶姓名
  phone: string | null,     // 電話（選填）
  avatar: string | null,    // 頭像（選填）
  tenantId: string,         // 所屬社區 ID
  role: 'ADMIN' | 'MEMBER', // 角色
  isActive: boolean,        // 啟用狀態
  createdAt: Timestamp,     // 建立時間
  updatedAt: Timestamp      // 更新時間
}
```

### 檔案列表

**新增的檔案**：
1. `src/services/saasUserService.ts` - SaaS 用戶服務層
2. `src/pages/SaasUsersPage.tsx` - SaaS 用戶管理頁面

**修改的檔案**：
1. `src/types/index.ts` - 新增 SaasUser 介面
2. `src/App.tsx` - 新增路由
3. `src/layouts/DashboardLayout.tsx` - 新增側邊欄選項

## 使用流程

### 建立第一個社區管理員帳號

1. 確認社區已存在（在「社區管理」頁面檢查）
2. 前往「SaaS 用戶管理」頁面
3. 點擊「新增用戶」
4. 填寫資訊：
   ```
   Email: admin@community.com
   密碼: admin123456
   姓名: 社區管理員
   所屬社區: （選擇社區）
   角色: 管理員
   ```
5. 點擊「新增」
6. 建立成功後，該用戶即可登入 Community Portal

### 測試登入

1. 開啟 Community Portal：`http://localhost:3002/community/login`
2. 使用剛建立的帳號登入
3. 確認可以看到社區資料和長者列表

## 權限說明

### Admin 管理後台權限

只有以下角色可以管理 SaaS 用戶：
- SUPER_ADMIN（超級管理員）

### Community Portal 權限

SaaS 用戶登入 Community Portal 後：

| 功能 | ADMIN 角色 | MEMBER 角色 |
|------|-----------|------------|
| 查看長者列表 | ✓ | ✓ |
| 新增/編輯長者 | ✓ | ✗ |
| 查看設備列表 | ✓ | ✓ |
| 查看通知記錄 | ✓ | ✓ |
| 管理通知點 | ✓ | ✗ |

## 常見問題

### Q: 新增用戶時顯示「此 Email 已被使用」

A: 該 Email 已在 Firebase Auth 中註冊。可以：
1. 使用其他 Email
2. 或在 Firebase Console 刪除舊帳號後重新建立

### Q: 用戶建立成功但無法登入

A: 檢查：
1. Firestore 中 `saas_users` 文件 ID 是否等於 Firebase Auth UID
2. `firebaseUid` 欄位值是否正確
3. `isActive` 是否為 `true`
4. `tenantId` 是否有效

### Q: 如何重設用戶密碼？

A: 目前有兩種方法：
1. **Firebase Console**：Authentication > Users > 找到用戶 > 重設密碼
2. **使用腳本**：執行 `functions/create-saas-user.cjs`，會自動更新密碼

### Q: 刪除用戶後如何復原？

A: 
1. 前往 SaaS 用戶管理頁面
2. 找到該用戶（狀態顯示「停用」）
3. 點擊「啟用」圖示

### Q: 可以為一個人建立多個社區的帳號嗎？

A: 目前一個 Email 只能對應一個社區。如需管理多個社區，可以：
1. 使用不同的 Email（如 admin@community-a.com, admin@community-b.com）
2. 或未來擴展為支援多社區（將 tenantId 改為 tenantIds 陣列）

## 統計資訊

頁面下方顯示三個統計卡片：
- 總用戶數
- 啟用用戶數
- 管理員數量

## 與其他用戶系統的區別

| 集合 | 用途 | 登入方式 | 使用應用 |
|------|------|---------|---------|
| users | 總公司人員 | Email/密碼 | Admin 管理後台 |
| saas_users | 社區管理員 | Email/密碼 | Community Portal |
| appUsers | 社區成員 | LINE | LIFF App |

## 安全性考量

1. **密碼強度**
   - 最少 6 個字元（Firebase 限制）
   - 建議使用強密碼（含大小寫、數字、符號）

2. **權限控制**
   - 只有 SUPER_ADMIN 可以建立 SaaS 用戶
   - SaaS 用戶只能存取自己社區的資料

3. **資料保護**
   - 停用用戶會立即無法登入
   - Firestore Rules 限制跨社區存取

## 後續優化建議

1. **密碼重設功能**
   - 建立 Cloud Function 實現密碼重設
   - 在介面中加入「重設密碼」按鈕

2. **批次匯入**
   - 支援 CSV 批次匯入多個用戶
   - 自動產生密碼並發送 Email

3. **多社區支援**
   - 將 `tenantId` 改為 `tenantIds` 陣列
   - 登入後顯示社區選擇介面

4. **活動日誌**
   - 記錄用戶登入時間
   - 記錄操作歷史

5. **Email 通知**
   - 帳號建立時發送歡迎信
   - 密碼重設通知
   - 帳號停用通知
