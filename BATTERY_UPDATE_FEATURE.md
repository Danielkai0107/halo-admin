# 設備電量自動更新功能

## 📋 功能概述

此次更新為 `receiveBeaconData` API 新增了**設備電量自動更新**功能，當接收器（手機或 Gateway）掃描到 Beacon 時，可以自動更新設備的電量、最後見到時間和信號強度。

**更新日期:** 2026-01-21  
**版本:** 1.1.0

---

## 🆕 新增功能

### 1. 電量資料接收

`receiveBeaconData` API 現在可以接收 Beacon 的電量資訊：

```json
{
  "gateway_id": "IMEI_123456",
  "lat": 25.033,
  "lng": 121.565,
  "timestamp": 1737360000000,
  "beacons": [
    {
      "uuid": "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0",
      "major": 1,
      "minor": 1001,
      "rssi": -65,
      "batteryLevel": 85  // ✨ 新增：電量百分比（選填）
    }
  ]
}
```

### 2. 自動更新設備資訊

當 API 接收到 Beacon 資料時，會自動更新 `devices` collection 中的以下欄位：

- **`batteryLevel`**: 電量百分比（如果提供）
- **`lastSeen`**: 最後見到時間（ISO 8601 格式）
- **`lastRssi`**: 最後信號強度
- **`updatedAt`**: 更新時間戳記

### 3. 資料驗證

- `batteryLevel` 為**選填欄位**
- 若提供，必須為 **0-100** 之間的數字
- 不影響現有功能，向下相容

---

## 🔧 技術細節

### 修改的檔案

1. **`functions/src/beacon/receiveBeaconData.ts`**
   - 新增 `batteryLevel?: number` 到 `BeaconData` 介面
   - 在 `validatePayload` 函數中加入電量驗證邏輯
   - 在 `processBeacon` 函數中加入設備資訊更新邏輯

2. **`API_ENDPOINTS.md`**
   - 更新 `receiveBeaconData` API 文檔，說明 `batteryLevel` 欄位

3. **`MAP_APP_API_ENDPOINTS.md`**
   - 更新共用 API 說明

### 程式碼變更摘要

```typescript
// 介面定義
interface BeaconData {
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  batteryLevel?: number;  // 新增
}

// 設備更新邏輯
const deviceUpdateData: any = {
  lastSeen: new Date(timestamp).toISOString(),
  lastRssi: beacon.rssi,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

if (beacon.batteryLevel !== undefined && beacon.batteryLevel !== null) {
  deviceUpdateData.batteryLevel = beacon.batteryLevel;
}

await deviceDoc.ref.update(deviceUpdateData);
```

---

## 📱 使用方式

### 1. Android 接收器端

在掃描到 Beacon 時，如果能取得電量資訊，可以在上傳資料時包含：

```kotlin
val beaconData = JSONObject().apply {
    put("uuid", beacon.id1.toString())
    put("major", beacon.id2.toInt())
    put("minor", beacon.id3.toInt())
    put("rssi", beacon.rssi)
    put("batteryLevel", beacon.batteryLevel)  // 如果 Beacon 提供電量資訊
}
```

### 2. 在管理後台查看

進入「設備管理」頁面，可以看到：
- 電量百分比顯示
- 電量圖示根據電量等級顯示不同顏色：
  - 🟢 綠色：60% 以上
  - 🟡 黃色：20-60%
  - 🔴 紅色：20% 以下

### 3. 低電量警報（未來功能）

後續可以基於電量資訊實作：
- 低電量警報（當電量低於 20% 時發送通知）
- 電量趨勢圖表
- 電量統計報表

---

## 🚀 部署狀態

### ✅ 已完成

- [x] Firebase Functions 部署成功
- [x] Admin 管理後台部署成功
- [x] LIFF 應用部署成功
- [x] API 文檔更新完成
- [x] 程式碼已 merge 到 main 分支

### 📡 API 端點

**receiveBeaconData:**  
`https://receivebeacondata-kmzfyt3t5a-uc.a.run.app`

**Admin 管理後台:**  
`https://safe-net-tw.web.app`

**LIFF 應用:**  
`https://safe-net-tw.web.app/liff`

---

## 📊 資料結構

### Device Collection

```typescript
{
  id: string;
  uuid: string;
  major: number;
  minor: number;
  deviceName?: string;
  type: DeviceType;
  
  // 電量和狀態資訊
  batteryLevel?: number;      // 0-100，新增支援
  lastSeen?: string;          // ISO 8601 格式
  lastRssi?: number;          // 信號強度
  
  // 綁定資訊
  tenantId: string | null;
  elderId: string | null;
  mapAppUserId?: string;
  poolType?: PoolType;
  
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 🎯 向下相容性

- **不影響現有功能**：`batteryLevel` 為選填欄位
- **無需強制更新**：舊版接收器不提供電量資訊仍可正常運作
- **資料驗證**：提供的電量值會被驗證，確保資料品質

---

## 📝 後續計劃

### 短期（1-2 週）

- [ ] 實作低電量警報功能（`type: "LOW_BATTERY"`）
- [ ] 在設備列表頁面加入電量排序
- [ ] 加入電量過濾功能（顯示低電量設備）

### 中期（1 個月）

- [ ] 電量歷史趨勢圖表
- [ ] 電量統計報表（平均電量、低電量設備數量）
- [ ] 電量預測（根據歷史資料預測電池壽命）

### 長期（3 個月）

- [ ] 自動更換提醒（當設備需要更換電池時通知）
- [ ] 電池效能分析
- [ ] 批次電池更換排程

---

## 🐛 已知問題

目前無已知問題。

---

## 💡 技術注意事項

1. **Beacon 電量廣播**：
   - 並非所有 Beacon 都支援電量廣播
   - 需要確認硬體是否支援此功能
   - iBeacon 標準協議不包含電量欄位，需要使用廠商專屬協議

2. **資料更新頻率**：
   - 電量資訊會隨著每次 Beacon 掃描更新
   - 建議接收器端實作本地快取，避免頻繁更新

3. **電量精確度**：
   - 電量值取決於 Beacon 硬體的測量精度
   - 建議定期校準

---

## 📞 聯絡資訊

如有問題或建議，請聯繫開發團隊。

**專案:** safe-net-tw  
**更新日期:** 2026-01-21  
**版本:** 1.1.0
