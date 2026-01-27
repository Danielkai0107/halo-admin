# 多社區架構說明

## 架構設計原則

### ✅ 正確的架構：一個 Line 用戶管理 = 一個 line_users 記錄

```
Line 用戶管理 (U123456789)
    ↓
line_users 記錄 (唯一，以 lineUserId 為鍵)
    ↓
多個 memberships（可以是多個社區的成員）
    ├─ 社區 A (tenants/tenant_a/members/member_1)
    ├─ 社區 B (tenants/tenant_b/members/member_2)
    └─ 社區 C (tenants/tenant_c/members/member_3)
```

### ❌ 錯誤的想法：一個 Line 用戶管理 = 多個 line_users 記錄

這是**不正確**的，因為：

1. LINE 的 `userId` 是全局唯一的
2. 同一個 LINE 帳號不管從哪裡進入，都是同一個 userId
3. 創建多個 line_users 記錄會造成資料重複和混亂

## 正確的多社區支援方式

### 資料結構

#### line_users 集合（唯一記錄）

```typescript
{
  id: "doc_123",              // Firestore 文檔 ID
  lineUserId: "U123456789",   // Line 用戶管理 ID（唯一）
  lineDisplayName: "王小明",
  linePictureUrl: "...",
  boundDeviceId: "device_001", // 當前綁定的設備
  joinedFromTenantId: "tenant_a", // 首次加入的社區
  lastAccessTenantId: "tenant_b", // 最後訪問的社區
}
```

#### tenants/{tenantId}/members 子集合（多個成員資格）

```typescript
// 社區 A 的成員
tenants/tenant_a/members/member_1 {
  appUserId: "doc_123",  // 指向 line_users 的文檔 ID
  role: "MEMBER",
  status: "APPROVED"
}

// 社區 B 的成員
tenants/tenant_b/members/member_2 {
  appUserId: "doc_123",  // 同一個用戶
  role: "MEMBER",
  status: "APPROVED"
}
```

### URL 參數區分機制

#### 社區 A 的連結

```
https://liff.line.me/2008889284-MuPboxSM/map?tenantId=tenant_a
```

**流程**：

1. 用戶從社區 A 的 LINE Bot 點擊連結
2. LIFF 讀取 URL 參數：`tenantId=tenant_a`
3. 更新 `line_users.lastAccessTenantId = tenant_a`
4. App.tsx 自動選擇社區 A
5. 顯示社區 A 的資料（Gateway、長者等）

#### 社區 B 的連結

```
https://liff.line.me/2008889284-MuPboxSM/map?tenantId=tenant_b
```

**流程**：

1. 同一用戶從社區 B 的 LINE Bot 點擊連結
2. LIFF 讀取 URL 參數：`tenantId=tenant_b`
3. 更新 `line_users.lastAccessTenantId = tenant_b`
4. App.tsx 自動選擇社區 B
5. 顯示社區 B 的資料

## 優先級邏輯

### 社區選擇優先級（從高到低）

```
1. URL 參數的 tenantId（最高優先級）
   ↓ 如果沒有或用戶不是該社區成員
2. 只有一個成員資格 → 自動選擇
   ↓ 如果有多個成員資格
3. 顯示社區選擇畫面
```

### 代碼實作位置

**App.tsx（統一處理）**：

```typescript
useEffect(() => {
  // 1. 優先使用 URL 的 tenantId
  const urlTenantId = urlParams.get("tenantId");
  if (urlTenantId) {
    const membership = memberships.find((m) => m.tenantId === urlTenantId);
    if (membership) {
      selectTenant(membership.tenant); // 選擇 URL 指定的社區
      return;
    }
  }

  // 2. 如果只有一個成員資格，自動選擇
  if (memberships.length === 1) {
    selectTenant(memberships[0].tenant);
  }

  // 3. 多個成員資格且沒有 URL 參數 → 顯示選擇畫面
}, [memberships]);
```

## 🎯 實際應用場景

### 場景 1：用戶只加入社區 A

