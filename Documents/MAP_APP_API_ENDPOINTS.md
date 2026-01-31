# 地圖 APP API 端點文檔

> **架構更新通知 (2026-01-21):**  
> 系統已完成裝置綁定架構重整，統一使用 `bindingType` + `boundTo` 管理所有裝置綁定。  
> 主要變更：移除 `poolType`/`elderId`/`mapAppUserId` 欄位，改用統一的綁定狀態。  
> 詳見本文檔末尾的「資料結構與隔離」章節。

## 📋 概述

本文檔列出所有地圖 APP 專用的 Cloud Functions API 端點。這些 API 使用統一的裝置綁定架構，與現有的 Tenant-Elder 系統共享裝置資源但邏輯獨立。

**Firebase 專案:** safe-net-tw  
**Region:** us-central1  
**基礎 URL:** `https://[function-name]-kmzfyt3t5a-uc.a.run.app` (2nd Gen Functions)

**地圖 APP 專用 API URL 列表:**

- mapUserAuth: `https://mapuserauth-kmzfyt3t5a-uc.a.run.app`
- updateMapUserFcmToken: `https://updatemapuserfcmtoken-kmzfyt3t5a-uc.a.run.app`
- bindDeviceToMapUser: `https://binddevicetomapuser-kmzfyt3t5a-uc.a.run.app`
- unbindDeviceFromMapUser: `https://unbinddevicefrommapuser-kmzfyt3t5a-uc.a.run.app`
- deleteMapAppUser: `https://us-central1-safe-net-tw.cloudfunctions.net/deleteMapAppUser`
- getPublicGateways: `https://getpublicgateways-kmzfyt3t5a-uc.a.run.app`
- addMapUserNotificationPoint: `https://addmapusernotificationpoint-kmzfyt3t5a-uc.a.run.app`
- getMapUserNotificationPoints: `https://getmapusernotificationpoints-kmzfyt3t5a-uc.a.run.app`
- updateMapUserNotificationPoint: `https://updatemapusernotificationpoint-kmzfyt3t5a-uc.a.run.app`
- removeMapUserNotificationPoint: `https://removemapusernotificationpoint-kmzfyt3t5a-uc.a.run.app`
- getMapUserActivities: `https://getmapuseractivities-kmzfyt3t5a-uc.a.run.app`
- getMapUserProfile: `https://getmapuserprofile-kmzfyt3t5a-uc.a.run.app`

**共用 API（與 Tenant-Elder 系統共用）:**

- receiveBeaconData: `https://receivebeacondata-kmzfyt3t5a-uc.a.run.app`
- getServiceUuids: `https://getserviceuuids-kmzfyt3t5a-uc.a.run.app`
- getDeviceWhitelist: `https://getdevicewhitelist-kmzfyt3t5a-uc.a.run.app`

---

## 🔐 認證方式

所有需要認證的 API 都使用 **Firebase ID Token**：

```
Authorization: Bearer {FIREBASE_ID_TOKEN}
```

在客戶端使用 Firebase Auth SDK 獲取 ID Token：

```javascript
const user = firebase.auth().currentUser;
const idToken = await user.getIdToken();
```

---

## 📡 API 端點列表

### 1. 用戶認證 API

#### `mapUserAuth` - 註冊/登入用戶

**端點:** `POST /mapUserAuth`  
**認證:** 必需 (Firebase ID Token)

**請求 Body:**

```json
{
  "action": "register" | "login",
  "email": "user@example.com",
  "name": "張三",
  "phone": "0912345678"
}
```

**回應範例 (註冊成功):**

```json
{
  "success": true,
  "user": {
    "id": "firebase_uid_123",
    "email": "user@example.com",
    "name": "張三",
    "phone": "0912345678",
    "isActive": true
  }
}
```

**回應範例 (登入成功):**

```json
{
  "success": true,
  "user": {
    "id": "firebase_uid_123",
    "email": "user@example.com",
    "name": "張三",
    "boundDeviceId": "device_abc123",
    "notificationEnabled": true,
    "isActive": true
  }
}
```

---

### 2. FCM Token 管理

