# LINE 通知時間修正

## 📋 問題描述

在之前的版本中，LINE 通知中顯示的時間使用的是 **Firebase Cloud Function 伺服器執行時的當前時間**，而不是 Beacon 被掃描的實際時間（上傳的 `timestamp`）。

這導致通知中的時間不準確，無法反映 Beacon 實際被偵測到的時間。

---

## 🔧 修正內容

### 修改前

```typescript
// sendLineNotification 函數
{
  type: 'text',
  text: new Date().toLocaleString('zh-TW'),  // ❌ 使用伺服器當前時間
  ...
}
```

**問題**：

- 使用 `new Date()` 取得伺服器時間
- 與實際掃描時間可能差距數秒甚至數分鐘
- 無法準確追蹤事件發生時間

---

### 修改後

```typescript
// sendLineNotification 函數簽名
async function sendLineNotification(
  beacon: BeaconData,
  gateway: GatewayInfo,
  lat: number,
  lng: number,
  timestamp: number,      // ✅ 新增 timestamp 參數
  db: admin.firestore.Firestore,
  isFirstActivity: boolean = false
): Promise<void>

// 通知內容
{
  type: 'text',
  text: new Date(timestamp).toLocaleString('zh-TW'),  // ✅ 使用上傳的 timestamp
  ...
}
```

**改進**：

- ✅ 使用上傳的 `timestamp` 參數
- ✅ 準確反映 Beacon 被掃描的實際時間
- ✅ 時間與上傳資料一致

---

## 📝 修改的檔案

### 1. `functions/src/beacon/receiveBeaconData.ts`

**修改點 1**：函數簽名（第 318-325 行）

```typescript
async function sendLineNotification(
  beacon: BeaconData,
  gateway: GatewayInfo,
  lat: number,
  lng: number,
  timestamp: number, // ← 新增參數
  db: admin.firestore.Firestore,
  isFirstActivity: boolean = false,
): Promise<void>;
```

**修改點 2**：時間顯示（第 564 行）

```typescript
text: new Date(timestamp).toLocaleString('zh-TW'),  // ← 使用 timestamp
```

**修改點 3-5**：所有呼叫點（第 846, 882, 930 行）

```typescript
// 第一次活動通知
await sendLineNotification(beacon, gateway, lat, lng, timestamp, db, true);

// 位置更新通知
await sendLineNotification(beacon, gateway, lat, lng, timestamp, db, false);

// 後續位置更新通知
await sendLineNotification(beacon, gateway, lat, lng, timestamp, db, false);
```

---

## 🎯 效果展示

### 修改前

```
上傳資料：
timestamp: 1737360000000  (2026-01-21 10:00:00)

通知內容：
時間: 2026-01-21 10:00:15  (伺服器處理時間，晚了 15 秒)
```

### 修改後

```
上傳資料：
timestamp: 1737360000000  (2026-01-21 10:00:00)

通知內容：
時間: 2026-01-21 10:00:00  (準確的掃描時間)
```

---

## 🚀 部署狀態

### ✅ 已完成

- [x] 修改 `sendLineNotification` 函數簽名
- [x] 修改時間顯示邏輯
- [x] 更新所有呼叫點
- [x] 編譯 TypeScript
- [x] 部署 `receiveBeaconData` Function
- [x] 提交到 Git

### 📡 API 端點

**receiveBeaconData:**  
`https://receivebeacondata-kmzfyt3t5a-uc.a.run.app`

---

## 📊 使用範例

### 上傳請求

```json
{
  "gateway_id": "AA:BB:CC:DD:EE:FF",
  "timestamp": 1737360000000, // ← 這個時間會顯示在通知中
  "lat": 25.033,
  "lng": 121.565,
  "beacons": [
    {
      "uuid": "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0",
      "major": 1,
      "minor": 1001,
      "rssi": -65,
      "batteryLevel": 85
    }
  ]
}
```

### LINE 通知內容

```
邊界警報

王小明 出現在邊界點

長輩：王小明
位置：社區大門
類型：邊界點
時間：2026/1/21 上午10:00:00  ← 正確顯示 timestamp
```

---

## 重要提示

### 1. **timestamp 格式**

- 必須是 Unix timestamp（毫秒）
- 例如：`1737360000000`
- JavaScript: `Date.now()` 或 `new Date().getTime()`

### 2. **時區處理**

- `toLocaleString('zh-TW')` 會自動處理時區
- 顯示為台灣時間（UTC+8）

### 3. **準確性**

- 通知時間現在完全取決於上傳的 `timestamp`
- 確保上傳時 timestamp 準確（通常使用掃描時的當前時間）

---

## 🐛 相關問題

### Q1: 為什麼之前使用伺服器時間？

之前的實作可能沒有考慮到時間準確性的重要性，直接使用了 `new Date()` 作為快速實作。

### Q2: 時間差距會有多大？

取決於網路延遲和 Function 執行時間，通常在 1-10 秒之間，在網路不穩定時可能更長。

### Q3: 會影響其他功能嗎？

不會。此修正只影響 LINE 通知中顯示的時間，不影響：

- 資料庫記錄（已經使用 timestamp）
- 位置更新邏輯
- 冷卻期計算

---

## 📞 技術細節

### 修改統計

- **修改檔案**: 1 個（receiveBeaconData.ts）
- **修改行數**: 5 處
- **新增參數**: 1 個（timestamp）
- **函數呼叫更新**: 3 處

### 向下相容性

- ✅ 完全向下相容
- ✅ 不影響其他 Function
- ✅ 不影響資料庫結構

---

**更新日期:** 2026-01-21  
**版本:** 1.2.1  
**專案:** safe-net-tw
