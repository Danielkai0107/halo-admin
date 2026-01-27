# Community Portal 最終版本說明

## 專案完成 ✅

**完成日期**：2026-01-25  
**部署狀態**：已上線  
**生產環境**：https://safe-net-tw.web.app/community

---

## 完整功能列表

### 認證系統

- ✅ Email/密碼登入
- ✅ saas_users 集合（獨立於 appUsers）
- ✅ 認證狀態隔離（不會與 Admin 互相登出）
- ✅ 權限控制（ADMIN/MEMBER）

### 長者管理

- ✅ 查看長者列表（即時訂閱）
- ✅ **新增長者（Popup Modal）**
- ✅ **新增時選擇設備綁定**
- ✅ **快速編輯（卡片懸停）**
- ✅ **完整編輯（Modal）**
- ✅ **編輯時變更設備綁定**
- ✅ 查看長者詳情
- ✅ **查看設備足跡**
- ✅ 刪除長者

### 設備清單

- ✅ 查看社區設備（根據 tags 篩選）
- ✅ 顯示綁定狀態
- ✅ 顯示電池、信號
- ✅ 篩選器（全部/已綁定/未綁定）

### 通知記錄

- ✅ 查看 LINE 通知歷史
- ✅ 日期範圍篩選
- ✅ 按長者篩選
- ✅ 顯示通知詳情

### 通知點管理

- ✅ 顯示所有系統 gateways
- ✅ 勾選加入社區通知點
- ✅ 設定自訂通知訊息
- ✅ 啟用/停用通知點
- ✅ 即時更新

---

## 操作流程

### 新增長者並綁定設備

```
1. 長者列表 → 點擊「新增長者」
   ↓
2. Modal 開啟
   ↓
3. 填寫資料：
   - 姓名、性別、年齡等
   - 選擇設備（可用設備下拉選單）
   ↓
4. 點擊「新增」
   ↓
5. 完成！
   - Modal 關閉
   - 長者出現在列表
   - 設備已自動綁定
```

### 快速編輯長者

```
方式 A（推薦）：
1. 滑鼠移到長者卡片
2. 右上角出現編輯圖示
3. 點擊 → Modal 開啟
4. 修改資料（包括變更設備）
5. 提交 → 完成

方式 B：
1. 點擊長者 → 詳情頁面
2. 點擊「編輯」按鈕
3. Modal 開啟
4. 修改資料
5. 提交 → 完成
```

### 查看長者足跡

```
1. 點擊長者卡片
   ↓
2. 進入詳情頁面
   ↓
3. 向下滾動到「設備足跡」
   ↓
4. 選擇時間範圍（預設 24 小時）
   ↓
5. 查看活動記錄
   - 位置、時間、信號
   - 是否觸發通知
   - 點擊地圖連結
```

---

## 系統架構

### 三個系統

```
┌────────────────────┐
│ Admin 管理後台      │
│ users 集合          │
│ SUPER_ADMIN        │
│                    │
│ 功能：              │
│ - 管理所有社區      │
│ - 建立 SaaS 用戶   │
│ - 管理 Gateway     │
└────────────────────┘

┌────────────────────┐
│ Community Portal   │
│ saas_users 集合     │
│ ADMIN/MEMBER       │
│                    │
│ 功能：              │
│ - 管理長者          │
│ - 綁定設備          │
│ - 設定通知點        │
│ - 查看足跡          │
└────────────────────┘

┌────────────────────┐
│ LIFF App           │
│ appUsers 集合       │
│ LINE 登入           │
│                    │
│ 功能：              │
│ - 查看長者          │
│ - 接收警報          │
└────────────────────┘
```

### 認證隔離

- Admin 使用 'AdminApp' 實例
- Community Portal 使用 'CommunityPortalApp' 實例
- LIFF 使用 LINE 登入（獨立）
- **三者互不干擾**

---

## Admin 功能

### SaaS 用戶管理

**訪問**：`https://safe-net-tw.web.app/saas-users`

**功能**：

- 新增Line OA 管理員（不會被登出）
- 密碼欄位正常顯示
- 設定所屬社區和角色
- 啟用/停用帳號
- 按社區篩選

---

## 資料結構

### saas_users（Line OA 管理員）

```javascript
{
  firebaseUid: "abc123...",
  email: "admin@community.com",
  name: "Line OA 管理員",
  tenantId: "community_001",
  role: "ADMIN",
  isActive: true
}
```

### elders（長者）

```javascript
{
  id: "elder_001",
  tenantId: "community_001",
  name: "長者A",
  age: 75,
  deviceId: "device_101",  // 可選
  status: "ACTIVE"
}
```

### devices（設備）