#### `updateMapUserFcmToken` - 更新推播 Token

**端點:** `POST /updateMapUserFcmToken`  
**認證:** 必需

**請求 Body:**

```json
{
  "userId": "firebase_uid_123",
  "fcmToken": "fcm_token_xyz..."
}
```

**回應:**

```json
{
  "success": true,
  "message": "FCM token updated successfully"
}
```

---

### 3. 設備綁定管理

#### `bindDeviceToMapUser` - 綁定設備

**端點:** `POST /bindDeviceToMapUser`  
**認證:** 必需

**請求 Body (方式一：使用設備 ID):**

```json
{
  "userId": "firebase_uid_123",
  "deviceId": "device_abc123",
  "nickname": "媽媽的手環",
  "age": 65
}
```

**請求 Body (方式二：使用產品序號):**

```json
{
  "userId": "firebase_uid_123",
  "deviceName": "1-1001",
  "nickname": "媽媽的手環",
  "age": 65
}
```

**欄位說明:**

- `userId` (必需): 用戶 ID
- `deviceId` (選填): 設備 ID（與 `deviceName` 二選一）
- `deviceName` (選填): 產品序號（與 `deviceId` 二選一）
- `nickname` (選填): 設備暱稱（儲存在設備的 `mapUserNickname` 欄位）
- `age` (選填): 使用者年齡（儲存在設備的 `mapUserAge` 欄位）

**回應:**

```json
{
  "success": true,
  "device": {
    "id": "device_abc123",
    "uuid": "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0",
    "major": 1,
    "minor": 1001,
    "deviceName": "1-1001",
    "nickname": "媽媽的手環",
    "age": 65
  },
  "boundAt": "2026-01-21T10:30:00Z"
}
```

**注意事項:**

- 可使用 `deviceId` 或 `deviceName`（產品序號）綁定，兩者擇一即可
- 設備必須為未綁定狀態（`bindingType: "UNBOUND"`）或已綁定給該用戶
- 設備不可已綁定給老人系統（`bindingType: "ELDER"`）
- 每個用戶只能綁定一個設備
- 綁定新設備會自動解綁舊設備
- 暱稱和年齡存在設備資料中（`mapUserNickname`, `mapUserAge`），與設備綁定
- 解綁設備時會同時清空設備上的暱稱和年齡

---

#### `unbindDeviceFromMapUser` - 解綁設備

**端點:** `POST /unbindDeviceFromMapUser`  
**認證:** 必需

**請求 Body:**

```json
{
  "userId": "firebase_uid_123"
}
```

**回應:**

```json
{
  "success": true,
  "message": "Device unbound successfully"
}
```

**解綁時會清空的資料:**

1. ✅ **裝置綁定資料**
   - `bindingType` → `"UNBOUND"`
   - `boundTo` → `null`
   - `boundAt` → `null`
   - `mapUserNickname` → `null`
   - `mapUserAge` → `null`

2. ✅ **用戶綁定資料**
   - `boundDeviceId` → `null`

3. ✅ **裝置足跡紀錄**（2026-01-22 新增）
   - 清空 `devices/{deviceId}/activities` 子集合
   - 所有歷史定位紀錄都會被永久刪除
   - 解綁後裝置狀態完全恢復成新登記時的狀態

**注意事項:**

- 用戶只能解綁自己的設備
- 管理員（SUPER_ADMIN / TENANT_ADMIN）可以解綁任何用戶的設備
- ⚠️ **足跡紀錄刪除後無法復原**，請確認後再執行解綁操作

---

#### `deleteMapAppUser` - 刪除用戶（完整刪除）

**端點:** `POST /deleteMapAppUser`  
**認證:** 必需

**說明:** 此 API 執行完整的用戶刪除流程，包含：0. **發送 FCM 推送通知**（類型為 `ACCOUNT_DELETED`），通知用戶帳號即將被刪除

1. 檢查並解綁設備（如果有綁定）
2. 將設備活動記錄匿名化並歸檔到 `anonymousActivities` collection
3. 刪除用戶的所有通知點位
4. 刪除 Firestore 中的用戶文檔 (`mapAppUsers`)
5. 刪除 Firebase Auth 中的用戶帳號

