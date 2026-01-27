# 🧪 設備綁定功能快速測試清單

**測試對象:** 地圖 APP 設備綁定功能更新  
**測試日期:** 2026-01-21

---

## ✅ 測試前準備

### 1. 確認編譯成功

```bash
cd functions
npm run build
# 應該看到：build 成功，無錯誤
```

### 2. 準備測試數據

在 Firestore Console 中準備以下測試數據：

#### 測試設備 A（可綁定）

```json
{
  "id": "test_device_public_001",
  "deviceName": "TEST-001",
  "uuid": "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0",
  "major": 999,
  "minor": 1,
  "poolType": "PUBLIC",
  "elderId": null,
  "mapAppUserId": null,
  "isActive": true
}
```

#### 測試設備 B（已綁定老人，不可綁定）

```json
{
  "id": "test_device_elder_002",
  "deviceName": "TEST-002",
  "uuid": "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0",
  "major": 999,
  "minor": 2,
  "poolType": "PUBLIC",
  "elderId": "some_elder_id", // 已綁定老人
  "mapAppUserId": null,
  "isActive": true
}
```

#### 測試設備 C（非公共池，不可綁定）

```json
{
  "id": "test_device_tenant_003",
  "deviceName": "TEST-003",
  "uuid": "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0",
  "major": 999,
  "minor": 3,
  "poolType": "TENANT", // 非公共池
  "elderId": null,
  "mapAppUserId": null,
  "isActive": true
}
```

#### 測試用戶

```json
{
  "id": "test_map_user_001",
  "email": "testuser@example.com",
  "name": "測試用戶",
  "isActive": true,
  "notificationEnabled": true
}
```

---

## 🧪 測試案例

### ✅ 測試 1: 使用 deviceId 綁定（正常情況）

**預期結果:** 綁定成功

**步驟:**

1. 登入後台管理系統
2. 進入「Line 用戶管理管理」頁面
3. 找到測試用戶，點擊「綁定」按鈕
4. 在下拉選單選擇「TEST-001」設備（使用 deviceId）
5. 填寫暱稱和年齡（選填）
6. 點擊「綁定」

**驗證:**

- [ ] 綁定成功，無錯誤訊息
- [ ] 用戶列表中顯示綁定的設備資訊
- [ ] Firestore 中 `mapAppUsers` 文檔更新了 `boundDeviceId`
- [ ] Firestore 中 `devices` 文檔更新了 `mapAppUserId`

---

### ✅ 測試 2: 使用 deviceName 綁定（產品序號）

**預期結果:** 綁定成功

**使用 Postman 或 curl 測試:**

```bash
# 先獲取 Firebase ID Token（在瀏覽器 Console 執行）
firebase.auth().currentUser.getIdToken().then(token => console.log(token))

# 使用 curl 測試
curl -X POST https://binddevicetomapuser-kmzfyt3t5a-uc.a.run.app \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{
    "userId": "test_map_user_001",
    "deviceName": "TEST-001",
    "nickname": "測試手環",
    "age": 65
  }'
```

**驗證:**

- [ ] 返回 `{ "success": true, ... }`
- [ ] Firestore 數據正確更新

---

### ❌ 測試 3: 嘗試綁定已有 elderId 的設備

**預期結果:** 綁定失敗，顯示錯誤訊息

**步驟:**

1. 嘗試綁定「TEST-002」設備（已綁定給老人）

**預期錯誤:**

```json
{
  "success": false,
  "error": "Device is already bound to an elder in the tenant system"
}
```

**驗證:**

- [ ] 顯示正確的錯誤訊息
- [ ] 設備未被綁定
- [ ] Firestore 數據未改變

---

### ❌ 測試 4: 嘗試綁定非 PUBLIC 池的設備

**預期結果:** 綁定失敗，顯示錯誤訊息

**步驟:**

1. 嘗試綁定「TEST-003」設備（poolType = TENANT）

