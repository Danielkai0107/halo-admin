# Line 用戶管理刪除功能修正

## 問題描述

在刪除Line 用戶管理時，發現兩個問題：

1. **裝置未解綁**: 刪除用戶時，如果用戶有綁定裝置，裝置的綁定狀態未被清除
2. **Firebase Auth 未刪除**: 刪除 Firestore 中的 `mapAppUsers` 文檔後，Firebase Auth 中的用戶帳號仍然存在

## 根本原因

### 問題 1：裝置未解綁

原本的 `mapAppUserService.delete()` 方法直接刪除 Firestore 文檔，沒有先檢查並解除裝置綁定：

```typescript
// 原本的程式碼
delete: (id: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      await deleteDocument('mapAppUsers', id);  // 直接刪除，未處理綁定
      resolve({ data: { success: true } });
    } catch (error) {
      console.error('Failed to delete map app user:', error);
      reject(error);
    }
  });
}
```

### 問題 2：Firebase Auth 未刪除

從 `functions/src/mapApp/auth.ts` 可以看到，Line 用戶管理的註冊流程：

1. 用戶先在客戶端通過 Firebase Auth SDK 創建帳號
2. 然後調用 `mapUserAuth` API 創建 Firestore 文檔
3. Firestore 文檔的 ID 使用 Firebase Auth 的 UID

```typescript
// auth.ts 第 69-83 行
const newUser = {
  id: userId, // userId 來自 decodedToken.uid
  // ...
};
await db.collection("mapAppUsers").doc(userId).set(newUser);
```

因此，刪除 Firestore 文檔時，也需要刪除對應的 Firebase Auth 帳號。但是：

- 前端使用的是 Firebase Client SDK，無法刪除其他用戶的 Auth 帳號
- 只有後端 Cloud Functions 使用 Admin SDK 才能執行 `admin.auth().deleteUser(uid)`

## 解決方案

### 創建新的 Cloud Function：`deleteMapAppUser`

建立一個完整的用戶刪除流程，包含以下步驟：

**檔案：** `functions/src/mapApp/deleteUser.ts`

**執行流程：**

1. **權限檢查**
   - 用戶本人可以刪除自己的帳號
   - 管理員（SUPER_ADMIN、TENANT_ADMIN）可以刪除任何用戶

2. **解綁裝置（如果有綁定）**
   - 將裝置活動記錄匿名化並歸檔到 `anonymousActivities` collection
   - 清空裝置的 `activities` 子集合
   - 將裝置狀態改為 `UNBOUND`
   - 清除裝置上的 `mapUserNickname`、`mapUserAge`、`mapUserGender`
   - 清除用戶的 `boundDeviceId`

3. **刪除通知點位**
   - 刪除用戶的所有通知點位 (`mapUserNotificationPoints`)

4. **刪除 Firestore 文檔**
   - 刪除 `mapAppUsers/{userId}` 文檔

5. **刪除 Firebase Auth 帳號**
   - 使用 `admin.auth().deleteUser(userId)` 刪除 Auth 帳號

### 修改前端服務

**檔案：** `src/services/mapAppUserService.ts`

修改 `delete()` 方法，改為調用新的 Cloud Function：

```typescript
delete: (id: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      const idToken = await user.getIdToken();

      // 調用 Cloud Function API
      const response = await fetch('https://us-central1-safe-net-tw.cloudfunctions.net/deleteMapAppUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId: id }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete map app user');
      }

      resolve({ data: { success: true, details: data.details } });
    } catch (error: any) {
      console.error('Failed to delete map app user:', error);
      reject(error);
    }
  });
}
```

### 更新 API 文檔

**檔案：** `MAP_APP_API_ENDPOINTS.md`

新增 `deleteMapAppUser` API 的完整說明，包含：

- API 端點和認證方式
- 請求參數和回應格式
- 權限說明
- 注意事項（不可復原、資料匿名化等）

## 部署狀態

✅ Cloud Function 已成功部署

- **函數名稱：** `deleteMapAppUser`
- **URL：** `https://us-central1-safe-net-tw.cloudfunctions.net/deleteMapAppUser`
- **Region：** us-central1
- **Runtime：** Node.js 20 (2nd Gen)

## 測試建議

1. **測試用戶自己刪除帳號**
   - 創建一個測試用戶
   - 綁定一個測試裝置
   - 新增一些通知點位
   - 執行刪除操作
   - 驗證：
     - Firestore `mapAppUsers` 文檔已刪除
     - Firebase Auth 帳號已刪除
     - 裝置狀態恢復為 `UNBOUND`
     - 通知點位已刪除
     - 活動記錄已匿名化並歸檔

2. **測試管理員刪除其他用戶**
   - 使用管理員帳號登入後台
   - 刪除測試用戶
   - 驗證相同的結果

3. **測試錯誤處理**
   - 嘗試刪除不存在的用戶
   - 嘗試以非管理員身份刪除其他用戶
   - 驗證適當的錯誤訊息

## 影響範圍

### 修改的檔案

1. `functions/src/mapApp/deleteUser.ts` - **新增**
2. `functions/src/index.ts` - 匯出新函數
3. `src/services/mapAppUserService.ts` - 修改刪除邏輯
4. `MAP_APP_API_ENDPOINTS.md` - 新增 API 文檔

### 資料庫變更

無需修改 Firestore 結構或安全規則。

### 向後相容性

✅ 完全向後相容

- 前端的其他功能不受影響
- 刪除操作現在更完整且安全

## 後續建議

1. **監控**：觀察 Cloud Function 的執行狀況和錯誤率
2. **日誌**：檢查匿名化的活動記錄是否正確歸檔
3. **備份**：考慮在刪除前先備份用戶資料（可選）

## 日期

- **修正日期：** 2026-01-24
- **部署日期：** 2026-01-24
