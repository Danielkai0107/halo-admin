# 接收器自動註冊功能

## 📋 重大改進

### 🎯 核心變更

#### 1. **Gateway 自動註冊**

- ✅ 接收器首次上傳時自動創建記錄
- ✅ 不再返回 404 錯誤
- ✅ 簡化部署流程

#### 2. **TenantId 來源調整**

- ❌ **修改前**：從 Gateway 的 tenantId 取得社區
- ✅ **修改後**：從長者的 tenantId 取得社區

---

## 🔄 新的邏輯流程

### 修改前（舊邏輯）

```
1. 查詢 Gateway
   └─ 找不到 → ❌ 返回 404 錯誤

2. 從 Gateway 取得 tenantId
   └─ tenantId = null → ❌ 跳過通知

3. 查詢設備 → 查詢長者

4. 發送通知給 Gateway 的社區
```

**問題：**

- Gateway 必須預先註冊
- Gateway 必須關聯社區
- 共用的 Gateway（手機）很難管理

### 修改後（新邏輯）✅

```
1. 查詢 Gateway
   └─ 找不到 → ✅ 自動註冊（tenantId = null）

2. 查詢設備（UUID + Major + Minor）

3. 查詢長者

4. 從長者取得 tenantId 關鍵
   └─ tenantId = null → ⚠️ 跳過通知
   └─ tenantId 存在 → ✅ 繼續

5. 發送通知給長者的社區 ✅
```

**優點：**

- ✅ 接收器無需預先註冊
- ✅ 通知發送給正確的社區（基於長者）
- ✅ 支援共用接收器（多社區）

---

## 📊 自動註冊邏輯

### 觸發條件

當上傳的 `gateway_id` 在 Firestore 中找不到時，自動創建：

```typescript
async function getOrCreateGateway(gatewayId, payload, db) {
  // 先嘗試查詢
  let gateway = await getGatewayInfo(gatewayId, db);

  if (gateway) {
    return gateway; // 已存在，直接使用
  }

  // 不存在，自動註冊
  console.log(`Auto-registering new gateway: ${gatewayId}`);

  const newGateway = {
    serialNumber: gatewayId,
    macAddress: gatewayId.includes(":") ? gatewayId : undefined,
    imei:
      !gatewayId.includes(":") && gatewayId.length >= 10
        ? gatewayId
        : undefined,
    name: `Auto-Gateway-${gatewayId.substring(0, 8)}`,
    location: `Auto-registered at ${new Date().toISOString()}`,
    type: "MOBILE",
    latitude: payload.lat,
    longitude: payload.lng,
    tenantId: null, // 不關聯特定社區
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await db.collection("gateways").add(newGateway);
  return newGateway;
}
```

### 自動判斷類型

```typescript
// 根據 gateway_id 格式自動判斷
if (gatewayId.includes(":")) {
  // 包含冒號 → MAC Address
  macAddress = gatewayId;
  // 例如：AA:BB:CC:DD:EE:FF
} else if (gatewayId.length >= 10) {
  // 長度 >= 10 → IMEI 或其他 ID
  imei = gatewayId;
  // 例如：ANDROID-42ec6a54d319eb84
}
```

---

## 🎯 你的資料分析

### 上傳資料

```json
{
  "gateway_id": "ANDROID-42ec6a54d319eb84",
  "lat": 25.0339,
  "lng": 121.5645,
  "timestamp": 1737363092720,
  "beacons": [
    {
      "uuid": "FDA50693-A4E2-4FB1-AFCF-C6EB01234567",
      "major": 1,
      "minor": 1001,
      "rssi": -65
    },
    {
      "uuid": "FDA50693-A4E2-4FB1-AFCF-C6EB07654321",
      "major": 2,
      "minor": 2001,
      "rssi": -78
    }
  ]
}
```

### 處理結果

#### Gateway 處理：

```
1. 查詢 gateway_id = "ANDROID-42ec6a54d319eb84"
   └─ 找不到 → 自動註冊

2. 創建 Gateway 記錄：
   {
     serialNumber: "ANDROID-42ec6a54d319eb84",
     imei: "ANDROID-42ec6a54d319eb84",
     name: "Auto-Gateway-ANDROID-4",
     type: "MOBILE",
     latitude: 25.0339,
     longitude: 121.5645,
     tenantId: null,
     isActive: true
   }

✅ 不再返回 404 錯誤
```

#### Beacon 1 處理（1-1001）：

