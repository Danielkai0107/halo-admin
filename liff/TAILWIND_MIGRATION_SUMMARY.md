# LIFF 應用 Tailwind CSS 統一遷移總結

## 📋 完成事項

### 1. ✅ 統一使用 Tailwind CSS
所有頁面現在都使用 Tailwind CSS 進行樣式設計，確保視覺一致性。

### 2. ✅ 顏色系統統一
- 所有顏色統一使用 `_variables.scss` 中定義的顏色
- Tailwind 配置已更新以使用相同的顏色系統

### 3. ✅ 導覽列在所有頁面顯示
- 包括地圖頁面，TabBar 現在在所有頁面都可見
- 地圖高度已調整為 `calc(100vh - 65px)` 以容納 TabBar

### 4. ✅ 切版模式 (Mock Mode)
- 可以通過修改 `src/config/mockMode.ts` 中的 `MOCK_MODE` 輕鬆切換
- 包含 5 筆假資料用於 UI 開發

---

## 🎨 顏色配置

### 主要顏色（來自 _variables.scss）

```scss
$primary-color: #4ecdc4    // 青綠色
$secondary-color: #ffc107  // 黃色
$background-color: #f7f7f7 // 淺灰
$text-color: #2c3e50       // 深灰藍
$card-color: #ffffff       // 白色
$border-color: #e0e0e0     // 邊框灰
```

### Tailwind 顏色映射

```javascript
primary: {
  DEFAULT: '#4ecdc4',  // 主色
  500: '#4ecdc4',      // 按鈕預設色
  600: '#3db8b0',      // 按鈕按下色
}
```

---

## 📱 更新的頁面

### 1. 地圖頁面 (MapScreen.tsx)
- ✅ 移除外層容器
- ✅ 調整地圖高度以容納 TabBar
- ✅ 浮動按鈕和底部彈窗位置已調整
- ✅ z-index 層級正確設定

**關鍵樣式調整：**
- `.map-container`: `height: calc(100vh - 65px)`
- `.bottom-sheet`: `bottom: 65px` (在 TabBar 上方)
- `.floating-button`: `position: fixed`

### 2. 長輩管理頁面 (ElderListScreen.tsx)
使用完整的 Tailwind CSS：
- ✅ 頁面容器：`min-h-screen bg-gray-50 pb-20`
- ✅ 卡片樣式：`bg-white rounded-xl shadow-app-sm`
- ✅ 頭像：`rounded-full border-3 border-primary-500`
- ✅ 按鈕：`bg-primary-500 text-white rounded-xl`
- ✅ 狀態標籤：`rounded-full text-xs font-medium`

### 3. 新增長輩頁面 (AddElderScreen.tsx)
完整 Tailwind 表單：
- ✅ Sticky Header：`sticky top-0 z-10 bg-white`
- ✅ 表單區塊：分為 4 個區塊（基本資料、聯絡資訊、緊急聯絡人、其他設定）
- ✅ 輸入框：`focus:ring-2 focus:ring-primary-500`
- ✅ 提交按鈕：`bg-primary-600 rounded-xl active:scale-[0.98]`
- ✅ 載入動畫：`animate-spin`

### 4. 長輩詳情頁面 (ElderDetailScreen.tsx)
混合使用 Tailwind：
- ✅ 基本資料卡片：Tailwind
- ✅ 緊急聯絡人：Tailwind
- ✅ 設備資訊：Tailwind
- ✅ 最新位置：Tailwind 漸層背景 `bg-gradient-to-br from-primary-500 to-primary-600`
- ✅ 活動記錄：Tailwind + 自定義時間軸樣式
- ✅ 編輯表單：完整 Tailwind
- ✅ 刪除按鈕：Tailwind

### 5. 個人檔案頁面 (ProfileScreen.tsx)
- ✅ 已使用 Tailwind
- ✅ 更新陰影為 `shadow-app-sm`
- ✅ 容器添加 `min-h-screen bg-gray-50 pb-20`

### 6. Layout 組件 (Layout.tsx)
- ✅ 簡化結構
- ✅ 移除未使用的 `isMapPage` 判斷
- ✅ 統一容器：`min-h-screen bg-gray-50`

### 7. TabBar 組件 (TabBar.tsx)
- ✅ 固定在底部：`fixed bottom-0`
- ✅ 高層級：`z-[300]`
- ✅ 白色背景，灰色邊框
- ✅ 青綠色激活狀態

