# 活動記錄中加入 notificationPointId 更新說明

**更新日期:** 2026-01-22  
**更新內容:** 重構 beacon 處理函數，在活動記錄中加入 notificationPointId 欄位

---

## 📋 問題說明

### 原有問題
在更新前，`devices/{deviceId}/activities` 子集合中的活動記錄**缺少 `notificationPointId` 欄位**：

```typescript
// ❌ 舊的活動記錄
{
  timestamp: "2026-01-22T10:30:00Z",
  gatewayId: "gateway_001",
  triggeredNotification: false,     // 總是 false
  notificationType: null,            // 總是 null
  notificationDetails: null,         // 總是 null
  // ❌ 缺少 notificationPointId
}
```

### 原因分析
活動記錄和通知處理是**兩個獨立的步驟**：

1. 先記錄活動 → 此時還不知道是否觸發通知
2. 再處理通知 → 此時才查詢到 notificationPointId

因此活動記錄中的通知相關欄位都是空的。

---

## 🔧 解決方案：方案 3 - 重構函數

### 架構調整

**變更前的流程：**
```typescript
// 1. 記錄活動（通知資訊為空）
await recordDeviceActivity(...);

// 2. 處理通知（有 pointId，但無法回填）
await handleNotification(...);
```

**變更後的流程：**
```typescript
// 1. 先處理通知，獲取結果
const notificationResult = await handleNotification(...);

// 2. 再記錄活動，包含完整通知資訊
await recordDeviceActivity(..., notificationResult);
```

---

## 📝 技術變更詳情

### 1. 新增 NotificationResult 介面

**文件:** `functions/src/beacon/receiveBeaconData.ts`

```typescript
interface NotificationResult {
  triggered: boolean;
  type: 'LINE' | 'FCM' | null;
  pointId?: string;  // notificationPointId for MAP_USER
  details?: any;
}
```

### 2. 修改 recordDeviceActivity 函數

**變更前：**
```typescript
async function recordDeviceActivity(
  deviceId: string,
  device: any,
  beacon: BeaconData,
  gateway: GatewayInfo,
  lat: number,
  lng: number,
  timestamp: number,
  db: admin.firestore.Firestore
): Promise<void> {
  const activityData = {
    // ...
    triggeredNotification: false,
    notificationType: null,
    notificationDetails: null,
  };
}
```

**變更後：**
```typescript
async function recordDeviceActivity(
  deviceId: string,
  device: any,
  beacon: BeaconData,
  gateway: GatewayInfo,
  lat: number,
  lng: number,
  timestamp: number,
  notificationResult: NotificationResult,  // 新增參數
  db: admin.firestore.Firestore
): Promise<void> {
  const activityData: any = {
    // ...
    triggeredNotification: notificationResult.triggered,
    notificationType: notificationResult.type,
    notificationDetails: notificationResult.details || null,
  };
  
  // 如果是 MAP_USER 且有觸發通知，加上 notificationPointId
  if (notificationResult.triggered && notificationResult.pointId) {
    activityData.notificationPointId = notificationResult.pointId;
  }
}
```

### 3. 修改 handleNotification 函數

**變更前：**
```typescript
async function handleNotification(...): Promise<void> {
  // ...
}
```

**變更後：**
```typescript
async function handleNotification(...): Promise<NotificationResult> {
  switch (bindingType) {
    case 'ELDER':
      return await handleElderNotification(...);
    case 'MAP_USER':
      return await handleMapUserNotification(...);
    case 'UNBOUND':
    default:
      return { triggered: false, type: null };
  }
}
```

### 4. 修改 handleMapUserNotification 函數

**變更前：**
```typescript
async function handleMapUserNotification(...): Promise<void> {
  // 發送通知
  await admin.messaging().send({...});
  console.log('Sent FCM notification');
}
```

**變更後：**
```typescript
async function handleMapUserNotification(...): Promise<NotificationResult> {
  // 1. 查詢通知點位
  const notifPoint = notifPointsSnapshot.docs[0];
  
  // 2. 發送通知
  await admin.messaging().send({...});
  
  // 3. 返回通知結果
  return {
    triggered: true,
    type: 'FCM',
    pointId: notifPoint.id,  // 關鍵資訊
    details: {
      mapAppUserId: mapAppUserId,
      notificationPointName: notifPointData.name,
      message: notificationMessage,
    }
  };
}
```

### 5. 修改 handleElderNotification 函數

**變更後：**
```typescript
async function handleElderNotification(...): Promise<NotificationResult> {
  // 發送 LINE 通知
  await sendLineNotificationToTenant(...);
  
  // 返回通知結果
  return {
    triggered: true,
    type: 'LINE',
    details: {
      elderId: elderId,
      tenantId: tenantId,
      gatewayType: gateway.type,
    }
  };
}
```

### 6. 調整 processBeacon 函數中的執行順序

**變更前：**
```typescript
// 3. Record activity to device subcollection
await recordDeviceActivity(deviceId, device, beacon, gateway, lat, lng, timestamp, db);

// 4. Handle notification
await handleNotification(deviceId, device, beacon, gateway, lat, lng, timestamp, db);
```

