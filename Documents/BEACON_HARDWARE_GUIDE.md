# Beacon 硬體設定指南（Minew MWC02）

## 📋 修改總結

### 🎯 核心問題

之前的系統設計有以下問題：

1. ❌ 只用 UUID 查詢設備 → 無法區分多張卡片（如果統一設定同一個 UUID）
2. ❌ MAC Address 為必填欄位 → Beacon MAC 會隨機變化，不可靠
3. ❌ Major/Minor 為選填欄位 → 沒有用來做設備識別

### ✅ 修正內容

#### 1. 資料結構調整

```typescript
// 修改前
export interface Device {
  macAddress: string; // 必填 ❌
  uuid?: string; // 選填 ❌
  major?: number; // 選填 ❌
  minor?: number; // 選填 ❌
}

// 修改後
export interface Device {
  uuid: string; // 必填 ✅ - 服務識別碼（統一）
  major: number; // 必填 ✅ - 群組編號
  minor: number; // 必填 ✅ - 設備編號
  macAddress?: string; // 選填 ✅ - 僅供參考
}
```

#### 2. 後端查詢邏輯

**修改前：**

```typescript
// ❌ 只用 UUID 查詢（無法區分不同卡片）
const deviceQuery = await db
  .collection("devices")
  .where("uuid", "==", beacon.uuid)
  .where("isActive", "==", true)
  .limit(1)
  .get();
```

**修改後：**

```typescript
// ✅ 用 UUID + Major + Minor 組合查詢
const deviceQuery = await db
  .collection("devices")
  .where("uuid", "==", beacon.uuid)
  .where("major", "==", beacon.major)
  .where("minor", "==", beacon.minor)
  .where("isActive", "==", true)
  .limit(1)
  .get();
```

修改位置：

- ✅ `sendLineNotification()` - LINE 通知時的設備查詢
- ✅ `createBoundaryAlert()` - 邊界警報時的設備查詢
- ✅ `processBeacon()` - Beacon 數據處理時的設備查詢

#### 3. 設備服務更新

新增 `getByMajorMinor()` 方法：

```typescript
getByMajorMinor: async (uuid: string, major: number, minor: number) => {
  const devicesQuery = query(
    collection(db, "devices"),
    where("uuid", "==", uuid),
    where("major", "==", major),
    where("minor", "==", minor),
  );
  // ...
};
```

#### 4. 前端表單驗證

- ✅ UUID 必填驗證（已有）
- ✅ Major 必填驗證（新增）
- ✅ Minor 必填驗證（新增）
- ✅ MAC Address 改為選填（移除必填）
- ✅ 更新說明文字和提示

---

## 🔧 Minew MWC02 硬體設定指南

### 設定工具

使用 **BeaconSET+** App（iOS / Android）

- iOS: App Store 搜尋 "BeaconSET+"
- Android: Google Play 搜尋 "BeaconSET+"

### 🎯 核心識別參數設定

#### 1. UUID（服務識別碼）

**設定建議：** 所有卡片統一設定同一個 UUID

```
建議 UUID: E2C56DB5-DFFB-48D2-B060-D0F5A71096E0
```

**用途：** 系統透過 UUID 識別「是否為我們公司的設備」

**說明：**

- 這是「通關密語」
- 接收器只掃描此 UUID 的設備，過濾掉其他公司的 Beacon

#### 2. Major（群組編號）

**設定建議：** 根據社區或區域分配

```
範例：
- Major: 1 → 大愛社區
- Major: 2 → 博愛社區
- Major: 3 → 仁愛社區
```

**用途：** 代表「群組」或「地點」

#### 3. Minor（設備編號）

**設定建議：** 每張卡片唯一編號

```
範例：
- Minor: 1001 → 王奶奶的卡片
- Minor: 1002 → 李爺爺的卡片
- Minor: 1003 → 張奶奶的卡片
```

**用途：** 代表「個人編號」

**重要：Major + Minor 組合才是設備的唯一識別碼**

#### 4. Device Name（設備名稱）

**設定建議：** 設定易於辨識的名稱

```
範例：
- "User_1001" → 對應 Major: 1, Minor: 1001
- "Wang_Grandma" → 王奶奶
```

**用途：** 方便除錯和管理，掃描時可直接看到名稱

---

## 📝 實際操作流程

### 步驟 1：用 BeaconSET+ App 設定硬體

```
1. 打開 BeaconSET+ App
2. 掃描到 Minew_XXXXX 卡片
3. 點擊進入設定頁面
4. 設定以下參數：
   - UUID: E2C56DB5-DFFB-48D2-B060-D0F5A71096E0（統一）
   - Major: 1（假設是大愛社區）
   - Minor: 1001（假設是王奶奶）
   - Device Name: User_1001（方便識別）
5. 儲存設定
```

### 步驟 2：在系統中登記設備

```
1. 進入「設備管理」頁面
2. 點擊「登記新設備」
3. 填寫資料：
   ✅ 設備名稱: 王奶奶的 Beacon 卡
   ✅ UUID: E2C56DB5-DFFB-48D2-B060-D0F5A71096E0
   ✅ Major: 1
   ✅ Minor: 1001
   ⚠️ MAC Address: （留空即可，會自動變化）
   ✅ 設備類型: iBeacon
4. 儲存
```

