# MAP_APP_API_ENDPOINTS.md 連結驗證報告

**檢查日期：** 2026-01-21  
**文檔版本：** 2.0.0

---

## ✅ URL 列表驗證

### 地圖 APP 專用 API（11 個）

| API 名稱 | URL | 部署狀態 | 文檔狀態 |
|---------|-----|---------|---------|
| mapUserAuth | https://mapuserauth-kmzfyt3t5a-uc.a.run.app | ✅ 已部署 | ✅ 已列出 |
| updateMapUserFcmToken | https://updatemapuserfcmtoken-kmzfyt3t5a-uc.a.run.app | ✅ 已部署 | ✅ 已列出 |
| bindDeviceToMapUser | https://binddevicetomapuser-kmzfyt3t5a-uc.a.run.app | ✅ 已部署 | ✅ 已列出 |
| unbindDeviceFromMapUser | https://unbinddevicefrommapuser-kmzfyt3t5a-uc.a.run.app | ✅ 已部署 | ✅ 已列出 |
| getPublicGateways | https://getpublicgateways-kmzfyt3t5a-uc.a.run.app | ✅ 已部署 | ✅ 已列出 |
| addMapUserNotificationPoint | https://addmapusernotificationpoint-kmzfyt3t5a-uc.a.run.app | ✅ 已部署 | ✅ 已列出 |
| getMapUserNotificationPoints | https://getmapusernotificationpoints-kmzfyt3t5a-uc.a.run.app | ✅ 已部署 | ✅ 已列出 |
| updateMapUserNotificationPoint | https://updatemapusernotificationpoint-kmzfyt3t5a-uc.a.run.app | ✅ 已部署 | ✅ 已列出 |
| removeMapUserNotificationPoint | https://removemapusernotificationpoint-kmzfyt3t5a-uc.a.run.app | ✅ 已部署 | ✅ 已列出 |
| getMapUserActivities | https://getmapuseractivities-kmzfyt3t5a-uc.a.run.app | ✅ 已部署 | ✅ 已列出 |
| getMapUserProfile | https://getmapuserprofile-kmzfyt3t5a-uc.a.run.app | ✅ 已部署 | ✅ 已列出 |

### 共用 API（3 個）

| API 名稱 | URL | 部署狀態 | 文檔狀態 |
|---------|-----|---------|---------|
| receiveBeaconData | https://receivebeacondata-kmzfyt3t5a-uc.a.run.app | ✅ 已部署 | ✅ 已補充 |
| getServiceUuids | https://getserviceuuids-kmzfyt3t5a-uc.a.run.app | ✅ 已部署 | ✅ 已補充 |
| getDeviceWhitelist | https://getdevicewhitelist-kmzfyt3t5a-uc.a.run.app | ✅ 已部署 | ✅ 已補充 |

---

## 📝 文檔更新內容

### 新增內容
1. **URL 列表分類**
   - 將「地圖 APP 專用 API」與「共用 API」分開列出
   - 補充了 3 個共用 API 的 URL（receiveBeaconData, getServiceUuids, getDeviceWhitelist）

2. **API 摘要表分類**
   - 增加「共用 API」子表格
   - 補充共用 API 的說明欄

### 確認正確的內容
- ✅ 所有 14 個 API 端點 URL 都已列出
- ✅ URL 格式統一使用 `https://[function-name]-kmzfyt3t5a-uc.a.run.app`
- ✅ 所有 URL 都有對應的已部署函數
- ✅ 文檔中的使用範例都使用正確的 URL

---

## 🔍 URL 使用位置統計

文檔中 URL 出現的位置：

### 開頭 URL 列表
- 第 16-30 行：完整 URL 列表（11 個專用 + 3 個共用）

### API 詳細說明中
未直接嵌入 URL（使用相對路徑 `/apiName`），正確做法 ✅

### 完整使用流程章節
- 第 530 行：mapUserAuth
- 第 550 行：updateMapUserFcmToken  
- 第 566 行：bindDeviceToMapUser（方式一）
- 第 581 行：bindDeviceToMapUser（方式二）
- 第 599 行：getPublicGateways
- 第 603 行：addMapUserNotificationPoint
- 第 623 行：getMapUserActivities
- 第 637 行：getMapUserProfile

所有 URL 都正確無誤 ✅

---

## ⚠️ 注意事項

### receiveBeaconData 的特殊性
- **用途：** 閘道設備上傳 beacon 資料（非用戶直接調用）
- **認證：** 不需要（開放端點，接受硬體設備上傳）
- **已更新：** 邏輯已重構為統一架構（bindingType）

### URL 格式規則
```
https://[function-name]-[project-hash]-[region].a.run.app
```
- project-hash: `kmzfyt3t5a`
- region: `uc` (us-central1 的縮寫)

---

## 🧪 連結測試命令

### 快速測試所有端點是否可訪問
```bash
# 測試公開端點（不需認證）
curl https://getpublicgateways-kmzfyt3t5a-uc.a.run.app
curl https://getserviceuuids-kmzfyt3t5a-uc.a.run.app
curl https://getdevicewhitelist-kmzfyt3t5a-uc.a.run.app

# 測試需認證端點（OPTIONS 請求）
curl -X OPTIONS https://mapuserauth-kmzfyt3t5a-uc.a.run.app
curl -X OPTIONS https://binddevicetomapuser-kmzfyt3t5a-uc.a.run.app
```

---

## ✅ 結論

**URL 狀態：** 全部正確 ✅  
**文檔完整性：** 100% ✅  
**部署狀態：** 14 個函數全部已部署 ✅

所有 Cloud Function 端點的 URL 都已正確列出並更新到最新架構！

---

**檢查者：** AI Assistant  
**檢查日期：** 2026-01-21