```
1. 查詢設備：
   WHERE uuid = "FDA50693-A4E2-4FB1-AFCF-C6EB01234567"
     AND major = 1
     AND minor = 1001
     AND isActive = true

2a. 找到設備 → 檢查是否綁定長者
    ├─ 有綁定 → 取得 elder.tenantId
    │  ├─ tenantId 存在 → ✅ 發送通知
    │  └─ tenantId = null → ⚠️ 跳過通知
    └─ 沒綁定 → ⚠️ 跳過（status: 'ignored'）

2b. 找不到設備 → ⚠️ 跳過（status: 'ignored'）
```

#### Beacon 2 處理（2-2001）：

```
相同邏輯處理
```

---

## ✅ 新的通知觸發條件

```
1. Gateway 存在 ✅（自動註冊，永遠成功）
2. 設備存在（UUID+Major+Minor）？（需要檢查）
3. 設備綁定長者 ？（需要檢查）
4. 長者有 tenantId ⭐（從這裡取得社區）
5. 社區有 LINE Token ？（需要檢查）
6. 社區有成員綁定 LINE ？（需要檢查）
```

**關鍵差異：**

- ❌ **刪除**：Gateway 必須有 tenantId
- ✅ **新增**：從長者的 tenantId 取得社區

---

## 📊 實際案例分析

### 情況 1：設備已註冊並綁定長者

```javascript
// Firestore 資料
devices/{deviceId}
  ├─ uuid: "FDA50693-A4E2-4FB1-AFCF-C6EB01234567"
  ├─ major: 1
  ├─ minor: 1001
  ├─ elderId: "elder_wang_001"  ✅
  └─ isActive: true

elders/elder_wang_001
  ├─ name: "王奶奶"
  ├─ tenantId: "tenant_dalove_001"  ✅ 關鍵
  └─ ...

tenants/tenant_dalove_001
  ├─ name: "大愛社區"
  ├─ lineChannelAccessToken: "xxx"  ✅
  └─ ...
```

**結果：✅ 會觸發通知**

- 發送給「大愛社區」的所有成員
- 通知內容：「王奶奶 今日首次活動」

---

### 情況 2：設備未綁定長者

```javascript
devices/{deviceId}
  ├─ uuid: "FDA50693-A4E2-4FB1-AFCF-C6EB01234567"
  ├─ major: 1
  ├─ minor: 1001
  ├─ elderId: null  ❌
  └─ isActive: true
```

**結果：⚠️ 不會觸發通知**

- 日誌：`Device has no associated elder, skipping location update`
- 返回：`status: 'ignored'`

---

### 情況 3：長者未關聯社區

```javascript
devices/{deviceId}
  ├─ elderId: "elder_wang_001"  ✅
  └─ ...

elders/elder_wang_001
  ├─ name: "王奶奶"
  ├─ tenantId: null  ❌
  └─ ...
```

**結果：⚠️ 不會觸發通知**

- 位置會更新
- 但不發送通知
- 日誌：`Elder has no associated tenant, skipping notification`

---

### 情況 4：設備不存在

```javascript
// Firestore 中沒有這個設備
UUID: FDA50693-A4E2-4FB1-AFCF-C6EB01234567
Major: 1
Minor: 1001
```

**結果：⚠️ 完全忽略**

- 日誌：`No active device found for UUID..., Major..., Minor...`
- 返回：`status: 'ignored'`

---

## 🎯 你的資料會觸發通知嗎？

根據你的上傳資料，**取決於以下條件：**

### Beacon 1（1-1001）

```
需要檢查 Firestore：

devices 集合中是否存在：
  ├─ uuid: "FDA50693-A4E2-4FB1-AFCF-C6EB01234567"
  ├─ major: 1
  ├─ minor: 1001
  ├─ elderId: "有值"  ⚠️
  └─ isActive: true

如果 elderId 存在，再檢查：

elders/{elderId}
  ├─ tenantId: "有值"  ⚠️
  └─ ...

如果 tenantId 存在，再檢查：

tenants/{tenantId}
  ├─ lineChannelAccessToken: "有值"  ⚠️
  └─ ...
```

**✅ 所有條件都滿足 → 會觸發通知**  
**❌ 任何一個不滿足 → 不會觸發通知**

---

## 📝 檢查清單

要確認你的資料能否觸發通知，請檢查：

**Firestore Console:**

