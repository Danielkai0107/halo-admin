# UUID 管理系統

## 📋 功能說明

新增了 **UUID 管理** 頁面，讓你可以統一管理公司使用的 Beacon UUID，並在設備管理中自動帶入選擇。

---

## ✅ 新增內容

### 1. 資料結構

新增 `BeaconUUID` 介面：

```typescript
export interface BeaconUUID {
  id: string;
  uuid: string;              // UUID 字串
  name: string;              // 名稱（例如：公司主要 UUID）
  description?: string;      // 說明
  isActive: boolean;         // 是否啟用
  createdAt?: string;
  updatedAt?: string;
}
```

**Firestore 集合：** `beacon_uuids`

### 2. 新增檔案

#### 服務層
- ✅ `/src/services/uuidService.ts` - UUID 管理服務

#### 頁面
- ✅ `/src/pages/UUIDsPage.tsx` - UUID 管理頁面

#### 路由
- ✅ 更新 `/src/App.tsx` - 新增 `/uuids` 路由
- ✅ 更新 `/src/layouts/DashboardLayout.tsx` - 新增導航菜單項目

### 3. 修改檔案

#### 類型定義
- ✅ `/src/types/index.ts` - 新增 `BeaconUUID` 介面

#### 設備管理頁面
- ✅ `/src/pages/DevicesPage.tsx`
  - 訂閱 UUID 列表
  - UUID 欄位改為下拉選單
  - 自動載入啟用中的 UUID

---

## 🎯 使用流程

### 步驟 1：管理 UUID

1. 進入「UUID 管理」頁面
2. 點擊「新增 UUID」
3. 填寫資料：
   - **名稱**：例如「公司主要 UUID」
   - **UUID**：例如 `E2C56DB5-DFFB-48D2-B060-D0F5A71096E0`
   - **說明**：例如「用於所有工卡型 Beacon」
   - **啟用**：打勾
4. 儲存

### 步驟 2：在設備管理中使用

1. 進入「設備管理」頁面
2. 點擊「登記新設備」
3. UUID 欄位會顯示下拉選單，列出所有啟用的 UUID
4. 選擇對應的 UUID
5. 填寫 Major、Minor 等其他欄位
6. 儲存

---

## 📊 頁面功能

### UUID 管理頁面

**功能列表：**
- ✅ 查看所有 UUID
- ✅ 新增 UUID
- ✅ 編輯 UUID
- ✅ 刪除 UUID
- ✅ 啟用/停用 UUID

**欄位說明：**
| 欄位 | 說明 | 必填 |
|------|------|------|
| 名稱 | UUID 的識別名稱 | 是 |
| UUID | 完整的 UUID 字串 | 是 |
| 說明 | 用途說明 | 否 |
| 狀態 | 啟用/停用 | 是 |

**UUID 格式驗證：**
- 格式：`XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`
- 範例：`E2C56DB5-DFFB-48D2-B060-D0F5A71096E0`

### 設備管理頁面（更新）

**UUID 欄位變更：**
- **修改前**：文字輸入框（手動輸入）
- **修改後**：下拉選單（從 UUID 管理中選擇）

**顯示格式：**
```
請選擇 UUID
公司主要 UUID - E2C56DB5-DFFB-48D2-B060-D0F5A71096E0
測試用 UUID - FDA50693-A4E2-4FB1-AFCF-C6EB07647825
```

**提示訊息：**
- 若有可用 UUID：「💡 若需要新的 UUID，請前往「UUID 管理」新增」
- 若無可用 UUID：「⚠️ 尚未建立 UUID，請先前往「UUID 管理」新增」

---

## 🔧 技術細節

### uuidService 方法

```typescript
export const uuidService = {
  // 訂閱所有 UUID（即時更新）
  subscribe: (callback) => { ... },
  
  // 訂閱活躍的 UUID（即時更新）
  subscribeActive: (callback) => { ... },
  
  // 獲取單個 UUID
  getOne: async (id) => { ... },
  
  // 根據 UUID 字串獲取記錄
  getByUuid: async (uuid) => { ... },
  
  // 新增 UUID
  create: async (data) => { ... },
  
  // 更新 UUID
  update: async (id, data) => { ... },
  
  // 刪除 UUID
  delete: async (id) => { ... },
};
```

### 即時訂閱

設備管理頁面只訂閱**啟用中**的 UUID：

```typescript
const unsubscribeUuids = uuidService.subscribeActive((uuidData) => {
  setUuids(uuidData);
});
```

---

## 📝 範例資料

### 範例 1：單一公司 UUID

```javascript
{
  name: "公司主要 UUID",
  uuid: "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0",
  description: "所有 Beacon 設備統一使用此 UUID",
  isActive: true
}
```

### 範例 2：多個 UUID（不同用途）

```javascript
// UUID 1：工卡型 Beacon
{
  name: "工卡型 Beacon UUID",
  uuid: "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0",
  description: "用於 Minew MWC02 工卡型 Beacon",
  isActive: true
}

// UUID 2：手環型 Beacon
{
  name: "手環型 Beacon UUID",
  uuid: "FDA50693-A4E2-4FB1-AFCF-C6EB07647825",
  description: "用於手環型 Beacon",
  isActive: true
}

// UUID 3：測試用 UUID
{
  name: "測試環境 UUID",
  uuid: "12345678-1234-1234-1234-123456789ABC",
  description: "僅用於開發測試",
  isActive: false  // 停用
}
```

