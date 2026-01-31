# 後端 API 修改規格

> 此文件提供給後端團隊實作，用於統一 API 錯誤處理格式和標準化錯誤碼

## 一、統一錯誤回應格式

### 現有問題
- 錯誤訊息格式不統一
- 前端需要用字串比對判斷錯誤類型（不可靠且難維護）
- 無統一的錯誤碼標準

### 修改後格式

所有 API 的錯誤回應必須包含以下欄位：

```json
{
  "success": false,
  "error": "人類可讀的錯誤訊息（繁體中文）",
  "errorCode": "STANDARDIZED_ERROR_CODE",
  "errorDetails": {}  // 選填，用於提供額外的錯誤上下文
}
```

成功回應保持現有格式：
```json
{
  "success": true,
  // ... 其他數據欄位
}
```

---

## 二、標準錯誤碼定義

| 錯誤碼 | 說明 | HTTP 狀態碼建議 | 適用 API |
|--------|------|----------------|----------|
| `USER_NOT_FOUND` | 用戶不存在（在後端資料庫中找不到） | 404 | mapUserAuth(login), getMapUserProfile, 所有需要 userId 的 API |
| `USER_ALREADY_EXISTS` | 用戶已存在（註冊時 email 已被使用） | 409 | mapUserAuth(register) |
| `INVALID_CREDENTIALS` | 認證資訊無效 | 401 | mapUserAuth |
| `DEVICE_NOT_FOUND` | 設備不存在 | 404 | bindDeviceToMapUser |
| `DEVICE_ALREADY_BOUND` | 設備已被其他用戶綁定 | 409 | bindDeviceToMapUser |
| `NO_BOUND_DEVICE` | 用戶未綁定設備 | 400 | unbindDeviceFromMapUser, updateMapUserDevice |
| `ACCOUNT_DELETED` | 帳號已被刪除 | 410 | 所有 API（當檢測到用戶被標記為已刪除） |
| `UNAUTHORIZED` | 未授權（Token 無效或過期） | 401 | 所有需要認證的 API |
| `VALIDATION_ERROR` | 參數驗證失敗 | 400 | 所有 API |
| `INTERNAL_ERROR` | 伺服器內部錯誤 | 500 | 所有 API |

### 錯誤碼使用原則

1. **一致性**：相同錯誤情況必須使用相同錯誤碼
2. **明確性**：錯誤碼應清楚表達錯誤原因
3. **可擴展性**：保留擴展新錯誤碼的空間

---

## 三、各 API 具體修改規格

### 3.1 mapUserAuth（註冊/登入 API）

**端點**：`POST /mapUserAuth`

**現有問題**：
- 登入時若用戶不存在，前端需用字串比對判斷
- 無法區分「用戶不存在」和「密碼錯誤」

**Request（不變）**：
```json
{
  "action": "register" | "login",
  "email": "string",
  "name": "string (register 時必填)",
  "phone": "string (選填)"
}
```

**Response - 成功**：
```json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "phone": "string | null",
    "createdAt": "timestamp",
    "isNewUser": false  // 新增：標示是否為新創建的用戶（用於分析）
  }
}
```

**Response - 失敗（登入時用戶不存在）**：
```json
{
  "success": false,
  "error": "用戶不存在，請先註冊",
  "errorCode": "USER_NOT_FOUND"
}
```

**Response - 失敗（註冊時 email 已被使用）**：
```json
{
  "success": false,
  "error": "此電子郵件已被註冊",
  "errorCode": "USER_ALREADY_EXISTS"
}
```

**Response - 失敗（參數驗證失敗）**：
```json
{
  "success": false,
  "error": "參數驗證失敗",
  "errorCode": "VALIDATION_ERROR",
  "errorDetails": {
    "fields": {
      "email": "電子郵件格式不正確",
      "name": "姓名不可為空"
    }
  }
}
```

---

### 3.2 getMapUserProfile（取得用戶資料）

**端點**：`GET /getMapUserProfile?userId={userId}`

**新增錯誤處理**：

在執行查詢前，必須檢查用戶是否存在：

```json
// 用戶不存在時
{
  "success": false,
  "error": "帳號不存在或已被刪除",
  "errorCode": "USER_NOT_FOUND"
}
```

---

### 3.3 bindDeviceToMapUser（綁定設備）

**端點**：`POST /bindDeviceToMapUser`

**新增錯誤處理**：

```json
// 用戶不存在
{
  "success": false,
  "error": "用戶不存在",
  "errorCode": "USER_NOT_FOUND"
}

// 設備不存在
{
  "success": false,
  "error": "設備不存在，請檢查產品序號",
  "errorCode": "DEVICE_NOT_FOUND"
}

// 設備已被綁定
{
  "success": false,
  "error": "此設備已被其他用戶綁定",
  "errorCode": "DEVICE_ALREADY_BOUND"
}
```

---

### 3.4 unbindDeviceFromMapUser（解綁設備）

**端點**：`POST /unbindDeviceFromMapUser`

**新增錯誤處理**：

```json
// 用戶不存在
{
  "success": false,
  "error": "用戶不存在",
  "errorCode": "USER_NOT_FOUND"
}

// 用戶未綁定設備
{
  "success": false,
  "error": "您尚未綁定任何設備",
  "errorCode": "NO_BOUND_DEVICE"
}
```

---

### 3.5 updateMapUserDevice（更新設備資訊）

**端點**：`POST /updateMapUserDevice`

**新增錯誤處理**：