---

## 🎯 設計規範

### 間距
- 頁面內邊距：`p-4`
- 卡片間距：`space-y-4`
- 底部安全區：`pb-20` (為 TabBar 留空間)

### 圓角
- 卡片：`rounded-xl` (12px)
- 按鈕：`rounded-xl` (12px)
- 小元素：`rounded-lg` (8px)
- 圓形元素：`rounded-full`

### 陰影
- 小陰影：`shadow-app-sm` (卡片)
- 中陰影：`shadow-app-md` (按鈕)
- 大陰影：`shadow-app-lg` (浮動元素)

### 動畫
- 點擊縮放：`active:scale-[0.98]`
- 載入旋轉：`animate-spin`
- 過渡：`transition`

### 按鈕樣式
```html
<!-- 主要按鈕 -->
<button className="py-4 bg-primary-500 text-white rounded-xl font-semibold shadow-app-md active:scale-[0.98] transition">

<!-- 次要按鈕 -->
<button className="py-4 bg-white text-gray-700 rounded-xl font-semibold border-2 border-gray-300 active:scale-[0.98] transition">

<!-- 危險按鈕 -->
<button className="py-3 bg-red-600 text-white rounded-xl font-semibold active:scale-[0.98] transition">
```

### 輸入框樣式
```html
<input className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition" />
```

---

## 🔧 技術實現

### Tailwind 配置檔案
- `tailwind.config.cjs` - 主要配置
- `postcss.config.cjs` - PostCSS 設定
- `src/styles/tailwind.css` - Tailwind 指令
- `src/styles/_variables.scss` - SCSS 變數定義

### 引入順序 (main.tsx)
```typescript
import "./styles/tailwind.css";  // 1. Tailwind 基礎
import "./styles/main.scss";     // 2. 自定義 SCSS (覆蓋)
```

### 保留的 SCSS 樣式
地圖相關的特殊樣式仍使用 SCSS：
- `.map-container` - 地圖容器
- `.bottom-sheet` - 底部彈窗
- `.floating-button` - 浮動按鈕
- `.modal-overlay` - 對話框遮罩
- 地圖標記相關樣式

---

## 🎪 切版模式 (Mock Mode)

### 啟用切版模式
```typescript
// src/config/mockMode.ts
export const MOCK_MODE = true;
```

### 切換回正式模式
```typescript
export const MOCK_MODE = false;
```

### 假資料內容
- 5 筆長輩資料
- 3 筆活動記錄
- 3 個可用設備
- 完整的用戶和社區資訊

---

## 📐 響應式設計

### 固定元素層級
```
TabBar (z-300)
  ↓
Modal (z-1000)
  ↓
Bottom Sheet (z-200)
  ↓
Floating Buttons (z-100)
  ↓
Map Container (z-1)
```

### 高度計算
- 地圖容器：`calc(100vh - 65px)`
- 底部彈窗：`max-height: calc(100vh - 200px)`
- 頁面內容：`min-h-screen pb-20`

---

## 🚀 下一步

1. ✅ 所有頁面已使用 Tailwind CSS
2. ✅ 顏色系統已統一
3. ✅ 導覽列在所有頁面顯示
4. ✅ 切版模式已配置完成

### 可選優化
- 添加頁面切換動畫
- 優化載入狀態
- 添加更多假資料變化
- 添加錯誤處理提示

---

## 📝 維護指南

### 修改主色調
編輯 `src/styles/_variables.scss`：
```scss
$primary-color: #4ecdc4;  // 改這裡
```

然後同步更新 `tailwind.config.cjs`：
```javascript
primary: {
  500: '#4ecdc4',  // 改這裡
  600: '#3db8b0',  // 深一點的版本
}
```

### 添加新頁面
1. 使用 Tailwind CSS 類別
2. 容器使用：`min-h-screen bg-gray-50 pb-20`
3. 卡片使用：`bg-white rounded-xl shadow-app-sm p-4`
4. 按鈕使用：`bg-primary-500 text-white rounded-xl`

### 切換模式
只需修改一個參數：
```typescript
// src/config/mockMode.ts
export const MOCK_MODE = true;  // 切版模式
export const MOCK_MODE = false; // 正式模式
```

---

完成日期：2026-01-27
