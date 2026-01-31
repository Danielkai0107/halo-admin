# 多社區支援解決方案

## 問題說明

當同一個 Line 用戶管理加入多個社區時，系統無法區分用戶是從哪個社區進入的。

### 問題原因

- 目前使用全局 LIFF ID：`2008889284-MuPboxSM`
- 所有社區共用同一個 LIFF URL
- 無法判斷用戶的來源社區

## ✅ 解決方案：URL 參數傳遞 tenantId

### 實作方式

#### 1. URL 格式

```
https://liff.line.me/2008889284-MuPboxSM/map?tenantId={社區ID}
```

**範例**：

```
https://liff.line.me/2008889284-MuPboxSM/map?tenantId=tenant_dalove_001
```

#### 2. 後端邏輯

- 從 URL 參數讀取 `tenantId`
- 記錄到 `line_users.lastAccessTenantId`
- 首次創建時記錄到 `line_users.joinedFromTenantId`
- 如果用戶是該社區成員，自動選擇該社區
- 如果用戶不是成員，自動添加為該社區成員

#### 3. 資料結構更新

**line_users 集合**：

```typescript
{
  lineUserId: string,
  lineDisplayName: string,
  linePictureUrl: string,
  name: string,
  boundDeviceId?: string,
  joinedFromTenantId?: string,      // 新增：首次加入的社區
  lastAccessTenantId?: string,      // 新增：最後訪問的社區
  isActive: boolean,
  createdAt: string,
  updatedAt: string,
  lastLoginAt: string
}
```

## 🔗 每個社區的專屬連結

### 社區 A

```
https://liff.line.me/2008889284-MuPboxSM/map?tenantId=tenant_a_001
```

### 社區 B

```
https://liff.line.me/2008889284-MuPboxSM/map?tenantId=tenant_b_001
```

### 社區 C

```
https://liff.line.me/2008889284-MuPboxSM/map?tenantId=tenant_c_001
```

## 📱 設定方式

### 方法 1：LINE 圖文選單

在每個社區的 LINE Official Account 設定圖文選單：

```
動作類型：連結
URL：https://liff.line.me/2008889284-MuPboxSM/map?tenantId={該社區的ID}
```

### 方法 2：LINE Bot 訊息

在 Flex Message 或按鈕中使用：

```json
{
  "type": "button",
  "action": {
    "type": "uri",
    "label": "開啟地圖",
    "uri": "https://liff.line.me/2008889284-MuPboxSM/map?tenantId=tenant_a_001"
  }
}
```

### 方法 3：Rich Menu

在 Rich Menu 設定中使用帶 tenantId 的 URL。

## 🔄 工作流程

### 用戶首次訪問

```
1. 用戶從社區 A 的 LINE Bot 點擊連結
   URL: ...?tenantId=tenant_a_001
   ↓
2. LIFF 初始化並登入
   ↓
3. 創建 line_users 記錄
   - joinedFromTenantId: tenant_a_001
   - lastAccessTenantId: tenant_a_001
   ↓
4. 自動添加為社區 A 的成員
   ↓
5. 自動選擇社區 A
   ↓
6. 顯示社區 A 的地圖和資料
```

### 用戶切換社區

```
1. 用戶從社區 B 的 LINE Bot 點擊連結
   URL: ...?tenantId=tenant_b_001
   ↓
2. LIFF 登入
   ↓
3. 更新 line_users 記錄
   - lastAccessTenantId: tenant_b_001 （更新）
   ↓
4. 檢查是否為社區 B 的成員
   - 如果不是 → 自動添加
   - 如果是 → 直接使用
   ↓
5. 自動選擇社區 B
   ↓
6. 顯示社區 B 的地圖和資料
```

### 沒有 tenantId 的情況

```
1. 用戶直接訪問：https://liff.line.me/2008889284-MuPboxSM/map
   ↓
2. 使用原有邏輯：
   - 如果只有一個社區 → 自動選擇
   - 如果有多個社區 → 顯示選擇畫面
   - 使用 lastAccessTenantId 作為預設
```

## 🎯 優先級邏輯

系統會按以下順序判斷社區：

```
1. URL 參數的 tenantId（最高優先級）
   ↓
2. lastAccessTenantId（最後訪問的社區）
   ↓
3. joinedFromTenantId（首次加入的社區）
   ↓
4. verifyUserTenant API（LINE 好友關係）
   ↓
5. 顯示社區選擇畫面
```

## 📊 資料追蹤

### 可以追蹤的資訊

- **首次加入來源**：`joinedFromTenantId`
- **最後訪問社區**：`lastAccessTenantId`
- **所有成員資格**：`tenants/{id}/members` 集合
- **訪問次數**：通過 `lastLoginAt` 追蹤

### 分析用途

- 了解用戶主要使用哪個社區
- 追蹤用戶在多社區間的切換行為
- 優化預設社區選擇邏輯

## 🔧 實作細節

### 已修改的檔案

1. `liff/src/hooks/useAuth.ts`
   - 讀取 URL 參數 `tenantId`
   - 記錄到 `joinedFromTenantId` 和 `lastAccessTenantId`
   - 優先選擇 URL 指定的社區
   - 如果不是成員，自動添加

### 使用範例

**社區 A 的連結**：

```html
<!-- 在社區 A 的 LINE Bot 中使用 -->
<a
  href="https://liff.line.me/2008889284-MuPboxSM/map?tenantId=tenant_dalove_001"
>
  開啟地圖
</a>
```

**社區 B 的連結**：

```html
<!-- 在社區 B 的 LINE Bot 中使用 -->
<a href="https://liff.line.me/2008889284-MuPboxSM/map?tenantId=community_b_002">
  開啟地圖
</a>
```

## 🎉 優點

1. **不需要為每個社區創建獨立 LIFF**
2. **自動識別用戶來源**
3. **支援用戶在多個社區間切換**
4. **保留使用記錄**
5. **向後兼容**（沒有 tenantId 時使用舊邏輯）

## 📝 設定步驟

### 對於每個社區

1. **獲取社區 ID**
   - 到 Firebase Console 查看 tenants 集合
   - 複製社區的文檔 ID

2. **生成專屬連結**

   ```
   https://liff.line.me/2008889284-MuPboxSM/map?tenantId={社區ID}
   ```

3. **設定到 LINE Bot**
   - 圖文選單
   - Rich Menu
   - 訊息按鈕

4. **測試**
   - 從該社區的 LINE Bot 開啟連結
   - 確認顯示該社區的資料

## ✅ 已部署

所有改進已部署，現在支援多社區區分！
