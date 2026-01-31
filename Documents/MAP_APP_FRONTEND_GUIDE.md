# 地圖 APP 前端整合指南

## 概述

本指南為地圖 APP 前端團隊提供後端 API 整合的快速參考。

**後端專案:** Firebase (safe-net-tw)  
**API 基礎 URL:** `https://us-central1-safe-net-tw.cloudfunctions.net`  
**認證方式:** Firebase Authentication (ID Token)

---

## APP 頁面結構

### 1. 首頁（地圖）
- 全屏 Google Maps
- 顯示所有接收點（包括社區的點）
- 點擊點位可設定通知
- 左上角綁定設備按鈕
- 顯示設備行蹤

### 2. 個人資料頁
- 用戶資訊圖卡（頭像、email、姓名）
- 已綁定裝置（可移除）
- 通知點設定列表（可移除）

---

## 關鍵功能與 API 對應

### 未登入狀態

| 功能 | API | 說明 |
|------|-----|------|
| 顯示地圖和接收點 | `GET /getPublicGateways` | 不需認證，可直接呼叫 |
| 點擊點位 | - | 顯示「需要登入」提示 |
| 點擊綁定按鈕 | - | 導向登入頁 |

### 登入後

| 頁面 | 功能 | API |
|------|------|-----|
| 首頁 | 綁定設備 | `POST /bindDeviceToMapUser` |
| 首頁 | 新增通知點 | `POST /addMapUserNotificationPoint` |
| 首頁 | 取消通知點 | `DELETE /removeMapUserNotificationPoint` |
| 首頁 | 顯示設備行蹤 | `GET /getMapUserActivities` |
| 個人資料 | 載入完整資料 | `GET /getMapUserProfile` |
| 個人資料 | 移除綁定設備 | `POST /unbindDeviceFromMapUser` |
| 個人資料 | 移除通知點 | `DELETE /removeMapUserNotificationPoint` |

---

## 核心 API 快速參考

### 1. 取得所有接收點（不需登入）

```typescript
const response = await fetch(
  'https://us-central1-safe-net-tw.cloudfunctions.net/getPublicGateways'
);
const { gateways } = await response.json();

// gateways 陣列包含所有接收點
gateways.forEach(gateway => {
  // gateway.id, gateway.name, gateway.latitude, gateway.longitude
  // 在地圖上標記
});
```

### 2. 綁定設備（需登入）

```typescript
const user = firebase.auth().currentUser;
const idToken = await user.getIdToken();

const response = await fetch(
  'https://us-central1-safe-net-tw.cloudfunctions.net/bindDeviceToMapUser',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      userId: user.uid,
      deviceId: deviceId,      // 必填：用戶輸入的設備 ID
      nickname: nickname,      // 選填：設備暱稱
      age: age                 // 選填：使用者年齡
    })
  }
);

const result = await response.json();
// result.device 包含綁定的設備資訊
```

### 3. 設定通知點（需登入）

```typescript
// 用戶點擊地圖上的接收點後
const response = await fetch(
  'https://us-central1-safe-net-tw.cloudfunctions.net/addMapUserNotificationPoint',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      userId: user.uid,
      gatewayId: gateway.id,
      name: '我的家',                    // 用戶自訂名稱
      notificationMessage: '已到達家門口'  // 自訂通知訊息（選填）
    })
  }
);
```

### 4. 載入個人資料頁（需登入）

```typescript
const user = firebase.auth().currentUser;
const idToken = await user.getIdToken();

const response = await fetch(
  `https://us-central1-safe-net-tw.cloudfunctions.net/getMapUserProfile?userId=${user.uid}`,
  {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  }
);

const data = await response.json();

// data.user - 用戶基本資訊
// data.boundDevice - 綁定的設備（含暱稱、年齡）
// data.notificationPoints - 通知點位列表
```

### 5. 顯示設備行蹤（需登入）

```typescript
const startTime = Date.now() - (24 * 60 * 60 * 1000); // 24小時前
const endTime = Date.now();

const response = await fetch(
  `https://us-central1-safe-net-tw.cloudfunctions.net/getMapUserActivities?` +
  `userId=${user.uid}&startTime=${startTime}&endTime=${endTime}&limit=100`,
  {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  }
);

const { activities } = await response.json();

// activities 陣列包含設備的活動記錄
activities.forEach(activity => {
  // activity.latitude, activity.longitude, activity.timestamp
  // 在地圖上顯示行蹤路徑
});
```

---

## 完整資料結構

### Gateway（接收點）
```typescript
{
  id: string,
  name: string,
  location?: string,
  latitude: number,
  longitude: number,
  type: "GENERAL" | "BOUNDARY" | "MOBILE",
  tenantId?: string,       // 社區專用的點會有此欄位
  poolType?: string        // "PUBLIC" 或 "TENANT"
}
```

### BoundDevice（綁定的設備）
```typescript
{
  id: string,
  deviceName: string,
  nickname?: string,       // 用戶設定的暱稱
  age?: number,           // 用戶設定的年齡
  uuid: string,
  major: number,
  minor: number,
  boundAt: string
}
```

### NotificationPoint（通知點位）
```typescript
{
  id: string,
  name: string,
  gatewayId: string,
  notificationMessage?: string,
  isActive: boolean,
  createdAt: string,
  gateway: {
    name: string,
    location: string,
    latitude: number,
    longitude: number
  }
}
```

### Activity（活動記錄）
```typescript
{
  id: string,
  deviceId: string,
  gatewayId: string,
  gatewayName: string,
  timestamp: string,
  latitude: number,
  longitude: number,
  rssi: number,
  triggeredNotification: boolean
}
```

---

## 推播通知

### FCM Token 更新

```typescript
// 在 APP 啟動時或取得新 Token 時呼叫
const fcmToken = await firebase.messaging().getToken();

