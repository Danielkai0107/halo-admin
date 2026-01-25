# Cloud Functions 更新總結

**更新日期：** 2026-01-21  
**架構版本：** 2.0.0（統一綁定架構）

---

## ✅ 已更新的 Cloud Functions

### 1. receiveBeaconData（核心函數）

**檔案：** `functions/src/beacon/receiveBeaconData.ts`

**主要變更：**
- ✅ 統一 `processBeacon` 函數邏輯
- ✅ 新增 `recordDeviceActivity()` - 記錄到 devices 子集合
- ✅ 新增 `handleNotification()` - 根據 bindingType 決定通知
- ✅ 新增 `handleElderNotification()` - 處理長者 LINE 通知
- ✅ 新增 `handleMapUserNotification()` - 處理 APP 用戶 FCM 通知
- ✅ 重構 `sendLineNotificationToTenant()` - 發送 LINE 通知
- ✅ 重構 `createBoundaryAlertForElder()` - 創建邊界警報
- ❌ 移除 `handleMapUserBeacon()`（合併到新架構）
- ❌ 移除 `sendLineNotification()`（重構為 sendLineNotificationToTenant）
- ❌ 移除 `createBoundaryAlert()`（重構為 createBoundaryAlertForElder）
- ❌ 不再更新 `latest_locations` collection
- ❌ 不再寫入 `mapUserActivities` collection

**新邏輯流程：**
```
收到 Beacon 資料
  ↓
找到 Device
  ↓
更新 Device 狀態（batteryLevel, lastSeen, lastRssi）
  ↓
記錄活動到 devices/{deviceId}/activities
  ↓
根據 device.bindingType 決定通知：
  ├─ ELDER → LINE 通知（透過 Elder.tenantId 找到社區）
  ├─ MAP_USER → FCM 推播
  └─ UNBOUND → 不通知
```

---

### 2. bindDeviceToMapUser

**檔案：** `functions/src/mapApp/deviceBinding.ts`

**主要變更：**
```typescript
// 舊檢查
if (deviceData?.elderId) { ... }
if (deviceData?.poolType !== 'PUBLIC') { ... }
if (deviceData?.mapAppUserId && ...) { ... }

// 新檢查
if (deviceData?.bindingType === 'ELDER') { ... }
if (deviceData?.bindingType === 'MAP_USER' && deviceData.boundTo !== userId) { ... }

// 舊綁定
await devices.update({ mapAppUserId: userId });
await mapAppUsers.update({ boundDeviceId, deviceNickname, deviceOwnerAge, boundAt });

// 新綁定
await devices.update({ 
  bindingType: 'MAP_USER',
  boundTo: userId,
  boundAt,
  mapUserNickname: nickname,
  mapUserAge: age 
});
await mapAppUsers.update({ boundDeviceId });
```

---

### 3. unbindDeviceFromMapUser

**檔案：** `functions/src/mapApp/deviceBinding.ts`

**主要變更：**
```typescript
// 舊解綁
await devices.update({ mapAppUserId: null });
await mapAppUsers.update({ boundDeviceId: null, deviceNickname: null, deviceOwnerAge: null, boundAt: null });

// 新解綁
await devices.update({ 
  bindingType: 'UNBOUND',
  boundTo: null,
  boundAt: null,
  mapUserNickname: null,
  mapUserAge: null 
});
await mapAppUsers.update({ boundDeviceId: null });
```

---

### 4. getMapUserProfile

**檔案：** `functions/src/mapApp/userProfile.ts`

**主要變更：**
```typescript
// 舊取值
nickname: userData?.deviceNickname || null,
age: userData?.deviceOwnerAge || null,
boundAt: userData?.boundAt

// 新取值（從 Device 取得）
nickname: deviceData?.mapUserNickname || null,
age: deviceData?.mapUserAge || null,
boundAt: deviceData?.boundAt
```

---

### 5. getMapUserActivities

**檔案：** `functions/src/mapApp/activities.ts`

**主要變更：**
```typescript
// 舊查詢
db.collection('mapUserActivities')
  .where('mapAppUserId', '==', userId)

// 新查詢（從 Device 子集合）
db.collection('devices').doc(userData.boundDeviceId)
  .collection('activities')
```

**回應新增欄位：**
- `gatewayType`: 閘道類型
- `bindingType`: 當時的綁定類型
- `boundTo`: 當時綁定的對象 ID
- `notificationType`: 通知類型（"LINE", "FCM", null）
- `notificationDetails`: 通知詳細資訊