**請求 Body:**

```json
{
  "userId": "firebase_uid_123"
}
```

**回應:**

```json
{
  "success": true,
  "message": "Map app user deleted successfully",
  "details": {
    "fcmNotificationSent": true,
    "firestoreDeleted": true,
    "authDeleted": true,
    "deviceUnbound": true,
    "notificationPointsDeleted": 2
  }
}
```

**FCM 推送通知內容:**

刪除用戶前會發送以下 FCM 通知（如果用戶有 FCM token）：

```json
{
  "notification": {
    "title": "帳號已被刪除",
    "body": "您的帳號已被管理員刪除，請重新登入或聯繫客服。"
  },
  "data": {
    "type": "ACCOUNT_DELETED",
    "userId": "firebase_uid_123",
    "timestamp": "2026-01-24T10:30:00.000Z"
  }
}
```

**App 端處理建議:**

App 端收到 `type: "ACCOUNT_DELETED"` 的通知後應該：

1. 清除本地數據
2. 登出 Firebase Auth
3. 顯示通知或對話框
4. 導航到登入頁面

詳細的 App 端實作範例請參考 [ACCOUNT_DELETION_FCM_NOTIFICATION.md](./ACCOUNT_DELETION_FCM_NOTIFICATION.md)

**權限說明:**

- 用戶本人可以刪除自己的帳號
- 管理員（SUPER_ADMIN、TENANT_ADMIN）可以刪除任何用戶

**注意事項:**

- ⚠️ **此操作無法復原**
- **FCM 通知會在刪除流程最開始就發送**，確保用戶能收到通知
- 如果用戶沒有 FCM token，通知會被跳過但刪除流程仍會繼續
- FCM 通知發送失敗不會影響刪除流程
- 所有設備活動記錄會被匿名化並保留用於統計分析
- 匿名化的記錄會標記相同的 `archiveSessionId`，方便追蹤同一次解綁產生的記錄
- 如果用戶已綁定設備，會先自動解綁設備
- Firebase Auth 中的用戶帳號也會被刪除

---

### 4. 公共接收點查詢

#### `getPublicGateways` - 取得所有接收點列表

**端點:** `GET /getPublicGateways`  
**認證:** 不需要 (公開資料)

**說明:** 回傳所有啟用的接收點（包括社區專用和公共接收點）。對Line 用戶管理來說，所有的接收點都是安全網的一部分。

**回應:**

```json
{
  "success": true,
  "gateways": [
    {
      "id": "gateway_001",
      "name": "台北車站東門",
      "location": "台北車站",
      "latitude": 25.047908,
      "longitude": 121.517315,
      "type": "GENERAL",
      "serialNumber": "SN12345",
      "tenantId": null
    },
    {
      "id": "gateway_002",
      "name": "信義區邊界",
      "location": "信義區",
      "latitude": 25.033964,
      "longitude": 121.564468,
      "type": "BOUNDARY",
      "serialNumber": "SN67890",
      "tenantId": "tenant_abc"
    }
  ],
  "count": 2,
  "timestamp": 1737446400000
}
```

**欄位說明:**

- `tenantId`: 若為社區專用接收點，會顯示所屬社區 ID；公共接收點為 `null`
- `type`: 接收點類型（`"GENERAL"` 一般、`"BOUNDARY"` 邊界、`"MOBILE"` 移動）

---

### 5. 通知點位管理

#### `addMapUserNotificationPoint` - 新增通知點位

**端點:** `POST /addMapUserNotificationPoint`  
**認證:** 必需

**說明:** 用戶可以選擇任何接收點（不限公共或社區專用）作為通知點位。當用戶的設備經過該接收點時，會發送 FCM 推播通知。

**請求 Body:**

```json
{
  "userId": "firebase_uid_123",
  "gatewayId": "gateway_001",
  "name": "我的家",
  "notificationMessage": "已到達家門口"
}
```

**回應:**

