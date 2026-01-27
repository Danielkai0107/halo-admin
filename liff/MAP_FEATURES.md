# LIFF 地圖頁面功能說明

## 🗺️ 功能概述

已成功整合 Google Maps API 並實現從 Firebase 即時讀取 Gateway 資料的地圖頁面。

## ✅ 已實現功能

### 1. Google Maps 整合
- ✅ 使用 Google Maps JavaScript API
- ✅ API Key: `AIzaSyCdFLTXzYPQlYeBxZWaboqWYTJRDNsKydo`
- ✅ 支援 Places 圖書館
- ✅ 非同步載入 (`loading=async`)
- ✅ **預設定位到當前位置**
- ✅ 自動請求定位權限
- ✅ 顯示藍色圓點標記當前位置

### 2. Firebase 資料讀取
- ✅ 即時訂閱 Gateway 資料
- ✅ 自動過濾啟用的 Gateway (`isActive: true`)
- ✅ 依據社區過濾 Gateway
- ✅ 自動載入長者資料

### 3. 地圖標記

#### Gateway 標記
每個 Gateway 根據類型顯示不同顏色的圖標：

- 🟦 **SAFE_ZONE** (安全區域): 藍綠色 `#4ECDC4`
  - 圖標：定位標記
  
- 🔴 **SCHOOL_ZONE** (學校區域): 粉紅色 `#FF6A95`
  - 圖標：學校建築
  
- 🟣 **OBSERVE_ZONE** (觀察區域): 青色 `#00CCEA`
  - 圖標：眼睛/觀察
  
- ⚪ **INACTIVE** (未啟用): 灰色 `#C4C4C4`
  - 圖標：定位標記

所有標記：
- 圓形背景 (直徑 40px)
- 白色邊框 (3px)
- 陰影效果
- 可點擊查看詳情

#### 長者位置標記
- 🟡 使用長者頭像（如果有）或預設頭像圖標
- 黃色背景 `#FFC107`
- 較大尺寸 (56x56px)
- 白色邊框 (4px)

### 4. 互動功能

- **點擊 Gateway 標記**：顯示接收點詳情（名稱、位置、類型、序號）
- **定位按鈕**：定位到長者最後位置
- **刷新按鈕**：調整地圖視角顯示所有標記
- **時間軸點擊**：定位到對應的 Gateway 位置
- **底部彈窗**：可拖曳展開/收合的時間軸

### 5. 響應式設計
- ✅ 手機優化
- ✅ 觸摸手勢支持
- ✅ 流暢動畫
- ✅ 防止滾動衝突

## 📂 檔案結構

```
liff/src/
├── screens/map/
│   └── MapScreen.tsx              (主地圖頁面)
├── components/map/
│   ├── BottomSheet.tsx            (底部彈窗)
│   ├── Modal.tsx                  (模態對話框)
│   └── TimelineItem.tsx           (時間軸項目)
├── hooks/
│   ├── useGoogleMap.ts            (Google Maps 初始化)
│   └── useMapMarkers.ts           (地圖標記管理)
├── services/
│   ├── gatewayService.ts          (Gateway 資料服務)
│   └── elderService.ts            (長者資料服務)
└── styles/
    └── map.scss                   (地圖樣式)
```

## 🔧 技術細節

### Gateway Service
```typescript
gatewayService.subscribeByTenant(tenantId, (gateways) => {
  // 自動接收 gateway 更新
  // 過濾條件：isActive === true
  // 社區過濾：tenantId 匹配或無 tenantId
});
```

### 地圖標記創建
- 使用 SVG Data URL 創建自定義圖標
- 動態顏色和圖標路徑
- 優化性能（`optimized: false` 以支持 SVG）

### 觸摸事件優化
- CSS `touch-action` 屬性處理手勢
- 移除被動監聽器中的 `preventDefault()`
- 避免瀏覽器警告

## 🌐 部署資訊

- **網址**: https://safe-net-tw.web.app/liff/map
- **Firebase 專案**: safe-net-tw
- **部署指令**: `npm run build:liff && firebase deploy --only hosting`

## 📱 使用方式

1. 在 LINE 中打開 LIFF 應用
2. 選擇社區後自動載入該社區的 Gateway
3. 地圖會顯示所有 Gateway 位置
4. 點擊標記查看詳情
5. 使用底部時間軸查看活動記錄

## 🔄 即時更新

所有 Gateway 資料透過 Firebase Realtime Listener 即時更新：
- 新增 Gateway → 自動顯示在地圖
- 修改 Gateway → 標記位置/樣式自動更新
- 刪除 Gateway → 標記自動移除

## 🎨 樣式特點

- 圓形標記設計
- 顏色區分類型
- 白色邊框和陰影
- 符合手機觸控要求（最小 40x40px）
- 平滑動畫過渡

## 🚀 下一步優化建議

1. **標記聚合**：Gateway 數量多時使用 MarkerClusterer
2. **InfoWindow**：點擊標記顯示浮動資訊卡
3. **路線規劃**：顯示從當前位置到 Gateway 的路線
4. **即時追蹤**：顯示長者移動軌跡
5. **地圖樣式**：自定義地圖顏色主題