**預期錯誤:**

```json
{
  "success": false,
  "error": "Device is not available in public pool (poolType must be PUBLIC)"
}
```

**驗證:**

- [ ] 顯示正確的錯誤訊息
- [ ] 設備未被綁定

---

### ❌ 測試 5: 使用不存在的 deviceName

**預期結果:** 綁定失敗，顯示錯誤訊息

**步驟:**

```bash
curl -X POST https://binddevicetomapuser-kmzfyt3t5a-uc.a.run.app \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{
    "userId": "test_map_user_001",
    "deviceName": "NOT-EXISTS-999"
  }'
```

**預期錯誤:**

```json
{
  "success": false,
  "error": "Device with deviceName 'NOT-EXISTS-999' not found"
}
```

**驗證:**

- [ ] 顯示正確的錯誤訊息

---

### ✅ 測試 6: 管理員為其他用戶綁定設備

**預期結果:** 綁定成功（需要管理員權限）

**步驟:**

1. 以管理員身份登入
2. 為其他用戶綁定設備

**驗證:**

- [ ] 管理員可以成功為其他用戶綁定設備
- [ ] Firestore 數據正確更新

---

### ❌ 測試 7: 非管理員嘗試為其他用戶綁定

**預期結果:** 操作失敗（權限不足）

**前提:** 使用非管理員帳號的 ID Token

**預期錯誤:**

```json
{
  "success": false,
  "error": "Forbidden: Cannot bind device to another user"
}
```

---

### ✅ 測試 8: 解綁設備

**預期結果:** 解綁成功

**步驟:**

1. 找到已綁定設備的用戶
2. 點擊「解綁」按鈕
3. 確認解綁

**驗證:**

- [ ] 解綁成功
- [ ] 用戶列表中不再顯示設備資訊
- [ ] Firestore 中 `mapAppUsers` 的 `boundDeviceId` 為 `null`
- [ ] Firestore 中 `devices` 的 `mapAppUserId` 為 `null`

---

### ✅ 測試 9: 重複綁定（換綁）

**預期結果:** 舊設備自動解綁，新設備綁定成功

**步驟:**

1. 用戶已綁定設備 A
2. 為該用戶綁定設備 B

**驗證:**

- [ ] 設備 A 自動解綁（`mapAppUserId` = null）
- [ ] 設備 B 成功綁定
- [ ] 用戶只有一個綁定的設備

---

## 📊 測試結果總結

**測試日期:** **\*\***\_\_\_**\*\***  
**測試人員:** **\*\***\_\_\_**\*\***

| 測試編號 | 測試項目                | 結果            | 備註 |
| -------- | ----------------------- | --------------- | ---- |
| 1        | 使用 deviceId 綁定      | ☐ 通過 / ☐ 失敗 |      |
| 2        | 使用 deviceName 綁定    | ☐ 通過 / ☐ 失敗 |      |
| 3        | 綁定有 elderId 的設備   | ☐ 通過 / ☐ 失敗 |      |
| 4        | 綁定非 PUBLIC 池設備    | ☐ 通過 / ☐ 失敗 |      |
| 5        | 使用不存在的 deviceName | ☐ 通過 / ☐ 失敗 |      |
| 6        | 管理員為其他用戶綁定    | ☐ 通過 / ☐ 失敗 |      |
| 7        | 非管理員越權操作        | ☐ 通過 / ☐ 失敗 |      |
| 8        | 解綁設備                | ☐ 通過 / ☐ 失敗 |      |
| 9        | 重複綁定（換綁）        | ☐ 通過 / ☐ 失敗 |      |

---

## 🐛 發現的問題

請記錄測試過程中發現的任何問題：

1.
2.
3.

---

## ✅ 測試完成後清理

```bash
# 刪除測試數據
# 在 Firestore Console 中手動刪除測試設備和用戶
```

---

**測試文檔版本:** 1.0.0  
**最後更新:** 2026-01-21