await fetch(
  'https://us-central1-safe-net-tw.cloudfunctions.net/updateMapUserFcmToken',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      userId: user.uid,
      fcmToken: fcmToken
    })
  }
);
```

### 接收通知

當設備經過用戶設定的通知點位時，會自動收到推播：

```typescript
// FCM 訊息格式
{
  notification: {
    title: "位置通知",
    body: "已到達家門口"  // 或用戶自訂的訊息
  },
  data: {
    type: "LOCATION_ALERT",
    gatewayId: "gateway_001",
    gatewayName: "台北車站東門",
    notificationPointId: "point_xyz123",
    latitude: "25.047908",
    longitude: "121.517315"
  }
}
```

---

## 錯誤處理

所有 API 的錯誤回應格式：

```json
{
  "success": false,
  "error": "錯誤訊息"
}
```

常見 HTTP 狀態碼：
- `400` - 請求參數錯誤
- `401` - 未授權（Token 無效或缺少）
- `403` - 禁止存取（試圖存取其他用戶資料）
- `404` - 資源不存在
- `500` - 伺服器錯誤

---

## UI 流程建議

### 首頁載入流程

```typescript
async function loadHomePage() {
  // 1. 載入地圖和接收點（不需登入）
  const { gateways } = await fetchPublicGateways();
  renderMapWithGateways(gateways);
  
  // 2. 檢查登入狀態
  const user = firebase.auth().currentUser;
  if (!user) {
    // 未登入：顯示「登入後可設定通知」提示
    return;
  }
  
  // 3. 已登入：載入設備行蹤
  const { activities } = await fetchUserActivities(user.uid);
  renderDeviceTrack(activities);
}
```

### 點擊點位彈窗

```typescript
function onGatewayClick(gateway) {
  const user = firebase.auth().currentUser;
  
  if (!user) {
    // 未登入：顯示資訊 + 「登入以設定通知」按鈕
    showLoginPrompt();
    return;
  }
  
  // 已登入：顯示「新增通知」/「取消通知」選項
  showNotificationDialog(gateway);
}
```

### 綁定設備彈窗

```typescript
function onBindDeviceClick() {
  const user = firebase.auth().currentUser;
  
  if (!user) {
    navigateToLogin();
    return;
  }
  
  // 顯示輸入表單
  showBindDeviceDialog({
    fields: [
      { name: 'deviceId', label: '設備 ID', required: true },
      { name: 'nickname', label: '暱稱', placeholder: '例如：媽媽的手環' },
      { name: 'age', label: '年齡', type: 'number' }
    ],
    onSubmit: async (data) => {
      await bindDevice(data);
      // 重新載入設備行蹤
      await loadDeviceActivities();
    }
  });
}
```

### 個人資料頁

```typescript
async function loadProfilePage() {
  const user = firebase.auth().currentUser;
  const profile = await fetchUserProfile(user.uid);
  
  // 1. 顯示用戶資訊
  renderUserInfo(profile.user);
  
  // 2. 顯示綁定設備（如果有）
  if (profile.boundDevice) {
    renderBoundDevice(profile.boundDevice, {
      onRemove: async () => {
        await unbindDevice(user.uid);
        location.reload();
      }
    });
  } else {
    renderNoDeviceMessage();
  }
  
  // 3. 顯示通知點位列表
  renderNotificationPoints(profile.notificationPoints, {
    onRemove: async (pointId) => {
      await removeNotificationPoint(pointId);
      location.reload();
    }
  });
}
```

---

## 完整 API 列表

| API 名稱 | 端點 | 方法 | 認證 |
|---------|------|------|------|
| 取得接收點 | /getPublicGateways | GET | ✗ |
| 用戶認證 | /mapUserAuth | POST | ✓ |
| 更新 FCM Token | /updateMapUserFcmToken | POST | ✓ |
| 綁定設備 | /bindDeviceToMapUser | POST | ✓ |
| 解綁設備 | /unbindDeviceFromMapUser | POST | ✓ |
| 新增通知點 | /addMapUserNotificationPoint | POST | ✓ |
| 查詢通知點 | /getMapUserNotificationPoints | GET | ✓ |
| 更新通知點 | /updateMapUserNotificationPoint | PUT | ✓ |
| 移除通知點 | /removeMapUserNotificationPoint | DELETE | ✓ |
| 查詢活動記錄 | /getMapUserActivities | GET | ✓ |
| 查詢用戶資料 | /getMapUserProfile | GET | ✓ |

---

## 詳細文檔

完整的 API 說明請參考：
- **API 端點文檔**: [`MAP_APP_API_ENDPOINTS.md`](MAP_APP_API_ENDPOINTS.md)
- **部署指南**: [`MAP_APP_DEPLOYMENT_GUIDE.md`](MAP_APP_DEPLOYMENT_GUIDE.md)

---

**更新日期**: 2026-01-21  
**版本**: 1.1.0