---

### 6. getPublicGateways

**檔案：** `functions/src/mapApp/gateways.ts`

**主要變更：**
```typescript
// 移除欄位
// poolType: data.poolType || 'TENANT',  ❌

// 保留欄位
tenantId: data.tenantId || null,  ✅
```

---

### 7. addMapUserNotificationPoint

**檔案：** `functions/src/mapApp/notificationPoints.ts`

**主要變更：**
- 更新註解：移除 poolType 相關說明
- 邏輯保持不變（不涉及裝置綁定）

---

## ❌ 不需更新的 Functions

### 1. mapUserAuth
**檔案：** `functions/src/mapApp/auth.ts`  
**原因：** 只處理用戶註冊/登入，不涉及裝置綁定

### 2. updateMapUserFcmToken
**檔案：** `functions/src/mapApp/fcmToken.ts`  
**原因：** 只更新 FCM Token，不涉及裝置綁定

### 3. updateMapUserNotificationPoint / removeMapUserNotificationPoint
**檔案：** `functions/src/mapApp/notificationPoints.ts`  
**原因：** 只處理通知點位，不涉及裝置綁定

---

## 📊 更新統計

| 類別 | 數量 | 狀態 |
|------|------|------|
| 已更新 Functions | 6 | ✅ |
| 不需更新 Functions | 5 | ✅ |
| 編譯狀態 | 通過 | ✅ |
| Linter 錯誤 | 0 | ✅ |

---

## 🔄 資料流對比

### 舊架構（分散）
```
Device.elderId → Elder
Device.mapAppUserId → MapAppUser → deviceNickname, deviceOwnerAge
Device.poolType → 決定可用性
Device.tenantId → 社區分配

活動記錄：
├─ latest_locations/{elderId}
└─ mapUserActivities/{activityId}
```

### 新架構（統一）
```
Device.bindingType + Device.boundTo → Elder 或 MapAppUser
Device.mapUserNickname, Device.mapUserAge → 資料在 Device
Device.tags → 標籤（取代 tenantId）

活動記錄：
└─ devices/{deviceId}/activities（統一）
```

---

## 🧪 需要測試的函數

### 高優先級測試
- [ ] **receiveBeaconData** - 核心邏輯大幅重構
  - 測試 bindingType='ELDER' 的通知
  - 測試 bindingType='MAP_USER' 的通知
  - 測試 bindingType='UNBOUND' 不通知
  - 驗證活動記錄到正確的子集合

- [ ] **bindDeviceToMapUser** - 綁定邏輯變更
  - 測試綁定成功
  - 測試綁定已綁定給長者的裝置（應被拒絕）
  - 驗證 mapUserNickname 和 mapUserAge 存在 Device

- [ ] **unbindDeviceFromMapUser** - 解綁邏輯變更
  - 測試解綁成功
  - 驗證 Device bindingType 變為 UNBOUND

### 中優先級測試
- [ ] **getMapUserProfile** - 資料來源變更
  - 驗證 nickname 和 age 從 Device 取得

- [ ] **getMapUserActivities** - 查詢來源變更
  - 驗證從 devices 子集合查詢
  - 驗證回應包含新欄位（bindingType, notificationType）

- [ ] **getPublicGateways** - 回應格式變更
  - 驗證不再回傳 poolType

---

## 🚀 部署建議

### 1. 部署前檢查
```bash
cd functions
npm run build
npm run lint
```

### 2. 部署所有更新的函數
```bash
firebase deploy --only functions:receiveBeaconData,functions:bindDeviceToMapUser,functions:unbindDeviceFromMapUser,functions:getMapUserProfile,functions:getMapUserActivities,functions:getPublicGateways
```

### 3. 部署後驗證
- 檢查 Firebase Console 的函數日誌
- 測試綁定/解綁流程
- 發送測試 beacon 資料驗證通知

---

## ⚠️ 注意事項

1. **向後不相容：** 這是重大架構變更（v2.0.0），舊數據需要清理
2. **活動記錄：** 新活動將記錄在 devices 子集合，舊的 mapUserActivities 不再使用
3. **資料遷移：** 需要手動清理 Device 和 MapAppUser 的舊欄位
4. **測試環境：** 建議先在測試環境完整測試後再部署到生產環境

---

**編譯狀態：** ✅ 通過  
**更新日期：** 2026-01-21  
**下次審查：** 部署後一週
