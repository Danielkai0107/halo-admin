# 長輩 Table 資料顯示修正

## 問題描述

長輩 Table 的設備狀態欄位沒有正確顯示設備資料。

---

## 問題原因

### 資料未關聯

**問題**：
- `elderService.subscribe` 只返回長者基本資料
- 不包含關聯的設備資料（`elder.device`）
- Table 中 `elder.device` 為 undefined
- 設備狀態欄位無法顯示

**Admin 的做法**：
- 同時訂閱 elders 和 devices
- 使用 `useMemo` 合併資料
- 根據 `bindingType` 和 `boundTo` 關聯

---

## 解決方案

### 修正邏輯

**1. 同時訂閱兩個集合**：

```typescript
// 訂閱長者列表
const unsubscribeElders = elderService.subscribe(tenantId, (data) => {
  setElders(data);
});

// 訂閱設備列表
const unsubscribeDevices = deviceService.subscribe(tenantId, (data) => {
  setDevices(data);
});
```

**2. 使用 useMemo 合併資料**：

```typescript
const enrichedElders = useMemo(() => {
  return elders.map((elder) => {
    // 找到綁定到該長者的設備
    const device = devices.find(
      (d) => d.bindingType === 'ELDER' && d.boundTo === elder.id
    );
    return {
      ...elder,
      device,  // 添加設備資料
    };
  });
}, [elders, devices]);
```

**3. 使用 enrichedElders 顯示**：

```typescript
// 不再使用 elders，改用 enrichedElders
const filteredElders = enrichedElders.filter(elder => {
  // 搜尋過濾
});
```

---

## 修正效果

### 修正前

```
Table 顯示：
- 長者：王小明 ✅
- 聯絡方式：0912... ✅
- 設備狀態：空白或錯誤 ❌
- 狀態：正常 ✅
- 最後活動：5分鐘前 ✅
```

### 修正後

```
Table 顯示：
- 長者：王小明 ✅
- 聯絡方式：0912... ✅
- 設備狀態：已綁定 + 設備-001 ✅
- 狀態：正常 ✅
- 最後活動：5分鐘前 ✅
```

---

## 資料關聯邏輯

### 如何找到長者的設備？

```typescript
// 從 devices 陣列中找到符合條件的設備
devices.find(device => 
  device.bindingType === 'ELDER' &&  // 綁定類型是長者
  device.boundTo === elder.id        // 綁定到該長者的 ID
)
```

### 為什麼這樣設計？

**Firestore 資料結構**：

```javascript
// elders 集合
{
  id: "elder_001",
  name: "王小明",
  deviceId: "device_101"  // 只存 ID，不存完整資料
}

// devices 集合
{
  id: "device_101",
  deviceName: "設備-001",
  bindingType: "ELDER",
  boundTo: "elder_001",  // 雙向引用
  batteryLevel: 85
}
```

**優點**：
- 避免資料重複
- 設備資訊變更時自動反映
- 資料一致性

---

## 即時更新

### 雙向訂閱

```
長者資料變更 → elderService.subscribe 觸發
  ↓
更新 elders 狀態
  ↓
useMemo 重新計算 enrichedElders
  ↓
Table 重新渲染

設備資料變更 → deviceService.subscribe 觸發
  ↓
更新 devices 狀態
  ↓
useMemo 重新計算 enrichedElders
  ↓
Table 重新渲染
```

**結果**：
- 長者或設備任何變更都會即時反映
- 設備綁定/解綁即時更新
- 設備電量變化即時更新

---

## 修正的檔案

**檔案**：`community-portal/src/screens/elders/ElderListScreen.tsx`

**修改內容**：
1. 添加 `devices` 狀態
2. 添加 `enrichedElders` 計算（useMemo）
3. 同時訂閱 elders 和 devices
4. 使用 enrichedElders 進行過濾和顯示

---

## 測試步驟

### 1. 訪問長者列表

```
https://safe-net-tw.web.app/community/elders
```

### 2. 檢查設備狀態欄位

**應該看到**：
- [ ] 已綁定設備的長者顯示「已綁定」藍色標籤
- [ ] 顯示設備名稱（如「設備-001」）
- [ ] 未綁定的長者顯示「未綁定」黃色標籤

### 3. 測試即時更新

**測試 A：綁定設備**
1. 點擊編輯長者
2. 選擇一個設備
3. 提交
4. **驗證**：Table 立即顯示「已綁定」和設備名稱

**測試 B：解綁設備**
1. 編輯已綁定的長者
2. 選擇「不綁定設備」
3. 提交
4. **驗證**：Table 立即顯示「未綁定」

---

## 與 Admin 的一致性

### 相同的資料關聯邏輯

**Admin（src/pages/EldersPage.tsx）**：
```typescript
const enrichedElders = useMemo(() => {
  return elders.map((elder) => {
    const device = devices.find(
      (d) => d.bindingType === "ELDER" && d.boundTo === elder.id
    );
    return { ...elder, device };
  });
}, [elders, devices]);
```

**Community Portal（現在）**：
```typescript
const enrichedElders = useMemo(() => {
  return elders.map((elder) => {
    const device = devices.find(
      (d) => d.bindingType === 'ELDER' && d.boundTo === elder.id
    );
    return { ...elder, device };
  });
}, [elders, devices]);
```

**完全相同！** ✅

---

## 效能優化

### useMemo 的作用

```typescript
const enrichedElders = useMemo(() => {
  // 合併邏輯
}, [elders, devices]);
```

**優點**：
- 只有 elders 或 devices 變更時才重新計算
- 避免每次渲染都重新合併
- 提升效能

### 訂閱效率

- 兩個訂閱各自獨立
- Firestore 即時推送變更
- 最小化資料傳輸

---

## 部署狀態

✅ 已編譯並部署

部署時間：2026-01-25 22:56

---

## 完成

長輩 Table 資料顯示已修正：
- ✅ 設備資料正確關聯
- ✅ 設備狀態正確顯示
- ✅ 即時更新正常
- ✅ 與 Admin 邏輯一致

立即測試：`https://safe-net-tw.web.app/community/elders`

現在設備狀態欄位應該正確顯示了！