```json
{
  "success": true,
  "notificationPoint": {
    "id": "point_xyz123",
    "mapAppUserId": "firebase_uid_123",
    "gatewayId": "gateway_001",
    "name": "我的家",
    "notificationMessage": "已到達家門口",
    "isActive": true,
    "createdAt": "2026-01-21T10:30:00Z"
  }
}
```

---

#### `getMapUserNotificationPoints` - 取得通知點位列表

**端點:** `GET /getMapUserNotificationPoints?userId={userId}`  
**認證:** 必需

**回應:**

```json
{
  "success": true,
  "notificationPoints": [
    {
      "id": "point_xyz123",
      "name": "我的家",
      "gatewayId": "gateway_001",
      "notificationMessage": "已到達家門口",
      "isActive": true,
      "createdAt": "2026-01-21T10:30:00Z",
      "gateway": {
        "id": "gateway_001",
        "name": "台北車站東門",
        "location": "台北車站",
        "latitude": 25.047908,
        "longitude": 121.517315
      }
    }
  ],
  "count": 1
}
```

---

#### `updateMapUserNotificationPoint` - 更新通知點位

**端點:** `PUT /updateMapUserNotificationPoint`  
**認證:** 必需

**請求 Body:**

```json
{
  "pointId": "point_xyz123",
  "name": "我的公司",
  "notificationMessage": "已到達公司",
  "isActive": true
}
```

**回應:**

```json
{
  "success": true,
  "message": "Notification point updated successfully"
}
```

---

#### `removeMapUserNotificationPoint` - 刪除通知點位

**端點:** `DELETE /removeMapUserNotificationPoint` 或 `POST /removeMapUserNotificationPoint`  
**認證:** 必需

**請求 Body:**

```json
{
  "pointId": "point_xyz123"
}
```

**回應:**

```json
{
  "success": true,
  "message": "Notification point removed successfully"
}
```

---

### 6. 活動歷史查詢

#### `getMapUserActivities` - 取得設備活動記錄

**端點:** `GET /getMapUserActivities`  
**認證:** 必需

**架構說明:**

- 活動記錄統一儲存在 `devices/{deviceId}/activities` 子集合
- API 會自動查詢該用戶綁定設備的活動記錄
- 記錄包含當時的綁定狀態（`bindingType`, `boundTo`）和通知類型

**Query 參數:**

- `userId` (必需): 用戶 ID
- `startTime` (選填): 開始時間 (timestamp in milliseconds)
- `endTime` (選填): 結束時間 (timestamp in milliseconds)
- `limit` (選填): 最多回傳筆數 (預設 100, 最大 1000)

**範例:**

```
GET /getMapUserActivities?userId=firebase_uid_123&startTime=1737360000000&endTime=1737446400000&limit=50
```

**回應:**

```json
{
  "success": true,
  "activities": [
    {
      "id": "activity_001",
      "deviceId": "device_abc123",
      "gatewayId": "gateway_001",
      "gatewayName": "台北車站東門",
      "gatewayType": "GENERAL",
      "timestamp": "2026-01-21T10:30:00Z",
      "rssi": -65,
      "latitude": 25.047908,
      "longitude": 121.517315,
      "bindingType": "MAP_USER",
      "boundTo": "firebase_uid_123",
      "triggeredNotification": true,
      "notificationType": "FCM",
      "notificationPointId": "point_xyz123",
      "notificationDetails": {
        "mapAppUserId": "firebase_uid_123",
        "notificationPointName": "我的家",
        "message": "已到達家門口"
      }
    },
    {
      "id": "activity_002",
      "deviceId": "device_abc123",
      "gatewayId": "gateway_002",
      "gatewayName": "信義區邊界",
      "gatewayType": "BOUNDARY",
      "timestamp": "2026-01-21T11:15:00Z",
      "rssi": -72,
      "latitude": 25.033964,
      "longitude": 121.564468,
      "bindingType": "MAP_USER",
      "boundTo": "firebase_uid_123",
      "triggeredNotification": false,
      "notificationType": null,
      "notificationPointId": null
    }
  ],
  "count": 2,
  "timestamp": 1737446400000
}
```

**活動記錄欄位說明:**

