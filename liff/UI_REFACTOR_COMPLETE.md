# LIFF 應用 UI 重構完成總結

## ✅ 完成的任務

### 1. 移除導覽列 (TabBar)
- ✅ 刪除 `TabBar.tsx` 組件
- ✅ 從 Layout 中移除 TabBar 引用
- ✅ 所有頁面不再顯示底部導覽列

### 2. 地圖頁面優化
- ✅ 地圖容器恢復全屏：`width: 100%`, `height: 100%`
- ✅ 底部彈窗 (bottom-sheet) 調整：
  - 位置：`bottom: 0` (底部對齊)
  - 預設狀態：只露出 header (120px)
  - 展開狀態：最大高度 85vh
  - Transform: `translateY(calc(100% - 120px))`

### 3. 添加 Navbar 到非地圖頁面
- ✅ 在 Layout 組件中添加條件 Navbar
- ✅ Navbar 只在非地圖頁顯示
- ✅ Navbar 居中顯示 Halo Logo
- ✅ Logo 高度：32px (`h-8`)
- ✅ Navbar 樣式：白色背景，帶陰影，sticky 定位

### 4. 移除個人檔案頁
- ✅ 刪除 `ProfileScreen.tsx`
- ✅ 從路由中移除 `/profile` 路徑
- ✅ 更新所有相關引用

### 5. 統一使用 Tailwind CSS
- ✅ 所有頁面使用 Tailwind CSS
- ✅ 顏色統一使用 `_variables.scss` 定義
- ✅ 主色調：`#4ecdc4` (青綠色)

---

## 📱 頁面結構

### 地圖頁面 (MapScreen)
```
┌──────────────────────┐
│   Google Maps        │ ← 全屏地圖
│                      │
│   ┌─ 浮動按鈕        │
│                      │
│ ┌──────────────────┐ │
│ │ Bottom Sheet     │ │ ← 預設只露出 120px header
│ │ (Header 可見)    │ │
│ └──────────────────┘ │
└──────────────────────┘
```

### 其他頁面 (長輩管理等)
```
┌──────────────────────┐
│ ┌──────────────────┐ │
│ │  Halo Logo       │ │ ← Sticky Navbar
│ └──────────────────┘ │
├──────────────────────┤
│                      │
│   頁面內容           │
│                      │
│                      │
└──────────────────────┘
```

---

## 🎨 樣式系統

### Tailwind 顏色配置
```javascript
primary: {
  500: '#4ecdc4',  // 主色
  600: '#3db8b0',  // 深色
}
```

### SCSS 變數 (_variables.scss)
```scss
$primary-color: #4ecdc4;      // 青綠色
$secondary-color: #ffc107;    // 黃色
$background-color: #f7f7f7;   // 淺灰
$text-color: #2c3e50;         // 深灰藍
$card-color: #ffffff;         // 白色
$border-color: #e0e0e0;       // 邊框灰
```

---

## 📄 更新的文件

### 組件
- ✅ `Layout.tsx` - 添加條件 Navbar，移除 TabBar
- ❌ `TabBar.tsx` - 已刪除

### 頁面
- ✅ `MapScreen.tsx` - 全屏地圖
- ✅ `ElderListScreen.tsx` - 完整 Tailwind
- ✅ `AddElderScreen.tsx` - 完整 Tailwind
- ✅ `ElderDetailScreen.tsx` - 完整 Tailwind
- ❌ `ProfileScreen.tsx` - 已刪除

### 配置
- ✅ `App.tsx` - 移除 profile 路由
- ✅ `main.scss` - 更新地圖和底部彈窗樣式
- ✅ `tailwind.config.cjs` - 使用 _variables.scss 顏色

---

## 🔧 關鍵樣式調整

### 地圖容器
```scss
.map-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;    // 全寬
  height: 100%;   // 全高
  z-index: 1;
}
```