### 步驟 3：分配到社區

```
1. 進入「Line OA 管理」
2. 選擇「大愛社區」
3. 點擊「分配設備」
4. 選擇剛才登記的設備
5. 確認分配
```

### 步驟 4：綁定給長者

```
1. 進入「長者管理」
2. 選擇「王奶奶」
3. 在設備欄位選擇對應的 Beacon
4. 儲存
```

---

## 🎯 設定範例

### 範例 1：大愛社區（10 位長者）

| 長者   | UUID         | Major | Minor | Device Name |
| ------ | ------------ | ----- | ----- | ----------- |
| 王奶奶 | E2C56DB5-... | 1     | 1001  | User_1001   |
| 李爺爺 | E2C56DB5-... | 1     | 1002  | User_1002   |
| 張奶奶 | E2C56DB5-... | 1     | 1003  | User_1003   |
| 陳爺爺 | E2C56DB5-... | 1     | 1004  | User_1004   |
| 林奶奶 | E2C56DB5-... | 1     | 1005  | User_1005   |

### 範例 2：多社區部署

| 社區     | UUID         | Major | Minor 範圍 |
| -------- | ------------ | ----- | ---------- |
| 大愛社區 | E2C56DB5-... | 1     | 1001-1099  |
| 博愛社區 | E2C56DB5-... | 2     | 2001-2099  |
| 仁愛社區 | E2C56DB5-... | 3     | 3001-3099  |

---

## ⚠️ 重要提醒

### 1. MAC Address 為什麼不可靠？

Beacon 使用 **BLE 隱私保護機制**，MAC 地址會定期隨機變化（Random MAC），這是 iOS/Android 隱私保護的標準做法。

**不要依賴 MAC Address 做識別！**

### 2. UUID 為什麼要統一？

- ✅ 方便管理：所有卡片設定一樣，不會搞混
- ✅ 快速掃描：接收器只掃描特定 UUID，省電高效
- ✅ 安全性：避免掃描到其他公司的設備

### 3. 為什麼要用 Major + Minor？

- ✅ 唯一識別：Major + Minor 組合才是真正的設備 ID
- ✅ 分層管理：Major 分群組，Minor 分個體
- ✅ 標準做法：這是 iBeacon 協議的設計初衷

---

## 🔍 除錯技巧

### 問題 1：系統顯示「找不到設備」

**檢查清單：**

1. ✅ 確認硬體的 UUID 與資料庫中的 UUID 一致
2. ✅ 確認 Major 和 Minor 數值正確（數字要完全一致）
3. ✅ 確認設備在資料庫中 `isActive: true`
4. ✅ 確認接收器（Gateway）有正常運作

**除錯指令：**

```typescript
// 在瀏覽器 Console 測試
const result = await deviceService.getByMajorMinor(
  "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0",
  1,
  1001,
);
console.log(result);
```

### 問題 2：Beacon 訊號收不到

**檢查清單：**

1. ✅ 確認 Beacon 電池有電
2. ✅ 確認 Beacon 設定中的「廣播間隔」不要太長（建議 500ms-1000ms）
3. ✅ 確認 Beacon 的「發射功率」足夠（建議 0dBm 或更高）
4. ✅ 確認接收器與 Beacon 距離不要太遠（建議 10 公尺內測試）

### 問題 3：通知沒有發送

**檢查清單：**

1. ✅ 確認設備已綁定長者（`elderId` 不為 null）
2. ✅ 確認長者資料存在
3. ✅ 確認 LINE Channel 設定正確
4. ✅ 確認社區成員有綁定 LINE 帳號
5. ✅ 查看 Firebase Functions 日誌

---

## 📊 資料流程圖

```
硬體設定
  ↓
Beacon 廣播訊號 (UUID + Major + Minor + RSSI)
  ↓
接收器掃描到訊號
  ↓
上傳到 Cloud Function (receiveBeaconData)
  ↓
用 UUID + Major + Minor 查詢設備
  ↓
找到對應的長者
  ↓
更新位置 & 發送通知
```

---

## 🎉 完成確認

修改完成後，請確認以下項目：

- [x] 資料結構已更新（UUID、Major、Minor 必填，MAC 選填）
- [x] 後端查詢邏輯已改用 UUID + Major + Minor
- [x] 前端表單驗證已更新
- [x] 設備服務新增 getByMajorMinor() 方法
- [x] 沒有 TypeScript 錯誤
- [x] 沒有 Linter 錯誤

---

## 📞 後續支援

如有問題，請檢查：

1. Firebase Functions 日誌
2. 瀏覽器 Console 錯誤
3. Firestore 資料庫內容

**關鍵日誌訊息：**

- `No active device found for UUID XXX, Major YYY, Minor ZZZ`
- 表示資料庫中沒有對應的設備記錄

---

**修改完成日期：** 2026-01-20  
**影響範圍：** 設備識別邏輯（不影響通知功能）  
**向下相容：** 已有資料需要補填 Major 和 Minor 欄位