```javascript
{
  id: "device_101",
  uuid: "FDA50693-...",
  major: 1,
  minor: 101,
  tags: ["community_001"],  // 社區 tag
  bindingType: "ELDER",
  boundTo: "elder_001",
  batteryLevel: 85
}
```

### devices/{id}/activities（設備足跡）

```javascript
{
  timestamp: Timestamp,
  gatewayId: "gateway_001",
  gatewayName: "社區大門",
  gatewayType: "SAFE_ZONE",
  rssi: -65,
  bindingType: "ELDER",
  triggeredNotification: true,
  notificationType: "LINE"
}
```

### tenantNotificationPoints（通知點）

```javascript
{
  tenantId: "community_001",
  gatewayId: "gateway_001",
  name: "社區大門",
  notificationMessage: "長者經過社區大門",
  isActive: true,
  notifyOnElderActivity: true
}
```

---

## 測試帳號建立

### 方法 1: Admin 介面

1. 訪問：`https://safe-net-tw.web.app/saas-users`
2. 登入 Admin（SUPER_ADMIN）
3. 點擊「新增用戶」
4. 填寫資訊並提交
5. 完成！

### 方法 2: 命令列腳本

```bash
cd functions
node create-saas-user.cjs admin@test.com test123456 "測試管理員" TENANT_ID
```

---

## 部署腳本

### 只部署 Community Portal

```bash
./deploy-community-portal.sh
```

### 完整部署

```bash
./deploy-all.sh
```

### 手動部署

```bash
# 建置
npm run build
cd community-portal && npm run build && cd ..
cd functions && npm run build && cd ..

# 部署
firebase deploy
```

---

## 檔案結構

```
community-portal/
├── src/
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Loading.tsx
│   │   ├── Modal.tsx              ← 新增
│   │   └── ElderFormModal.tsx     ← 新增
│   ├── screens/
│   │   ├── login/
│   │   ├── elders/
│   │   │   ├── ElderListScreen.tsx    （已修改）
│   │   │   └── ElderDetailScreen.tsx  （已修改）
│   │   ├── devices/
│   │   ├── notifications/
│   │   └── notification-points/
│   ├── services/
│   │   ├── elderService.ts        （已修改）
│   │   ├── deviceService.ts       （已修改）
│   │   ├── activityService.ts
│   │   └── notificationPointService.ts （已修改）
│   ├── hooks/
│   ├── store/
│   ├── types/
│   └── config/
│       └── firebase.ts            （已修改）
└── ...配置檔案
```

---

## 技術亮點

### 1. Modal 系統

- 可重用的 Modal 元件
- 支援不同大小
- 優雅的開關動畫
- 內容可滾動

### 2. 表單狀態管理

- 新增/編輯共用表單
- 自動預填資料
- 設備選擇整合
- 智能綁定/解綁

### 3. 即時更新

- 使用 Firestore onSnapshot
- 資料變更即時反映
- 無需手動重新整理

### 4. 認證隔離

- 不同的 Firebase App 實例
- 獨立的 localStorage keys
- 可以同時登入多個應用

---

## 文檔索引

**快速開始**：

- `快速測試新功能.md` - 3 分鐘測試指南
- `README_COMMUNITY_PORTAL.md` - 總覽

**功能說明**：

- `ELDER_MODAL_UPDATE.md` - 長者 Modal 更新
- `長者足跡功能說明.md` - 設備足跡功能
- `通知點功能說明_正確版.md` - 通知點功能
- `SAAS_USERS_QUICK_GUIDE.md` - SaaS 用戶管理

**技術文檔**：

- `AUTH_ISOLATION_FIX.md` - 認證隔離修正
- `TESTING_NOTIFICATION_POINTS.md` - 測試指南
- `DEPLOYMENT_GUIDE.md` - 部署指南

---

## 完成狀態

所有功能已完成：

- [x] 專案架構建立
- [x] Firebase 配置
- [x] 認證系統
- [x] 長者管理（含 Modal 和設備選擇）
- [x] 設備清單
- [x] 通知記錄
- [x] 通知點管理
- [x] 設備足跡
- [x] 編輯功能
- [x] Admin SaaS 用戶管理
- [x] Cloud Functions 整合
- [x] Security Rules
- [x] 部署腳本
- [x] 完整文檔

---

## 立即使用

**Community Portal**：

```
https://safe-net-tw.web.app/community
```

**功能測試**：

1. 登入
2. 新增長者（試試設備選擇）
3. 快速編輯（滑鼠移到卡片）
4. 查看詳情和足跡
5. 設定通知點

**Admin 管理**：

```
https://safe-net-tw.web.app/saas-users
```

---

專案完成！所有功能已就緒可以使用。
