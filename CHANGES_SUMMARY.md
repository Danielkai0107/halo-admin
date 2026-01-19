# 🔧 設計修正總結

## 修正內容

根據您的使用邏輯，我已完成以下修正：

### 1. ✅ 設備管理 - UUID 為主要識別碼

#### 修正前：
- ❌ 使用 MAC Address 作為主要識別
- ❌ UUID 為選填欄位

#### 修正後：
- ✅ **UUID 為必填欄位**（主要判定指標）
- ✅ MAC Address 改為選填（輔助識別）
- ✅ 列表顯示 UUID 為主，MAC 為輔
- ✅ 新增 `getByUuid()` 方法作為主要查詢

**檔案變更：**
- `src/services/deviceService.ts` - 新增 UUID 查詢方法
- `src/pages/DevicesPage.tsx` - 表單和列表改為 UUID 優先

### 2. ✅ 設備流程 - 三階段管理

#### 修正前：
- ❌ 設備創建時可直接綁定長者

#### 修正後：
```
階段 1: 設備登記（設備池）
  └─ tenantId: null
  └─ elderId: null

階段 2: 社區分配
  └─ tenantId: xxx
  └─ elderId: null

階段 3: 長者綁定
  └─ tenantId: xxx
  └─ elderId: yyy
```

**新增方法：**
- `deviceService.getUnassignedDevices()` - 查詢設備池
- `deviceService.getAvailableDevicesInTenant(tenantId)` - 查詢社區可用設備

### 3. ✅ 閘道器（接收點）- 社區分配功能

#### 修正前：
- ❌ 閘道器無法被分配到社區

#### 修正後：
- ✅ 閘道器創建時 `tenantId: null`（進入閘道器池）
- ✅ 可通過社區管理分配到社區
- ✅ 支援閘道器池查詢

**新增方法：**
- `gatewayService.getUnassignedGateways()` - 查詢閘道器池
- `tenantService.assignGateways(tenantId, gatewayIds)` - 分配閘道器到社區
- `tenantService.getGateways(tenantId)` - 獲取社區的閘道器
- `tenantService.removeGateway(tenantId, gatewayId)` - 移除閘道器

## 📋 完整工作流程

### 設備管理流程

```
1. 設備登記（設備管理頁面）
   ├─ 填寫 UUID *（必填，主要識別碼）
   ├─ 填寫 MAC Address（選填，輔助識別）
   ├─ 填寫設備資訊
   └─ 進入「設備池」（tenantId: null）

2. 社區分配（社區管理頁面）
   ├─ 選擇社區
   ├─ 點擊「設備管理」圖示
   ├─ 從設備池選擇設備
   └─ 分配到社區（tenantId: xxx）

3. 長者綁定（長者管理頁面）
   ├─ 選擇/創建長者
   ├─ 選擇所屬社區
   ├─ 從該社區可用設備中選擇
   └─ 綁定設備（elderId: yyy）
```

### 閘道器管理流程

```
1. 接收點登記（閘道器管理頁面）
   ├─ 填寫序號、名稱
   ├─ 選擇類型（一般/邊界/移動）
   ├─ 填寫位置資訊
   └─ 進入「閘道器池」（tenantId: null）

2. 社區分配（社區管理頁面）
   ├─ 選擇社區
   ├─ 點擊「閘道器管理」圖示（待實作）
   ├─ 從閘道器池選擇
   └─ 分配到社區（tenantId: xxx）
```

## 🎯 資料狀態流轉

### 設備狀態

| 狀態 | tenantId | elderId | 顯示位置 | 說明 |
|------|----------|---------|----------|------|
| 設備池 | null | null | 🔵 設備池 | 剛登記的設備 |
| 社區設備 | xxx | null | 社區名稱 | 已分配到社區 |
| 長者設備 | xxx | yyy | 社區名稱 + 長者名稱 | 正在使用中 |

### 閘道器狀態

| 狀態 | tenantId | 顯示位置 | 說明 |
|------|----------|----------|------|
| 閘道器池 | null | 🔵 閘道器池 | 剛登記的閘道器 |
| 社區閘道器 | xxx | 社區名稱 | 已分配到社區 |

## 🔍 查詢方法對照表

### 設備查詢

| 方法 | 用途 | 條件 |
|------|------|------|
| `getByUuid(uuid)` | UUID 查詢（主要） | uuid == xxx |
| `getByMacAddress(mac)` | MAC 查詢（輔助） | macAddress == xxx |
| `getUnassignedDevices()` | 設備池 | tenantId == null |
| `getAvailableDevicesInTenant(id)` | 社區可用設備 | tenantId == xxx AND elderId == null |

### 閘道器查詢

| 方法 | 用途 | 條件 |
|------|------|------|
| `getUnassignedGateways()` | 閘道器池 | tenantId == null |
| `tenantService.getGateways(id)` | 社區閘道器 | tenantId == xxx |

## 📝 UI 變更

### 設備管理頁面

**表單變更：**
- ✅ UUID 改為必填欄位（第一順位）
- ✅ MAC Address 改為選填（輔助識別）
- ✅ 提示文字更新

**列表變更：**
- ✅ 表頭：UUID（主要識別）
- ✅ 新增「社區」欄位
- ✅ 顯示：UUID（大字）+ MAC（小字）
- ✅ 狀態顯示：🔵 設備池 / 社區名稱 / 長者名稱

**提示訊息：**
```
工作流程：
先登記設備（設備池） → 
前往「社區管理」分配到社區 → 
再到「長者管理」綁定給長者
```

### 社區管理頁面（待實作 UI）

**需要新增：**
- 📱 設備分配彈窗（已有後端支援）
- 📡 閘道器分配彈窗（後端已完成）

## ⚠️ 待實作項目

### 1. 社區管理頁面 UI

需要在 `TenantsPage.tsx` 添加：

```tsx
// 閘道器分配彈窗（類似 DeviceAssignmentModal）
<GatewayAssignmentModal
  tenantId={tenantId}
  tenantName={tenantName}
  onSuccess={() => {}}
/>
```

### 2. 設備分配彈窗優化

`DeviceAssignmentModal.tsx` 需要：
- 顯示設備的 UUID（而非 MAC）
- 從設備池（`deviceService.getUnassignedDevices()`）獲取設備

### 3. 長者管理優化

`EldersPage.tsx` 需要：
- 使用 `deviceService.getAvailableDevicesInTenant(tenantId)` 獲取可用設備
- 顯示設備的 UUID

## 🎉 修正完成

所有核心邏輯已修正完成：

✅ UUID 為主要判定指標  
✅ 設備三階段管理（設備池 → 社區 → 長者）  
✅ 閘道器可分配到社區  
✅ 資料流程符合使用邏輯  

## 📚 相關文件

- `WORKFLOW.md` - 完整工作流程說明
- `FIREBASE_SETUP.md` - Firebase 設置指南
- `MIGRATION_SUMMARY.md` - 技術架構說明

---

**修正日期：** 2026-01-17  
**修正內容：** UUID 為主要識別碼 + 三階段資源管理 + 閘道器社區分配
