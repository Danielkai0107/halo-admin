# Google Places API 整合說明

## 📋 功能概述

在接收點管理的新增/編輯表單中整合了 **Google Places Autocomplete**，讓管理員可以透過搜尋地點來自動填入接收點的名稱和經緯度座標。

**更新日期:** 2026-01-21  
**版本:** 1.2.0

---

## 🆕 新功能

### 1. 地點自動完成搜尋

- 在「名稱」欄位使用 Google Places Autocomplete
- 輸入地點名稱時會顯示建議清單
- 搜尋範圍限制在**台灣**
- 支援各種地點類型（建築物、地標、商家等）

### 2. 自動填入座標

選擇地點後會自動執行：

- ✅ 填入**名稱**欄位
- ✅ 填入**緯度**（latitude）
- ✅ 填入**經度**（longitude）

### 3. 視覺提示

- 經緯度欄位使用**綠色背景**，表示會自動填入
- 顯示「✓ 選擇地點後自動填入」提示文字
- 搜尋框有使用說明文字

---

## 🔧 技術實作

### 使用的套件

```json
{
  "@react-google-maps/api": "^2.19.3"
}
```

### API Key

**Google Maps Platform API Key:**  
`AIzaSyCdFLTXzYPQlYeBxZWaboqWYTJRDNsKydo`

**啟用的 API:**

- Places API
- Maps JavaScript API

### 元件結構

```
src/
├── components/
│   └── PlaceAutocomplete.tsx    # Google Places 自動完成元件
└── pages/
    └── GatewaysPage.tsx          # 接收點管理頁面
```

---

## 使用方式

### 新增接收點

1. 點擊「新增接收點」按鈕
2. 在「搜尋地點」欄位輸入地點名稱（例如：台北101、某某社區大門）
3. 從下拉選單選擇正確的地點
4. 系統會自動填入：
   - 名稱
   - 緯度
   - 經度
5. 填寫其他必要欄位（序列號、MAC Address 等）
6. 點擊「新增」完成

### 編輯接收點

1. 點擊接收點列表中的「編輯」按鈕
2. 修改「搜尋地點」欄位
3. 重新選擇地點後座標會自動更新
4. 點擊「更新」儲存變更

### 搜尋提示

**建議的搜尋方式:**

- ✅ 使用完整地址：「台北市信義區信義路五段7號」
- ✅ 使用地標名稱：「台北101」
- ✅ 使用商家名稱：「全家便利商店 信義店」
- ✅ 使用社區名稱：「大安國宅社區」

**避免:**

- ❌ 只輸入縣市名稱（太籠統）
- ❌ 使用簡稱或縮寫

---

## 🎨 UI 設計

### 表單欄位配置

```
┌─────────────────────────────────────────┐
│ 搜尋地點 *                              │
│ ┌─────────────────────────────────────┐ │
│ │ [搜尋框 - Google Places]            │ │
│ └─────────────────────────────────────┘ │
│  使用 Google 地點搜尋，選擇後會自動  │
│    帶入經緯度                           │
└─────────────────────────────────────────┘

┌────────────────┬────────────────────────┐
│ 緯度（固定式） │ 經度（固定式）         │
│ ┌────────────┐ │ ┌──────────────────┐ │
│ │ [自動填入] │ │ │ [自動填入]       │ │
│ └────────────┘ │ └──────────────────┘ │
│ ✓ 選擇地點後   │ ✓ 選擇地點後自動填入 │
│   自動填入     │                       │
└────────────────┴────────────────────────┘
```

### 顏色規範

- **搜尋框**: 預設白色背景
- **經緯度欄位**: 綠色背景（`bg-green-50`）表示自動填入
- **提示文字**: 藍色（`text-blue-600`）和綠色（`text-green-600`）

---

## 🔐 安全性考量

### API Key 保護

**目前狀態:**

- API Key 寫在前端程式碼中
- 建議透過 Firebase Console 設定 API Key 限制：
  - HTTP referrer 限制（只允許您的網域）
  - API 限制（只允許 Places API 和 Maps JavaScript API）

**建議設定:**

```
HTTP referrer:
- https://safe-net-tw.web.app/*
- https://safe-net-tw.firebaseapp.com/*
- http://localhost:* (開發環境)
```

### 成本控制

**Google Places API 計費:**

- Autocomplete (per session): $0.00 - $0.017 per session
- Place Details: $0.017 per request

**建議措施:**

- 在 Google Cloud Console 設定每日配額
- 監控 API 使用量
- 設定預算警報

---

## 📊 PlaceAutocomplete 元件說明

### Props 介面

```typescript
interface PlaceAutocompleteProps {
  value: string; // 目前的輸入值
  onChange: (value: string) => void; // 輸入變更時的回呼
  onPlaceSelected: (place: {
    // 選擇地點後的回呼
    name: string;
    lat: number;
    lng: number;
  }) => void;
  placeholder?: string; // 佔位符文字
  className?: string; // CSS 類別
}
```

### 設定選項

```typescript
options={{
  componentRestrictions: { country: "tw" }, // 限制搜尋範圍在台灣
  fields: ["name", "formatted_address", "geometry"], // 只取得需要的欄位
}}
```

---

## 🐛 常見問題

### Q1: 搜尋不到地點？

**解決方法:**

- 確認 Google Places API 已啟用
- 檢查 API Key 是否有效
- 確認網域已加入 HTTP referrer 白名單

### Q2: 選擇地點後座標沒有自動填入？

**檢查項目:**

- 打開瀏覽器 Console，查看是否有錯誤訊息
- 確認 `handlePlaceSelected` 函數有被正確呼叫
- 檢查 `setValue` 是否正確綁定到表單欄位

### Q3: 只支援台灣嗎？

是的，目前設定為只搜尋台灣地點。如需修改：

```typescript
// src/components/PlaceAutocomplete.tsx
options={{
  componentRestrictions: { country: "tw" }, // 改為其他國家代碼或移除此行
  fields: ["name", "formatted_address", "geometry"],
}}
```

### Q4: 移動接收點需要使用地點搜尋嗎？

不需要。移動接收點（志工手機）的 GPS 座標會隨志工移動自動記錄，表單中已自動隱藏經緯度欄位。

---

## 🚀 部署狀態

### ✅ 已完成

- [x] Google Places API 整合
- [x] PlaceAutocomplete 元件開發
- [x] GatewaysPage 表單更新
- [x] 自動填入經緯度功能
- [x] 建置和部署成功

### 🌐 線上環境

**Admin 管理後台:**  
`https://safe-net-tw.web.app`

**測試路徑:**  
`https://safe-net-tw.web.app` → 登入 → 接收點管理 → 新增接收點

---

## 📝 未來改進

### 短期

- [ ] 加入地圖預覽功能
- [ ] 顯示選擇的地點詳細資訊
- [ ] 支援手動調整座標（拖曳地圖標記）

### 中期

- [ ] 記錄常用地點（快速選擇）
- [ ] 批次匯入地點功能
- [ ] 地點分類標籤

### 長期

- [ ] 整合 Google Maps 互動式地圖
- [ ] 地點群組管理
- [ ] 路線規劃功能

---

## 📞 技術支援

如有問題或建議，請聯繫開發團隊。

**專案:** safe-net-tw  
**更新日期:** 2026-01-21  
**版本:** 1.2.0