- `bindingType`: 記錄當時的綁定類型（"ELDER", "MAP_USER", "UNBOUND"）
- `boundTo`: 記錄當時綁定的對象 ID
- `triggeredNotification`: 是否觸發通知
- `notificationType`: 通知類型（"LINE", "FCM", null）
- `notificationPointId`: 觸發通知的點位 ID（僅 MAP_USER 且觸發通知時有值）**2026-01-22 新增**
- `notificationDetails`: 通知詳細資訊

**重要更新（2026-01-22）:**

- 新增 `notificationPointId` 欄位，記錄觸發通知的點位 ID
- 活動記錄現在會同時記錄通知是否觸發以及觸發的點位
- 這讓 APP 可以在活動歷史中顯示「在哪個點位觸發了通知」

---

### 7. 用戶資料查詢

#### `getMapUserProfile` - 取得用戶完整資料

**端點:** `GET /getMapUserProfile?userId={userId}`  
**認證:** 必需

**用途:** 取得用戶完整資料，包含基本資訊、綁定設備、通知點位列表（用於個人資料頁）

**Query 參數:**

- `userId` (必需): 用戶 ID

**範例:**

```
GET /getMapUserProfile?userId=firebase_uid_123
```

**回應:**

```json
{
  "success": true,
  "user": {
    "id": "firebase_uid_123",
    "email": "user@example.com",
    "name": "張三",
    "phone": "0912345678",
    "avatar": "https://...",
    "notificationEnabled": true
  },
  "boundDevice": {
    "id": "device_abc123",
    "deviceName": "1-1001",
    "nickname": "媽媽的手環",
    "age": 65,
    "uuid": "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0",
    "major": 1,
    "minor": 1001,
    "boundAt": "2026-01-21T10:30:00Z"
  },
  "notificationPoints": [
    {
      "id": "point_xyz123",
      "name": "我的家",
      "gatewayId": "gateway_001",
      "notificationMessage": "已到達家門口",
      "isActive": true,
      "createdAt": "2026-01-21T09:00:00Z",
      "gateway": {
        "name": "台北車站東門",
        "location": "台北車站",
        "latitude": 25.047908,
        "longitude": 121.517315
      }
    }
  ],
  "timestamp": 1737446400000
}
```

**回應欄位說明:**

- `user`: 用戶基本資訊
- `boundDevice`: 綁定的設備資訊（從 Device collection 取得，包含 `mapUserNickname` 和 `mapUserAge`）
- `boundDevice`: 綁定的設備詳情（如果有綁定），包含暱稱和年齡
- `notificationPoints`: 通知點位列表，每個點位包含對應的 Gateway 資訊

**注意事項:**

- 如果用戶沒有綁定設備，`boundDevice` 為 `null`
- 只回傳 `isActive: true` 的通知點位
- 用戶只能查詢自己的資料

---

## 🔄 完整使用流程

### 1. 用戶註冊/登入

```javascript
// 使用 Firebase Auth 登入
const userCredential = await firebase
  .auth()
  .signInWithEmailAndPassword(email, password);
const idToken = await userCredential.user.getIdToken();

// 註冊到地圖 APP 系統
const response = await fetch("https://mapuserauth-kmzfyt3t5a-uc.a.run.app", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  },
  body: JSON.stringify({
    action: "register",
    name: "張三",
    email: "user@example.com",
  }),
});
```

### 2. 更新 FCM Token

```javascript
// 獲取 FCM Token
const fcmToken = await firebase.messaging().getToken();

// 更新到後端
await fetch("https://updatemapuserfcmtoken-kmzfyt3t5a-uc.a.run.app", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  },
  body: JSON.stringify({
    userId: firebase.auth().currentUser.uid,
    fcmToken: fcmToken,
  }),
});
```

### 3. 綁定設備

