# 設備序號改為 Major-Minor 格式

## 📋 修改說明

將設備管理頁面的「設備序號」從原本的日期格式（`d-26-01-0001`）改為 **Major-Minor** 格式（例如：`1-1001`）。

---

## ✅ 修改內容

### 1. 自動生成序號邏輯

**修改前：**
```typescript
// 生成格式：d-年份-月份-該月第幾個
const deviceSerial = `d-26-01-0001`;
```

**修改後：**
```typescript
// 自動根據 Major 和 Minor 生成
const deviceSerial = `${major}-${minor}`;  // 例如：1-1001
```

### 2. 表單自動更新

新增了監聽機制，當用戶輸入 Major 或 Minor 時，序號會**自動更新**：

```typescript
// 監聽 major 和 minor 的變化
const major = watch('major');
const minor = watch('minor');

useEffect(() => {
  if (major !== undefined && minor !== undefined) {
    const deviceSerial = `${major}-${minor}`;
    setValue('deviceName', deviceSerial);
  }
}, [major, minor, setValue]);
```

### 3. 表單欄位更新

**序號欄位：**
- ✅ 改為**唯讀**欄位（自動生成）
- ✅ 不再需要手動輸入
- ✅ 顯示提示：「序號格式：Major-Minor（例如：1-1001）會自動更新」

### 4. 列表顯示更新

設備列表中的序號欄位也會顯示 Major-Minor 格式：

```typescript
// 優先顯示 Major-Minor，沒有則顯示原本的 deviceName
{device.major !== undefined && device.minor !== undefined 
  ? `${device.major}-${device.minor}` 
  : device.deviceName || '-'}
```

---

## 🎯 使用方式

### 新增設備流程

1. 點擊「登記新設備」
2. 輸入 **UUID**（必填）：例如 `E2C56DB5-DFFB-48D2-B060-D0F5A71096E0`
3. 輸入 **Major**（必填）：例如 `1`（代表社區）
4. 輸入 **Minor**（必填）：例如 `1001`（代表設備編號）
5. 序號欄位會自動顯示：`1-1001` ✨
6. 填寫其他資料後儲存

### 編輯設備流程

1. 點擊設備的「編輯」按鈕
2. 序號欄位會自動顯示當前的 Major-Minor 組合
3. 如果修改 Major 或 Minor，序號會自動更新
4. 儲存修改

---

## 📊 範例

### 範例 1：大愛社區設備

| 長者 | Major | Minor | 自動生成序號 |
|------|-------|-------|-------------|
| 王奶奶 | 1 | 1001 | `1-1001` |
| 李爺爺 | 1 | 1002 | `1-1002` |
| 張奶奶 | 1 | 1003 | `1-1003` |

### 範例 2：多社區設備

| 社區 | Major | Minor 範圍 | 序號範圍 |
|------|-------|------------|----------|
| 大愛社區 | 1 | 1001-1099 | `1-1001` ~ `1-1099` |
| 博愛社區 | 2 | 2001-2099 | `2-2001` ~ `2-2099` |
| 仁愛社區 | 3 | 3001-3099 | `3-3001` ~ `3-3099` |

---

## 🔧 技術細節

### 修改的檔案

- ✅ `/src/pages/DevicesPage.tsx`

### 修改的函數

1. **handleCreate()** - 創建設備時的初始化
2. **handleEdit()** - 編輯設備時的資料載入
3. **表單欄位** - 序號欄位改為唯讀自動生成
4. **列表顯示** - 序號列顯示 Major-Minor 格式

### 新增的邏輯

```typescript
// 1. 解構 watch 和 setValue
const { watch, setValue } = useForm();

// 2. 監聽 major 和 minor
const major = watch('major');
const minor = watch('minor');

// 3. 自動更新 deviceName
useEffect(() => {
  if (major !== undefined && minor !== undefined && major !== '' && minor !== '') {
    setValue('deviceName', `${major}-${minor}`);
  }
}, [major, minor, setValue]);
```

---

## ⚠️ 重要提醒

### 1. 現有設備的相容性

- ✅ 現有設備如果沒有 Major/Minor，仍會顯示原本的 `deviceName`
- ✅ 新增或編輯設備時，會自動使用 Major-Minor 格式
- ✅ 不會影響已存在的設備資料

### 2. 序號唯一性

- ⚠️ Major-Minor 組合應該是唯一的
- ⚠️ 系統目前**不會**自動檢查重複（可以在未來加入）
- 💡 建議：規劃好 Major 和 Minor 的編號規則

### 3. 與硬體設定的一致性

確保系統中的 Major/Minor 與硬體設定的 Major/Minor **完全一致**：

```
硬體設定（BeaconSET+ App）
  ├─ UUID: E2C56DB5-...
  ├─ Major: 1
  └─ Minor: 1001

系統登記（Admin 後台）
  ├─ UUID: E2C56DB5-...  ✅ 一致
  ├─ Major: 1            ✅ 一致
  └─ Minor: 1001         ✅ 一致
  → 自動生成序號：1-1001
```

---

## 🎉 優點

### 1. 更直觀
- ✅ 序號直接對應硬體的 Major-Minor
- ✅ 一眼就能看出設備的群組和編號

### 2. 更一致
- ✅ 與 Beacon 硬體設定完全對應
- ✅ 減少人為錯誤

### 3. 更簡單
- ✅ 自動生成，不需要手動輸入
- ✅ 修改 Major/Minor 時自動更新

### 4. 更靈活
- ✅ Major 可以代表社區/區域
- ✅ Minor 可以代表個人編號
- ✅ 組合靈活，易於管理

---

## 📝 測試清單

新增設備測試：
- [ ] 輸入 Major 和 Minor，序號是否自動更新
- [ ] 序號格式是否正確（Major-Minor）
- [ ] 儲存後資料是否正確

編輯設備測試：
- [ ] 載入時序號是否正確顯示
- [ ] 修改 Major/Minor 時序號是否自動更新
- [ ] 更新後資料是否正確

列表顯示測試：
- [ ] 序號欄位是否顯示 Major-Minor 格式
- [ ] 舊設備（無 Major/Minor）是否顯示原本的 deviceName
- [ ] 新設備是否正確顯示

---

## 🔍 除錯提示

### 問題：序號沒有自動更新

**可能原因：**
1. Major 或 Minor 欄位為空
2. Major 或 Minor 值為 `undefined`

**解決方法：**
確保 Major 和 Minor 都已填寫數值

### 問題：舊設備顯示不正確

**可能原因：**
舊設備沒有 Major 和 Minor 資料

**解決方法：**
編輯舊設備，補填 Major 和 Minor 欄位

---

**修改完成日期：** 2026-01-20  
**影響範圍：** 設備序號顯示和生成邏輯  
**向下相容：** 是（舊設備仍顯示原本的 deviceName）