```
從任何連結進入 → 自動選擇社區 A → 顯示社區 A 的資料
```

### 場景 2：用戶加入社區 A 和 B

```
從社區 A 連結進入（?tenantId=tenant_a）
  → 自動選擇社區 A
  → 顯示社區 A 的 Gateway、長者等

從社區 B 連結進入（?tenantId=tenant_b）
  → 自動選擇社區 B
  → 顯示社區 B 的 Gateway、長者等
```

### 場景 3：用戶加入多個社區，沒有 URL 參數

```
直接訪問 https://liff.line.me/2008889284-MuPboxSM/map
  → 顯示社區選擇畫面
  → 用戶手動選擇社區
```

## 🔧 Admin 後台功能

### 複製連結功能

在「Line OA 管理」頁面：

1. 點擊社區旁的 🔗 圖標
2. 顯示彈窗，包含兩種連結：
   - 📋 長者管理頁面：`/elders?tenantId={社區ID}`
   - 🗺️ 地圖頁面：`/map?tenantId={社區ID}`
3. 一鍵複製連結
4. 設定到 LINE 圖文選單

### 使用範例

**社區 A 的圖文選單**：

```
按鈕 1: 長者管理
URL: https://liff.line.me/2008889284-MuPboxSM/elders?tenantId=tenant_a

按鈕 2: 地圖
URL: https://liff.line.me/2008889284-MuPboxSM/map?tenantId=tenant_a
```

**社區 B 的圖文選單**：

```
按鈕 1: 長者管理
URL: https://liff.line.me/2008889284-MuPboxSM/elders?tenantId=tenant_b

按鈕 2: 地圖
URL: https://liff.line.me/2008889284-MuPboxSM/map?tenantId=tenant_b
```

## 📊 資料追蹤

### line_users 記錄

```typescript
{
  lineUserId: "U123456789",      // LINE ID（唯一不變）
  joinedFromTenantId: "tenant_a", // 首次加入的社區
  lastAccessTenantId: "tenant_b", // 最後訪問的社區（會變化）
  boundDeviceId: "device_001"     // 當前綁定的設備（全局）
}
```

### 設備綁定邏輯

- 一個 Line 用戶管理只能綁定一個設備（全局）
- 不區分社區
- 設備的 `inheritedNotificationPointIds` 可以包含多個社區的 Gateway

## 🎉 優點

1. **資料一致性**：一個 Line 用戶管理只有一個記錄
2. **靈活性**：支援用戶在多個社區間切換
3. **可追蹤性**：記錄用戶的來源和訪問歷史
4. **簡單性**：不需要為每個社區創建獨立的用戶系統

## ⚠️ 注意事項

### 設備綁定的全局性

- 用戶綁定的設備是**全局**的，不區分社區
- 如果需要不同社區綁定不同設備，需要額外的邏輯
- 目前設計：一人一設備（跨所有社區）

### 通知點的獨立性

- 每個設備的 `inheritedNotificationPointIds` 是**獨立**的
- 可以包含多個社區的 Gateway
- 用戶可以設定來自不同社區的通知點

## ✅ 已修復

現在 URL 參數有**最高優先級**：

1. ✅ 從 URL 讀取 tenantId
2. ✅ 自動選擇對應的社區
3. ✅ 只顯示該社區的資料
4. ✅ 支援用戶在多個社區間切換
5. ✅ Admin 後台可以複製帶 tenantId 的連結

## 🔗 測試連結

### 社區 A（大愛社區）

```
長者頁面：https://liff.line.me/2008889284-MuPboxSM/elders?tenantId=tenant_dalove_001
地圖頁面：https://liff.line.me/2008889284-MuPboxSM/map?tenantId=tenant_dalove_001
```

### 社區 B

```
長者頁面：https://liff.line.me/2008889284-MuPboxSM/elders?tenantId=tenant_b_001
地圖頁面：https://liff.line.me/2008889284-MuPboxSM/map?tenantId=tenant_b_001
```

現在用戶從不同社區的 LINE Bot 進入，會自動顯示對應社區的資料！
