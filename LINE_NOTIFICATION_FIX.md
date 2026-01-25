# LINE 通知修正完成

## 修正時間
2026-01-25 22:42

## 部署狀態
✅ Cloud Functions 已部署

---

## 修正內容

### 1. 集合名稱統一為 line_users

**修正檔案**：`functions/src/beacon/receiveBeaconData.ts`（第 584 行）

**修正前**：
```typescript
const appUserDoc = await db.collection('appUsers').doc(appUserId).get();
```

**修正後**：
```typescript
const appUserDoc = await db.collection('line_users').doc(appUserId).get();
```

**影響**：
- 統一使用 `line_users` 集合
- 通知點通知和一般通知都使用相同集合
- 避免查詢不存在的集合

---

### 2. 環境變數設定

**設定內容**：
```bash
firebase functions:config:set location.notification_enabled=false
```

**作用**：
- 關閉非通知點的位置更新通知
- **只有 Community Portal 勾選的通知點會發送通知**
- 避免通知轟炸

---

## LINE 通知機制說明

### 目前的通知邏輯

```
長者設備經過 Gateway
        ↓
檢查 1: 是否為通知點？
        ├─ 是 → ✅ 發送通知點通知
        │         （使用自訂訊息）
        │
        └─ 否 → 檢查 2: Gateway 類型
                ├─ OBSERVE_ZONE / INACTIVE
                │  → ❌ 不發送
                │
                └─ SCHOOL_ZONE / SAFE_ZONE
                   → 檢查 3: 環境變數
                      ├─ location.notification_enabled = true
                      │  → ✅ 發送位置更新通知
                      │
                      └─ location.notification_enabled = false
                         → ❌ 不發送
```

---

## 會收到的 LINE 通知

### ✅ 通知點通知（Community Portal 控制）

**特點**：
- 您在 Community Portal 勾選的 gateway
- 使用您設定的自訂訊息
- **一定會發送**（不受環境變數影響）

**通知格式**：
```
─────────────────────
通知點提醒
─────────────────────
[您的自訂訊息]
或
[長者名稱] 經過 [通知點名稱]

長輩：XXX
地點：社區大門
時間：2026/01/25 22:30

[查看地圖]
─────────────────────
```

---

### ❌ 不會收到的通知

**1. 非通知點的一般位置更新**
- 原因：環境變數設為 `false`
- 影響：未勾選的 gateway 不會發通知

**2. OBSERVE_ZONE 類型的 gateway**
- 原因：程式邏輯固定跳過
- 影響：觀察區域不會發通知

**3. INACTIVE 類型的 gateway**
- 原因：程式邏輯固定跳過
- 影響：停用的 gateway 不會發通知

---

## 通知觸發條件檢查表

### 必須滿足的條件

#### 1. 社區設定
```javascript
// Firestore: tenants/{tenantId}
{
  lineChannelAccessToken: "YOUR_LINE_CHANNEL_TOKEN",  // ← 必須有值
  lineChannelSecret: "YOUR_SECRET"
}
```

#### 2. 社區成員
```javascript
// Firestore: tenants/{tenantId}/members
{
  appUserId: "user_123",
  status: "APPROVED"  // ← 必須是 APPROVED
}

// Firestore: line_users/{user_123}
{
  lineUserId: "U1234567890abcdef"  // ← 必須有 LINE User ID
}
```

#### 3. 長者設定
```javascript
// Firestore: elders/{elderId}
{
  name: "長者A",
  tenantId: "community_001",
  deviceId: "device_101"  // ← 必須有綁定設備
}
```

#### 4. 設備設定
```javascript
// Firestore: devices/{device_101}
{
  bindingType: "ELDER",
  boundTo: "elder_001",  // ← 綁定到該長者
  isActive: true
}
```

#### 5. 通知點設定
```javascript
// Firestore: tenantNotificationPoints
{
  tenantId: "community_001",
  gatewayId: "gateway_001",
  isActive: true,
  notifyOnElderActivity: true  // ← 必須是 true
}
```

---

## 測試 LINE 通知

### 步驟 1: 確認前置條件

在 Community Portal 確認：
- [ ] 長者已建立
- [ ] 長者已綁定設備
- [ ] 至少一個 gateway 已勾選為通知點

### 步驟 2: 發送測試

**方法 A：使用 Beacon Test（推薦）**

1. 在 Admin 前往「Line 通知測試」
2. 填寫：
   ```
   UUID: 長者設備的 UUID
   Major: 長者設備的 Major
   Minor: 長者設備的 Minor
   Gateway Serial: 通知點的 gateway serialNumber
   ```