### 底部彈窗
```scss
.bottom-sheet {
  position: fixed;
  bottom: 0;      // 底部對齊
  max-height: 85vh;
  
  // 預設只露出 header (120px)
  &:not(.expanded) {
    transform: translateY(calc(100% - 120px));
  }
  
  // 展開狀態
  &.expanded {
    transform: translateY(0);
  }
}
```

### Navbar（非地圖頁）
```jsx
<nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 shadow-sm">
  <div className="flex items-center justify-center">
    <img src={haloLogo} alt="Halo Logo" className="h-8" />
  </div>
</nav>
```

---

## 🚀 路由結構

### 可用路由
```
/liff/               → 重定向到 /map
/liff/map            → 地圖頁面（無 Navbar）
/liff/elders         → 長輩管理（有 Navbar）
/liff/elders/:id     → 長輩詳情（有 Navbar）
/liff/elders/add     → 新增長輩（有 Navbar）
```

### 已移除路由
```
❌ /liff/alerts      → 已移除
❌ /liff/profile     → 已移除
```

---

## 🎯 設計規範

### 頁面容器
```html
<!-- 地圖頁 -->
<>
  <div className="map-container">...</div>
  <BottomSheet>...</BottomSheet>
</>

<!-- 其他頁面 -->
<div className="min-h-screen bg-gray-50">
  <div className="p-4">
    <!-- 內容 -->
  </div>
</div>
```

### 卡片樣式
```html
<div className="bg-white rounded-xl shadow-app-sm p-4">
  <!-- 內容 -->
</div>
```

### 按鈕樣式
```html
<!-- 主要按鈕 -->
<button className="px-4 py-2.5 bg-primary-500 text-white rounded-xl font-semibold shadow-app-md active:scale-[0.98] transition">

<!-- 次要按鈕 -->
<button className="px-4 py-2.5 bg-white text-gray-700 rounded-xl font-semibold border-2 border-gray-300 active:scale-[0.98] transition">
```

---

## 📐 布局層級

```
地圖頁面層級：
- Map Container (z-1)
- Floating Buttons (z-100)
- Bottom Sheet (z-200)
- Modal Overlay (z-1000)

其他頁面層級：
- Navbar (z-50, sticky)
- 頁面內容
- Modal Overlay (z-1000)
```

---

## 🔄 切版模式

### 啟用
```typescript
// src/config/mockMode.ts
export const MOCK_MODE = true;
```

### 假資料內容
- 5 筆長輩資料
- 3 筆活動記錄（每個長輩）
- 3 個可用設備
- 完整的位置資訊

---

## 📝 使用說明

### 查看地圖頁面
訪問 `http://localhost:3001/liff/map`
- 全屏地圖顯示
- 無 Navbar
- 底部彈窗預設只露出 header
- 向上拖動展開完整資訊

### 查看長輩管理
訪問 `http://localhost:3001/liff/elders`
- 頂部顯示 Halo Logo
- 列表顯示 5 筆假資料
- 卡片式設計
- 點擊進入詳情

### 開發流程
1. 設定 `MOCK_MODE = true`
2. 啟動開發伺服器：`npm run dev`
3. 查看 UI 效果
4. 調整樣式
5. 完成後設定 `MOCK_MODE = false`
6. 測試真實資料

---

## ✨ 視覺效果

### 統一配色
- 主色：青綠色 `#4ecdc4`
- 次要色：黃色 `#ffc107`
- 背景：淺灰 `#f7f7f7`

### 統一動畫
- 按鈕點擊：`active:scale-[0.98]`
- 卡片點擊：`active:scale-[0.98]`
- 載入動畫：`animate-spin`
- 彈窗動畫：`cubic-bezier(0.4, 0, 0.2, 1)`

### 統一圓角
- 卡片：`rounded-xl` (12px)
- 按鈕：`rounded-xl` (12px)
- 輸入框：`rounded-lg` (8px)

---

完成時間：2026-01-27
狀態：✅ 所有功能正常，構建成功