```javascript
// 方式一：使用設備 ID 綁定
await fetch("https://binddevicetomapuser-kmzfyt3t5a-uc.a.run.app", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  },
  body: JSON.stringify({
    userId: firebase.auth().currentUser.uid,
    deviceId: "device_abc123",
    nickname: "媽媽的手環", // 選填：設備暱稱
    age: 65, // 選填：使用者年齡
  }),
});

// 方式二：使用產品序號綁定（推薦給終端用戶）
await fetch("https://binddevicetomapuser-kmzfyt3t5a-uc.a.run.app", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  },
  body: JSON.stringify({
    userId: firebase.auth().currentUser.uid,
    deviceName: "1-1001", // 產品序號（印在設備上的編號）
    nickname: "媽媽的手環", // 選填：設備暱稱
    age: 65, // 選填：使用者年齡
  }),
});
```

### 4. 取得公共接收點並選擇通知點位

```javascript
// 取得所有接收點（包括社區的點，形成完整的安全網）
const gateways = await fetch(
  "https://getpublicgateways-kmzfyt3t5a-uc.a.run.app",
).then((res) => res.json());

// 用戶選擇後新增通知點位
await fetch("https://addmapusernotificationpoint-kmzfyt3t5a-uc.a.run.app", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  },
  body: JSON.stringify({
    userId: firebase.auth().currentUser.uid,
    gatewayId: "gateway_001",
    name: "我的家",
    notificationMessage: "已到達家門口",
  }),
});
```

### 5. 查看活動記錄

```javascript
// 取得最近 24 小時的活動
const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
const activities = await fetch(
  `https://getmapuseractivities-kmzfyt3t5a-uc.a.run.app?userId=${userId}&startTime=${oneDayAgo}&limit=100`,
  {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  },
).then((res) => res.json());
```

### 6. 載入用戶資料頁

```javascript
// 取得用戶完整資料（用於個人資料頁）
const userId = firebase.auth().currentUser.uid;
const profile = await fetch(
  `https://getmapuserprofile-kmzfyt3t5a-uc.a.run.app?userId=${userId}`,
  {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  },
).then((res) => res.json());

