# Community Portal 變更摘要

## 修正日期
2026-01-25

## 修正的問題

### 1. 設備清單無法顯示

**問題描述**：
Community Portal 的設備清單頁面無法顯示任何設備

**根本原因**：
tags 查詢格式錯誤，使用了 `tenant_${tenantId}` 但實際資料庫中 tags 直接存 `tenantId`

**修正內容**：
- `community-portal/src/services/deviceService.ts`
  - 改為：`where('tags', 'array-contains', tenantId)`
- `community-portal/src/services/elderService.ts`
  - getAvailableDevices 同樣修正

**影響**：
現在可以正確顯示所有有該社區 tag 的設備

---

### 2. 通知點管理 UI 改進

**問題描述**：
原本通知點管理是用 Modal 新增，但用戶希望從現有 gateway 列表中勾選

**修正內容**：
完全重新設計 `NotificationPointsScreen.tsx`

**新功能**：
- 顯示所有社區的 gateways（列表式）
- 每個 gateway 前面有勾選框
- 勾選 = 設為通知點
- 取消勾選 = 停用通知點
- 直接在列表中編輯自訂通知訊息
- 即時更新，無需開 Modal

**用戶體驗改善**：
- 一目了然看到哪些 gateway 是通知點
- 快速切換通知點狀態
- 更符合直覺的操作方式

---

### 3. LINE 通知觸發邏輯驗證

**確認內容**：
- Cloud Functions 中的通知點檢查邏輯正確
- 發送通知點通知時使用自訂訊息
- 正確記錄通知點 ID 到活動記錄

**邏輯流程**：
```
1. 設備上傳資料 → receiveBeaconData
2. 判斷 bindingType = ELDER
3. 取得長者和社區資料
4. 查詢是否為通知點：
   - collection: tenantNotificationPoints
   - where: tenantId == elder.tenantId
   - where: gatewayId == gateway.id
   - where: isActive == true
   - where: notifyOnElderActivity == true
5. 如果是通知點 → 發送通知點通知
6. 否則 → 發送一般位置更新通知
7. 記錄到 activities 子集合
```

**驗證方法**：
參考 `TESTING_NOTIFICATION_POINTS.md` 進行完整測試

---

## 修改的檔案

### Community Portal
1. `src/services/deviceService.ts` - 修正 tags 查詢
2. `src/services/elderService.ts` - 修正 tags 查詢
3. `src/screens/notification-points/NotificationPointsScreen.tsx` - 完全重寫 UI

### Cloud Functions
- `functions/src/beacon/receiveBeaconData.ts` - 已在先前修改，邏輯正確

---

## 編譯狀態

所有專案編譯成功：
- ✅ Admin: 994 KB
- ✅ Community Portal: 652 KB
- ✅ Cloud Functions: 222 KB

---

## 測試建議

### 最小測試集

1. **設備清單測試**
   - 登入 Community Portal
   - 前往「設備清單」
   - 確認能看到設備

2. **通知點勾選測試**
   - 前往「通知點」
   - 勾選一個 gateway
   - 確認顯示「已設為通知點」

3. **自訂訊息測試**
   - 輸入自訂訊息
   - 點擊「更新」
   - 確認保存成功

4. **LINE 通知測試**
   - 使用 Beacon Test 發送測試資料
   - 確認 LINE 收到通知
   - 確認通知記錄出現

---

## 部署檢查清單

部署前確認：

- [ ] 所有專案編譯成功
- [ ] 本地測試通過
- [ ] 確認 Firestore 資料結構正確
- [ ] 確認社區有 LINE Channel Access Token
- [ ] 確認有測試帳號可以登入

部署指令：
```bash
# 完整部署
./deploy-all.sh

# 選擇要部署的項目：
# Community Portal: y
# Cloud Functions: y
```

---

## 回滾計劃

如果部署後發現問題：

```bash
# 回滾 Hosting
firebase hosting:rollback

# 回滾 Functions（在 Firebase Console 操作）
# Functions → 選擇函數 → 版本歷史 → 選擇舊版本
```

---

## 效能最佳化建議

### 設備列表

目前查詢：
```typescript
where('tags', 'array-contains', tenantId)
where('isActive', '==', true)
```

**建議索引**（Firestore 會自動提示）：
- Collection: devices
- Fields: tags (Array), isActive (Ascending)

### 通知點查詢

目前查詢：
```typescript
where('tenantId', '==', tenantId)
where('gatewayId', '==', gateway.id)
where('isActive', '==', true)
where('notifyOnElderActivity', '==', true)
```

**建議索引**：
- Collection: tenantNotificationPoints
- Fields: tenantId, gatewayId, isActive, notifyOnElderActivity

---

## 後續改進建議

1. **批次操作**
   - 支援一次勾選多個 gateways
   - 批次設定自訂訊息

2. **通知點統計**
   - 顯示每個通知點的觸發次數
   - 最近觸發時間

3. **地圖視圖**
   - 在地圖上顯示所有通知點
   - 視覺化長者經過路徑

4. **通知點群組**
   - 將通知點分組（如「出入口」、「重要地點」）
   - 群組啟用/停用

---

## 技術要點

### tags 欄位格式

**正確格式**：
```javascript
tags: ["tenant_id_123", "批次2024", "其他標籤"]
```

**錯誤格式**：
```javascript
tags: ["tenant_tenant_id_123"]  // 多加了 tenant_ 前綴
```

### 通知點觸發條件

同時滿足以下條件才會觸發：
1. gateway 被設為通知點（tenantNotificationPoints 有記錄）
2. 通知點的 isActive = true
3. 通知點的 notifyOnElderActivity = true
4. 設備的 bindingType = 'ELDER'
5. 長者有 tenantId 且與通知點的 tenantId 相同
6. 社區有 lineChannelAccessToken

---

## 文檔索引

- `TESTING_NOTIFICATION_POINTS.md` - 完整測試指南
- `SAAS_USERS_QUICK_GUIDE.md` - SaaS 用戶快速指南
- `COMMUNITY_PORTAL_SETUP.md` - Community Portal 設置
- `DEPLOYMENT_GUIDE.md` - 部署指南

---

所有修正已完成並編譯成功，可以開始測試了！