**變更後：**
```typescript
// 3. Handle notification (先處理通知)
const notificationResult = await handleNotification(deviceId, device, beacon, gateway, lat, lng, timestamp, db);

// 4. Record activity (再記錄活動，包含通知資訊)
await recordDeviceActivity(deviceId, device, beacon, gateway, lat, lng, timestamp, notificationResult, db);
```

---

## 📊 資料結構變化

### 活動記錄（devices/{deviceId}/activities）

**變更前：**
```json
{
  "timestamp": "2026-01-22T10:30:00Z",
  "gatewayId": "gateway_001",
  "gatewayName": "台北車站東門",
  "gatewayType": "GENERAL",
  "latitude": 25.047908,
  "longitude": 121.517315,
  "rssi": -65,
  "bindingType": "MAP_USER",
  "boundTo": "user_123",
  "triggeredNotification": false,
  "notificationType": null,
  "notificationDetails": null
}
```

**變更後：**
```json
{
  "timestamp": "2026-01-22T10:30:00Z",
  "gatewayId": "gateway_001",
  "gatewayName": "台北車站東門",
  "gatewayType": "GENERAL",
  "latitude": 25.047908,
  "longitude": 121.517315,
  "rssi": -65,
  "bindingType": "MAP_USER",
  "boundTo": "user_123",
  "triggeredNotification": true,
  "notificationType": "FCM",
  "notificationPointId": "point_xyz123",  // 新增
  "notificationDetails": {
    "mapAppUserId": "user_123",
    "notificationPointName": "我的家",
    "message": "已到達家門口"
  }
}
```

---

## 🎯 使用場景

### 1. 地圖 APP 顯示活動歷史

```javascript
// APP 可以顯示「在哪個點位觸發了通知」
activities.forEach(activity => {
  if (activity.triggeredNotification && activity.notificationPointId) {
    console.log(`在 ${activity.notificationDetails.notificationPointName} 觸發了通知`);
  }
});
```

### 2. 分析通知點位效果

```javascript
// 統計每個點位觸發通知的次數
const pointStats = {};
activities.forEach(activity => {
  if (activity.notificationPointId) {
    pointStats[activity.notificationPointId] = 
      (pointStats[activity.notificationPointId] || 0) + 1;
  }
});
```

---

## 🔄 部署步驟

### 1. 編譯函數

```bash
cd functions
npm run build
```

### 2. 部署到 Firebase

```bash
firebase deploy --only functions:receiveBeaconData,functions:getMapUserActivities
```

---

## 🧪 測試清單

### 功能測試

- [ ] MAP_USER 設備經過通知點位時，活動記錄中有 `notificationPointId`
- [ ] MAP_USER 設備經過非通知點位時，`notificationPointId` 為 null
- [ ] ELDER 設備經過邊界接收點時，`notificationType` 為 "LINE"
- [ ] UNBOUND 設備經過任何接收點時，`triggeredNotification` 為 false
- [ ] `getMapUserActivities` API 正確返回 `notificationPointId`

### 向後兼容性測試

- [ ] 舊的活動記錄（沒有 `notificationPointId`）仍可正常讀取
- [ ] 前端顯示活動歷史時不會因為缺少欄位而出錯

---

## ✅ 更新的檔案清單

### 後端函數

1. **`functions/src/beacon/receiveBeaconData.ts`**
   - 新增 `NotificationResult` 介面
   - 修改 `recordDeviceActivity` 函數簽名
   - 修改 `handleNotification` 函數返回類型
   - 修改 `handleMapUserNotification` 函數返回類型
   - 修改 `handleElderNotification` 函數返回類型
   - 調整 `processBeacon` 函數中的執行順序

2. **`functions/src/mapApp/activities.ts`**
   - 在返回的活動記錄中加上 `notificationPointId` 欄位

### 類型定義

3. **`src/types/index.ts`**
   - `DeviceActivity` 介面新增 `notificationPointId?: string` 欄位
   - `MapUserActivity` 介面新增 `notificationPointId?: string` 欄位

### 文檔

4. **`MAP_APP_API_ENDPOINTS.md`**
   - 更新 `getMapUserActivities` API 回應範例
   - 新增欄位說明
   - 標註更新日期

---

## 📚 相關文檔

- `MAP_APP_API_ENDPOINTS.md` - 完整 API 文檔
- `MAP_APP_DEVICE_BINDING_UPDATES.md` - 設備綁定更新說明
- `CLOUD_FUNCTIONS_UPDATE_SUMMARY.md` - Cloud Functions 更新摘要

---

## 🎉 效果總結

### 變更前
- ❌ 活動記錄中通知相關欄位總是空的
- ❌ 無法知道哪個點位觸發了通知
- ❌ 無法分析通知點位效果

### 變更後
- ✅ 活動記錄包含完整的通知資訊
- ✅ 可以追蹤每個點位觸發通知的歷史
- ✅ 支援通知點位效果分析
- ✅ 改善 APP 用戶體驗（可顯示通知點位名稱）

---

**文檔版本:** 1.0.0  
**最後更新:** 2026-01-22