---

## 🎯 優點

### 1. 統一管理
- ✅ 集中管理所有 UUID
- ✅ 避免重複輸入錯誤
- ✅ 易於維護和更新

### 2. 操作簡便
- ✅ 下拉選單選擇，不需手動輸入
- ✅ 顯示名稱和 UUID，易於識別
- ✅ 自動過濾停用的 UUID

### 3. 靈活擴展
- ✅ 可以新增多個 UUID 供選擇
- ✅ 可以啟用/停用 UUID 而不刪除
- ✅ 支援說明欄位，記錄用途

### 4. 避免錯誤
- ✅ UUID 格式驗證
- ✅ 防止輸入錯誤格式
- ✅ 確保使用統一的 UUID

---

## ⚠️ 重要提醒

### 1. UUID 與硬體設定一致

確保 Firestore 中的 UUID 與 Beacon 硬體設定的 UUID **完全一致**：

```
UUID 管理（Firestore）
  └─ E2C56DB5-DFFB-48D2-B060-D0F5A71096E0

設備管理（選擇 UUID）
  └─ E2C56DB5-DFFB-48D2-B060-D0F5A71096E0  ✅ 一致

硬體設定（BeaconSET+ App）
  └─ E2C56DB5-DFFB-48D2-B060-D0F5A71096E0  ✅ 一致
```

### 2. 停用 vs 刪除

- **停用**：UUID 仍保留在資料庫中，但不會在設備管理中顯示
- **刪除**：永久刪除 UUID 記錄（慎用）

建議：如果 UUID 暫時不使用，選擇「停用」而非「刪除」

### 3. 已使用的 UUID

刪除 UUID 前，請確認：
- ✅ 沒有設備正在使用此 UUID
- ✅ 或先將設備改用其他 UUID

---

## 🧪 測試清單

### UUID 管理頁面
- [ ] 新增 UUID - 格式正確
- [ ] 新增 UUID - 格式錯誤（應顯示錯誤）
- [ ] 編輯 UUID
- [ ] 停用 UUID
- [ ] 啟用 UUID
- [ ] 刪除 UUID

### 設備管理頁面
- [ ] UUID 下拉選單是否顯示所有啟用的 UUID
- [ ] 選擇 UUID 後是否正確填入
- [ ] 無可用 UUID 時是否顯示提示訊息
- [ ] 新增設備時 UUID 是否正確儲存

### 整合測試
- [ ] 在 UUID 管理新增 UUID
- [ ] 在設備管理中選擇該 UUID
- [ ] 儲存設備後檢查 Firestore 資料
- [ ] 停用 UUID 後，設備管理中不再顯示

---

## 📁 資料庫結構

### Firestore Collection: `beacon_uuids`

```javascript
beacon_uuids/
  ├─ {uuidId1}/
  │   ├─ uuid: "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0"
  │   ├─ name: "公司主要 UUID"
  │   ├─ description: "所有工卡型 Beacon 使用"
  │   ├─ isActive: true
  │   ├─ createdAt: Timestamp
  │   └─ updatedAt: Timestamp
  │
  └─ {uuidId2}/
      ├─ uuid: "FDA50693-A4E2-4FB1-AFCF-C6EB07647825"
      ├─ name: "手環型 Beacon UUID"
      ├─ description: "用於手環型設備"
      ├─ isActive: false
      ├─ createdAt: Timestamp
      └─ updatedAt: Timestamp
```

---

## 🔍 常見問題

### Q1: 為什麼要統一管理 UUID？

**A:** 
1. 避免手動輸入錯誤
2. 確保所有設備使用相同的 UUID
3. 方便更新和維護
4. 減少重複輸入工作

### Q2: 可以有多個 UUID 嗎？

**A:** 可以。你可以根據不同的設備類型或用途建立多個 UUID。例如：
- UUID 1：工卡型 Beacon
- UUID 2：手環型 Beacon
- UUID 3：測試環境專用

### Q3: 停用 UUID 後會影響現有設備嗎？

**A:** 不會。停用只影響設備管理頁面的下拉選單。已經使用該 UUID 的設備不受影響，仍可正常運作。

### Q4: 如何產生新的 UUID？

**A:** 可以使用線上工具產生：
- https://www.uuidgenerator.net/
- 或使用 BeaconSET+ App 產生隨機 UUID

---

## 📞 下一步

1. **初始設定**
   - 進入「UUID 管理」
   - 新增至少一個公司使用的 UUID
   - 確認狀態為「啟用」

2. **配置設備**
   - 用 BeaconSET+ App 將硬體設定為相同的 UUID
   - 在「設備管理」中選擇該 UUID
   - 填寫 Major、Minor 完成登記

3. **測試驗證**
   - 測試 Beacon 訊號上傳
   - 確認系統能正確識別設備

---

**建立日期：** 2026-01-20  
**檔案位置：** 
- `/src/services/uuidService.ts`
- `/src/pages/UUIDsPage.tsx`
- Firestore: `beacon_uuids` collection
