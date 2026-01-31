# Minew MG6 Gateway 設定指南

本文件說明如何設定 Minew MG6 gateway 連接到系統。

## 架構說明

```
┌─────────────────┐     JSON-LONG      ┌─────────────────┐     Firestore     ┌─────────────────┐
│   Minew MG6     │ ────────────────> │  minewGateway   │ ───────────────> │   devices/      │
│   Gateway       │    (rawData)       │  Cloud Function │                   │   activities    │
└─────────────────┘                    └─────────────────┘                   └─────────────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │   gateways      │
                                     │  (查詢 GPS 座標) │
                                     └─────────────────┘
```

## 步驟一：在後台註冊 Gateway

1. 登入管理後台
2. 進入「Gateways」頁面
3. 點擊「新增 Gateway」
4. 填寫以下資料：
   - **名稱**: 例如 "二十張路"
   - **MAC 地址**: Gateway 的 MAC 地址（無冒號格式）
     - 例如：`553359763575`
     - 重要：**不要加冒號**，直接輸入連續的字元
   - **緯度/經度**: Gateway 安裝位置的 GPS 座標
   - **類型**: 選擇 GENERAL、BOUNDARY 或 MOBILE
5. 儲存

## 步驟二：設定 Minew MG6 Gateway

使用 Minew 的設定工具（App 或 Web 介面）設定以下參數：

### HTTP 上傳設定

| 設定項目 | 值 |
|---------|-----|
| **Service Access** | HTTP |
| **Upload Interval** | 1 秒（建議）|
| **URL** | `https://minewgateway-XXXXX.a.run.app?gateway_mac=你的MAC` |
| **Authentication Type** | none |
| **Data Format** | JSON-LONG 或 MINEW-CONNECT |

### URL 格式說明

```
https://minewgateway-kmzfyt3t5a-uc.a.run.app?gateway_mac=553359763575
```

- `gateway_mac` 參數必須填寫 Gateway 的 MAC 地址（無冒號）
- 這個 MAC 地址必須與後台註冊的一致

### 其他可選的 Header 設定

如果 Gateway 支援自訂 Header，也可以用以下方式傳遞 MAC：

```
Header: x-gateway-mac: 553359763575
```

或

```
Header: gateway-mac: 553359763575
```

## 步驟三：驗證連線

1. 設定完成後，Gateway 會開始上傳資料
2. 查看 Firebase Console 的 Functions 日誌
3. 正常運作時會看到類似訊息：

```
Received data from gateway: 553359763575
Gateway found: 二十張路 (GENERAL) - lat: 24.9806676, lng: 121.5373093
Processing 5 beacon items
Processing complete: 3 processed, 2 skipped (150ms)
```

## iBeacon 設備設定

確保你的 iBeacon 設備已正確設定：

| 參數 | 說明 |
|-----|------|
| **UUID** | 統一的服務識別碼，例如 `E2C56DB5-DFFB-48D2-B060-D0F5A71096E0` |
| **Major** | 群組編號（0-65535）|
| **Minor** | 設備編號（0-65535）|

並在後台「Devices」頁面註冊對應的設備。

## 資料流程

1. **Gateway 掃描** → 偵測到 iBeacon 廣播訊號
2. **上傳資料** → JSON-LONG 格式（包含 rawData）
3. **minewGateway 接收** → 解析 rawData，提取 UUID/Major/Minor
4. **查詢 Gateway** → 用 MAC 地址找到 GPS 座標
5. **UUID 白名單過濾** → 只處理 `beacon_uuids` 中的 UUID
6. **查詢 Device** → 用 UUID+Major+Minor 找到設備
7. **更新狀態** → 更新 lastSeen、lastRssi
8. **記錄活動** → 寫入 devices/{id}/activities

## UUID 白名單設定

系統會自動過濾掉不在白名單中的 beacon，只有在 `beacon_uuids` collection 中且 `isActive: true` 的 UUID 才會被處理。

### 在後台設定 UUID 白名單

1. 登入管理後台
2. 進入「UUID 管理」頁面
3. 新增允許的 UUID，例如：
   - `E2C56DB5-DFFB-48D2-B060-D0F5A71096E0`
4. 確保 `isActive` 為 true

### 資料結構

```
beacon_uuids/
  {document_id}/
    uuid: "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0"
    name: "公司服務 UUID"
    isActive: true
    createdAt: timestamp
```

**注意**: 如果 `beacon_uuids` 中沒有任何啟用的 UUID，系統將不處理任何 beacon 資料。

## 常見問題

### Q1: Gateway not registered 錯誤

**原因**: Gateway 的 MAC 地址尚未在後台註冊

**解決**: 
1. 確認 URL 中的 `gateway_mac` 參數正確
2. 確認後台已註冊此 MAC 地址
3. MAC 地址格式要一致（無冒號、大寫）

### Q2: No active device found 訊息

**原因**: 掃描到的 beacon 尚未在系統中註冊

**解決**:
1. 在後台「Devices」頁面註冊設備
2. 確認 UUID、Major、Minor 完全一致
3. 確認設備的 isActive 為 true

### Q3: Not an iBeacon or invalid rawData

**原因**: 掃描到的是非 iBeacon 設備（如其他 BLE 設備）

**說明**: 這是正常現象，系統會自動跳過非 iBeacon 設備

### Q4: 如何查看詳細日誌？

1. 前往 Firebase Console
2. 進入 Functions 頁面
3. 點擊 `minewGateway` 函數
4. 查看「日誌」標籤

## API 端點資訊

| 項目 | 值 |
|-----|-----|
| **Function 名稱** | minewGateway |
| **URL** | https://minewgateway-{project-id}.a.run.app |
| **方法** | POST |
| **Content-Type** | application/json |

### 請求格式（JSON-LONG）

```json
[
  {
    "timestamp": "2026-01-23T11:10:28Z",
    "type": "iBeacon",
    "mac": "AABBCCDDEEFF",
    "rssi": -65,
    "rawData": "0201061AFF4C000215E2C56DB5DFFB48D2B060D0F5A71096E000010001C5"
  }
]
```

### 回應格式

```json
{
  "success": true,
  "gateway": {
    "mac": "553359763575",
    "name": "二十張路",
    "type": "GENERAL"
  },
  "received": 10,
  "processed": 3,
  "skipped": 2,
  "filteredByUuid": 5,
  "processingTime": 150
}
```

| 欄位 | 說明 |
|-----|------|
| received | 收到的 beacon 數量 |
| processed | 成功處理（更新 device）的數量 |
| skipped | 跳過的數量（非 iBeacon、無 rawData、device 不存在）|
| filteredByUuid | 因 UUID 不在白名單而被過濾的數量 |

## 部署指令

部署新的 Cloud Function：

```bash
cd functions
npm run deploy
```

或只部署此函數：

```bash
firebase deploy --only functions:minewGateway
```

---

**建立日期**: 2026-01-23
**適用設備**: Minew MG6 4G Bluetooth Stellar Gateway
**資料格式**: JSON-LONG / MINEW-CONNECT
