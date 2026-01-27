# Community Portal 使用指南

## 快速開始（3 步驟）

### 1. 建立管理員帳號

訪問：**https://safe-net-tw.web.app/saas-users**

- 登入 Admin（SUPER_ADMIN）
- 點擊「新增用戶」
- 填寫 Email、密碼、選擇社區
- 提交

### 2. 登入 Community Portal

訪問：**https://safe-net-tw.web.app/community**

- 使用剛建立的 Email 和密碼登入

### 3. 開始使用

- **長者管理**：新增長者、綁定設備
- **通知點**：勾選 gateway 設為通知點
- **查看記錄**：通知記錄、設備足跡

---

## 主要功能

### 長者管理（Table）

- 新增長者（Modal + 設備選擇）
- 編輯長者（當前設備顯示）
- 查看詳情（設備足跡）
- 搜尋、刪除

### 設備清單（Table）

- 查看社區設備
- 搜尋、篩選
- 查看詳情（Modal）
- 唯讀模式

### 通知點（Table + Modal）

- Table 顯示已設定的通知點
- Modal 選擇 gateways
- 勾選設為通知點
- 搜尋、刪除

### 通知記錄

- 查看 LINE 通知歷史
- 按長者/日期篩選

---

## LINE 通知

### 通知格式

```
新偵測通知
─────────────────
{長輩} 出現在 {位置} 附近
```

### 觸發條件

1. 長者有綁定設備
2. 設備經過 gateway
3. **該 gateway 被勾選為通知點**
4. 社區有 LINE 設定
5. 社區有成員

---

## 測試流程

### 完整測試（10 分鐘）

1. **建立帳號** → Admin SaaS 用戶管理
2. **登入** → Community Portal
3. **新增長者** → 選擇設備綁定
4. **設定通知點** → 勾選 gateway
5. **發送測試** → Admin Beacon Test
6. **確認結果**：
   - LINE 收到通知 ✅
   - 通知記錄出現 ✅
   - 設備足跡更新 ✅
   - 最後活動更新 ✅

---

## 重要設定

### Gateway 必須設定 location

在 Admin「GateWay 管理」：

- 設定清楚的位置（如「台北市大安區XX路1號」）
- 這會顯示在 LINE 通知中

### 社區必須有 LINE 設定

在 Admin「Line OA 管理」：

- lineChannelAccessToken
- lineChannelSecret

### 必須有社區成員

- line_users 集合有資料
- 有 lineUserId
- 是 APPROVED 狀態

---

## 故障排除

### 沒收到 LINE 通知？

→ 查看 `LINE_NOTIFICATION_FIX.md`

### 通知記錄是空的？

→ 查看 `通知記錄查詢修正.md`

### 設備狀態沒顯示？

→ 查看 `長輩Table資料修正.md`

### 最後活動沒更新？

→ 查看 `最後活動更新修正.md`

---

## 完整文檔

**快速開始**：

- `START_HERE.md`（本文件）
- `使用指南_一頁版.md`

**最新更新**：

- `所有功能最終確認.md`
- `Community_Portal_最終完成.md`

**功能說明**：

- `長者管理UI統一完成.md`
- `設備清單UI更新完成.md`
- `通知點新UI使用說明.md`

---

## 專案完成

所有功能已開發、測試並部署完成。

**立即開始使用**：

https://safe-net-tw.web.app/community

祝使用順利！