```json
// 用戶不存在
{
  "success": false,
  "error": "用戶不存在",
  "errorCode": "USER_NOT_FOUND"
}

// 用戶未綁定設備（嘗試更新設備資訊時）
{
  "success": false,
  "error": "您尚未綁定設備，無法更新設備資訊",
  "errorCode": "NO_BOUND_DEVICE"
}
```

---

### 3.6 所有其他需要 userId 的 API

以下 API 都需要加入用戶存在性檢查：

- `updateMapUserFcmToken`
- `addMapUserNotificationPoint`
- `getMapUserNotificationPoints`
- `updateMapUserNotificationPoint`
- `removeMapUserNotificationPoint`
- `getMapUserActivities`
- `deleteMapAppUser`
- `updateMapUserAvatar`

**統一錯誤處理**：

在執行任何操作前，檢查用戶是否存在：

```typescript
// 偽代碼範例
async function handleApiRequest(userId: string) {
  const user = await db.collection('mapAppUsers').doc(userId).get();
  
  if (!user.exists) {
    return {
      success: false,
      error: '帳號不存在或已被刪除',
      errorCode: 'USER_NOT_FOUND'
    };
  }
  
  // 繼續執行業務邏輯...
}
```

---

## 四、建議新增的 API

### 4.1 checkMapUserStatus（檢查用戶狀態）

**端點**：`GET /checkMapUserStatus?userId={userId}`

**用途**：輕量級 API，用於快速檢查用戶狀態，不返回完整用戶資料

**Request**：
```
GET /checkMapUserStatus?userId={userId}
```

**Response - 用戶存在**：
```json
{
  "success": true,
  "exists": true,
  "status": "ACTIVE",
  "userId": "string"
}
```

**Response - 用戶不存在**：
```json
{
  "success": true,
  "exists": false,
  "status": "NOT_FOUND"
}
```

**可能的 status 值**：
- `ACTIVE`：正常活躍用戶
- `DELETED`：已被刪除
- `SUSPENDED`：已被暫停（未來擴展）
- `NOT_FOUND`：不存在

---

## 五、實作檢查清單

### Phase 1：錯誤回應格式統一
- [ ] 更新所有 API 的錯誤回應，加入 `errorCode` 欄位
- [ ] 確保 `error` 欄位使用繁體中文人類可讀訊息
- [ ] 測試所有錯誤情況是否正確返回標準格式

### Phase 2：標準錯誤碼實作
- [ ] 在程式碼中定義錯誤碼常數（避免拼寫錯誤）
- [ ] mapUserAuth API 實作錯誤碼
- [ ] getMapUserProfile API 實作錯誤碼
- [ ] 設備相關 API 實作錯誤碼
- [ ] 通知點位相關 API 實作錯誤碼

### Phase 3：用戶存在性檢查
- [ ] 建立統一的用戶存在性檢查函式
- [ ] 所有需要 userId 的 API 加入檢查
- [ ] 測試用戶不存在時的錯誤處理

### Phase 4：新增 API（選擇性）
- [ ] 實作 checkMapUserStatus API
- [ ] 測試驗證

---

## 六、向後相容性說明

### 漸進式升級策略

1. **第一階段**：在現有錯誤回應中加入 `errorCode` 欄位
   - 保留現有的 `error` 訊息格式
   - 新增 `errorCode` 欄位
   - 前端逐步遷移到使用 `errorCode`

2. **第二階段**：統一錯誤訊息格式
   - 標準化所有 `error` 欄位的文字內容
   - 確保 `errorCode` 完整實作

3. **第三階段**（未來）：可考慮移除舊版字串比對支援

### 前端相容性

- 前端會優先檢查 `errorCode`，如果不存在則回退到字串比對
- 建議在 1-2 個版本內完成後端更新

---

## 七、測試範例

### 測試案例 1：登入不存在的用戶

**Request**：
```bash
curl -X POST https://mapuserauth-kmzfyt3t5a-uc.a.run.app \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "action": "login",
    "email": "nonexistent@example.com"
  }'
```

**Expected Response**：
```json
{
  "success": false,
  "error": "用戶不存在，請先註冊",
  "errorCode": "USER_NOT_FOUND"
}
```

### 測試案例 2：註冊已存在的 email

**Request**：
```bash
curl -X POST https://mapuserauth-kmzfyt3t5a-uc.a.run.app \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "action": "register",
    "email": "existing@example.com",
    "name": "Test User"
  }'
```

**Expected Response**：
```json
{
  "success": false,
  "error": "此電子郵件已被註冊",
  "errorCode": "USER_ALREADY_EXISTS"
}
```

### 測試案例 3：綁定不存在的設備

**Request**：
```bash
curl -X POST https://binddevicetomapuser-kmzfyt3t5a-uc.a.run.app \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "userId": "valid-user-id",
    "deviceName": "INVALID-SERIAL-123"
  }'
```

**Expected Response**：
```json
{
  "success": false,
  "error": "設備不存在，請檢查產品序號",
  "errorCode": "DEVICE_NOT_FOUND"
}
```

---

## 八、聯絡資訊

如有任何問題或需要澄清規格，請聯絡前端團隊。

**實作優先級**：
1. 高優先級：mapUserAuth, getMapUserProfile（影響登入流程）
2. 中優先級：設備相關 API（影響設備綁定功能）
3. 低優先級：其他 API, checkMapUserStatus（漸進式優化）

**預計完成時間**：建議 2-3 週內完成高優先級 API 修改。