// profile.user - 用戶基本資訊
// profile.boundDevice - 綁定的設備（含暱稱、年齡）
// profile.notificationPoints - 通知點位列表
```

---

## 🔔 推播通知格式

當用戶的設備經過設定的通知點位時，會收到 FCM 推播：

```json
{
  "notification": {
    "title": "位置通知",
    "body": "已到達家門口"
  },
  "data": {
    "type": "LOCATION_ALERT",
    "gatewayId": "gateway_001",
    "gatewayName": "台北車站東門",
    "notificationPointId": "point_xyz123",
    "latitude": "25.047908",
    "longitude": "121.517315"
  }
}
```

---

## ⚠️ 錯誤碼說明

| HTTP 狀態碼 | 說明                              |
| ----------- | --------------------------------- |
| 200         | 成功                              |
| 400         | 請求參數錯誤                      |
| 401         | 未授權 (Token 無效或缺少)         |
| 403         | 禁止存取 (試圖存取其他用戶的資源) |
| 404         | 資源不存在                        |
| 405         | HTTP 方法不允許                   |
| 500         | 伺服器內部錯誤                    |

**錯誤回應格式:**

```json
{
  "success": false,
  "error": "錯誤訊息描述"
}
```

**常見錯誤訊息 (bindDeviceToMapUser):**

- `"Device with deviceName 'xxx' not found"` - 找不到該產品序號的設備
- `"Device is already bound to an elder in the tenant system"` - 設備已綁定給老人系統（bindingType: "ELDER"）
- `"Device is already bound to another map app user"` - 設備已被其他地圖用戶綁定（bindingType: "MAP_USER"）

---

## 📊 API 摘要表

### 地圖 APP 專用 API

| 功能             | API 名稱                       | HTTP 方法   | 認證   |
| ---------------- | ------------------------------ | ----------- | ------ |
| 註冊/登入        | mapUserAuth                    | POST        | 必需   |
| 更新 FCM Token   | updateMapUserFcmToken          | POST        | 必需   |
| 綁定設備         | bindDeviceToMapUser            | POST        | 必需   |
| 解綁設備         | unbindDeviceFromMapUser        | POST        | 必需   |
| 取得公共接收點   | getPublicGateways              | GET         | 不需要 |
| 新增通知點位     | addMapUserNotificationPoint    | POST        | 必需   |
| 取得通知點位     | getMapUserNotificationPoints   | GET         | 必需   |
| 更新通知點位     | updateMapUserNotificationPoint | PUT         | 必需   |
| 刪除通知點位     | removeMapUserNotificationPoint | DELETE/POST | 必需   |
| 取得活動記錄     | getMapUserActivities           | GET         | 必需   |
| 取得用戶完整資料 | getMapUserProfile              | GET         | 必需   |

### 共用 API（與 Tenant-Elder 系統共用）

| 功能               | API 名稱           | HTTP 方法 | 認證   | 說明                   |
| ------------------ | ------------------ | --------- | ------ | ---------------------- |
| 接收 Beacon 資料   | receiveBeaconData  | POST      | 不需要 | 閘道上傳 beacon 資料   |
| 取得服務 UUID 列表 | getServiceUuids    | GET       | 不需要 | 取得可用的 Beacon UUID |
| 取得設備白名單     | getDeviceWhitelist | GET       | 不需要 | 取得允許的設備列表     |

---

## 🎯 與現有系統的關係

### 不受影響的現有 API

- 所有 Tenant 相關 API
- 所有 Elder 相關 API
- 所有 Alert 相關 API
- 所有 LINE 相關 API
- 後台管理 API

### 共用的 API

- `receiveBeaconData`: 統一處理所有裝置的 beacon 資料
  - 根據裝置的 `bindingType` 自動決定通知方式：
    - `bindingType: "ELDER"` → 發送 LINE 通知給社區成員
    - `bindingType: "MAP_USER"` → 發送 FCM 推播給 APP 用戶
    - `bindingType: "UNBOUND"` → 只記錄活動，不發送通知
  - 所有活動統一記錄在 `devices/{deviceId}/activities` 子集合
  - 現已支援電量更新（batteryLevel 欄位）
- `getServiceUuids`: 地圖用戶的接收器也需要此 API
- `getDeviceWhitelist`: 可選擇性使用

### 資料結構與隔離

#### Collections

- `mapAppUsers`: Line 用戶管理資料
  - 只保留 `boundDeviceId` 作為雙向引用
  - 不再儲存 `deviceNickname`, `deviceOwnerAge`, `boundAt`
- `mapUserNotificationPoints`: 用戶自訂通知點位
- `devices/{deviceId}/activities`: 統一的裝置活動記錄（子集合）
  - 取代舊的 `latest_locations` 和 `mapUserActivities`
  - 記錄所有裝置活動，不受綁定轉移影響

#### 裝置綁定機制（Device Collection）

```json
{
  "id": "device_001",
  "bindingType": "ELDER" | "MAP_USER" | "UNBOUND",
  "boundTo": "elder_id or user_id",
  "boundAt": "2026-01-21T10:00:00Z",
  "mapUserNickname": "媽媽的手環",
  "mapUserAge": 65,
  "tags": ["tenant_dalove_001"],
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "major": 1,
  "minor": 1001,
  "deviceName": "1-1001",
  "type": "IBEACON",
  "batteryLevel": 85,
  "lastSeen": "2026-01-21T10:00:00Z",
  "isActive": true
}
```

**綁定類型說明:**

- `"ELDER"`: 綁定給長者，`boundTo` 為 elderId，LINE 通知透過 Elder.tenantId 找到社區
- `"MAP_USER"`: 綁定給 APP 用戶，`boundTo` 為 mapAppUserId，直接 FCM 推播
- `"UNBOUND"`: 未綁定，只記錄活動不發送通知

**社區標籤:**

- `tags` 陣列儲存社區 ID 或其他分類標籤
- 取代舊的 `tenantId` 欄位（社區不再是資源分配，而是標籤）

#### 活動記錄結構（devices/{deviceId}/activities）

```json
{
  "timestamp": "2026-01-21T10:00:00Z",
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
  "notificationDetails": {...}
}
```

---

**更新日期:** 2026-01-21  
**版本:** 2.0.0  
**專案:** safe-net-tw  
**架構版本:** 統一綁定架構（bindingType + boundTo）