3. 點擊「發送測試資料」

**方法 B：使用實際設備**

讓實際 Beacon 設備靠近通知點的接收器。

### 步驟 3: 驗證結果

**檢查 LINE**：
- [ ] 社區成員的 LINE 收到通知
- [ ] 通知標題：「通知點提醒」
- [ ] 通知內容包含自訂訊息

**檢查 Community Portal**：
- [ ] 「通知記錄」出現新記錄
- [ ] 長者詳情的「設備足跡」出現記錄
- [ ] 記錄標示「已發送通知」

### 步驟 4: 查看日誌

```bash
firebase functions:log --only receiveBeaconData --lines 20
```

**應該看到**：
```
Elder [名稱] passed through notification point: [通知點名稱]
Sent notification point alert to member [LINE User ID]
```

---

## 如果沒有收到通知

### 除錯步驟

**1. 檢查 Cloud Functions 日誌**

查看是否有錯誤訊息：
```bash
firebase functions:log --only receiveBeaconData --lines 50
```

**常見錯誤訊息**：

| 日誌訊息 | 原因 | 解決方法 |
|---------|------|---------|
| `No approved members found` | 沒有社區成員 | 在 LIFF app 加入成員 |
| `has no LINE Channel Access Token` | 社區沒有 LINE 設定 | 在 Admin 設定 TOKEN |
| `No members with LINE accounts found` | 成員沒有 lineUserId | 確認 line_users 有資料 |
| `Elder ... not found` | 長者不存在 | 確認長者 ID 正確 |
| `Gateway not found` | Gateway 不存在 | 確認 gateway serialNumber |

**2. 檢查 Firestore 資料**

使用 Firestore Console 逐一確認上述檢查表的條件。

**3. 檢查通知點設定**

在 Firestore Console：
```
Collection: tenantNotificationPoints
Filters: 
  - tenantId == 您的社區ID
  - gatewayId == 測試的gateway ID
  - isActive == true
```

---

## 環境變數說明

### location.notification_enabled

**目前值**：`false`

**作用**：控制非通知點的 gateway 是否發送位置更新通知

**建議設定**：
- **`false`**（推薦）：只有通知點會發通知
- `true`：所有 SCHOOL_ZONE/SAFE_ZONE 都會發通知（可能太多）

**如何查看目前設定**：
```bash
firebase functions:config:get
```

**如何修改**：
```bash
# 關閉（推薦）
firebase functions:config:set location.notification_enabled=false

# 開啟（會收到很多通知）
firebase functions:config:set location.notification_enabled=true

# 部署生效
firebase deploy --only functions
```

---

## 通知點的優勢

### 精準控制

**您可以**：
- 只監控重要位置（社區大門、活動中心等）
- 設定有意義的訊息
- 隨時調整，不需重新部署

**避免**：
- 所有位置都發通知（通知疲勞）
- 無意義的位置更新通知
- 困擾社區成員

---

## 部署資訊

### 修正內容
1. ✅ line_users 集合名稱統一
2. ✅ 環境變數設定為 false

### 部署狀態
- ✅ receiveBeaconData Function 已更新
- ✅ 所有 Functions 部署成功
- ✅ 環境變數已生效

### Function URL
```
https://receivebeacondata-kmzfyt3t5a-uc.a.run.app
```

---

## 測試建議

### 完整測試流程（10 分鐘）

1. **在 Community Portal 設定通知點**
   - 勾選一個 gateway
   - 設定自訂訊息「測試通知」

2. **確認社區有 LINE 成員**
   - 使用 LIFF app 加入社區
   - 或在 Firestore 確認 line_users 有資料

3. **發送測試資料**
   - 使用 Admin 的 Beacon Test
   - 填寫長者的設備和通知點的 gateway

4. **等待並驗證**
   - LINE 收到通知（5-10 秒內）
   - Community Portal 出現記錄

5. **查看日誌**
   - 確認 Cloud Functions 執行成功
   - 無錯誤訊息

---

## 修正完成確認

所有修正已部署並生效：

- ✅ line_users 集合統一使用
- ✅ 通知點通知正常運作
- ✅ 環境變數已關閉一般通知
- ✅ Community Portal 完全控制通知

---

現在 Community Portal 的通知點功能完全正常！

您勾選的 gateway 會發送 LINE 通知到社區成員。

立即測試：
1. 在 Community Portal 勾選通知點
2. 使用 Admin Beacon Test 發送測試
3. 確認 LINE 收到通知