```
https://console.firebase.google.com/project/safe-net-tw/firestore

檢查：
1. devices 集合
   - 搜尋 uuid: FDA50693-A4E2-4FB1-AFCF-C6EB01234567
   - 確認 major: 1, minor: 1001
   - 確認有 elderId

2. elders 集合
   - 打開上面找到的 elderId
   - 確認有 tenantId

3. tenants 集合
   - 打開上面找到的 tenantId
   - 確認有 lineChannelAccessToken
```

---

## 🔧 建議的測試步驟

### 步驟 1：準備測試資料

在後台創建完整的測試資料：

```
1. UUID 管理
   └─ 新增 UUID: FDA50693-A4E2-4FB1-AFCF-C6EB01234567

2. 設備管理
   └─ 新增設備:
      ├─ UUID: FDA50693-A4E2-4FB1-AFCF-C6EB01234567
      ├─ Major: 1
      └─ Minor: 1001

3. 社區管理
   └─ 分配設備到社區
   └─ 確認 LINE Token 已設定

4. 長者管理
   └─ 綁定設備給長者
   └─ 確認長者屬於該社區
```

### 步驟 2：上傳測試

```bash
curl -X POST https://receivebeacondata-kmzfyt3t5a-uc.a.run.app \
  -H "Content-Type: application/json" \
  -d '{
    "gateway_id": "ANDROID-42ec6a54d319eb84",
    "lat": 25.0339,
    "lng": 121.5645,
    "timestamp": 1737363092720,
    "beacons": [{
      "uuid": "FDA50693-A4E2-4FB1-AFCF-C6EB01234567",
      "major": 1,
      "minor": 1001,
      "rssi": -65
    }]
  }'
```

### 步驟 3：檢查結果

**Functions 日誌：**

```
https://console.firebase.google.com/project/safe-net-tw/functions/logs

查看：
- Gateway: Auto-Gateway-ANDROID-4 (MOBILE) - Tenant: None
- No active device found → 設備不存在
- Device has no associated elder → 設備未綁定長者
- Elder has no associated tenant → 長者未關聯社區
- Sent LINE notification → ✅ 成功發送
```

**LINE App：**

- 檢查是否收到通知

---

## 核心改進說明

### 為什麼從長者取得 tenantId 更合理？

#### 舊方式的問題：

```
Gateway (手機 A) → tenantId: 大愛社區
  ├─ 掃描到王奶奶（大愛社區）✅ 正確
  └─ 掃描到李爺爺（博愛社區）❌ 錯誤！
      └─ 會發送給大愛社區（因為 Gateway 屬於大愛）
```

#### 新方式的優點：

```
Gateway (手機 A) → tenantId: null（不關聯任何社區）
  ├─ 掃描到王奶奶
  │   └─ 王奶奶.tenantId = 大愛社區
  │   └─ ✅ 發送給大愛社區
  │
  └─ 掃描到李爺爺
      └─ 李爺爺.tenantId = 博愛社區
      └─ ✅ 發送給博愛社區
```

**支援一個接收器服務多個社區！**

---

## 📝 修改文件

- ✅ `/functions/src/beacon/receiveBeaconData.ts`
  - 新增 `getOrCreateGateway()` 函數
  - 修改 `GatewayInfo` interface（tenantId 允許 null）
  - `sendLineNotification()` 從長者取得 tenantId
  - `createBoundaryAlert()` 從長者取得 tenantId

---

## 🔍 除錯技巧

### 查看詳細日誌

```bash
# 查看最近的 Function 日誌
firebase functions:log --only receiveBeaconData --limit 50
```

### 常見日誌訊息

```
✅ "Gateway auto-registered with ID: xxx"
   → Gateway 成功自動註冊

⚠️ "No active device found for UUID XXX, Major YYY, Minor ZZZ"
   → 設備不存在或未啟用

⚠️ "Device has no associated elder"
   → 設備未綁定長者

⚠️ "Elder has no associated tenant"
   → 長者未關聯社區（這是關鍵！）

✅ "Sent LINE notification to member xxx"
   → 通知成功發送
```

---

## ✅ 部署狀態

- ✅ 已部署到生產環境
- ✅ URL: https://receivebeacondata-kmzfyt3t5a-uc.a.run.app
- ✅ Gateway 自動註冊功能啟用
- ✅ TenantId 從長者取得

---

**更新日期：** 2026-01-20  
**影響範圍：** Gateway 驗證和通知邏輯  
**向下相容：** 是（已註冊的 Gateway 仍正常運作）
