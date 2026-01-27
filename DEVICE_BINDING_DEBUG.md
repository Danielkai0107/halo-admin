# 設備綁定問題診斷指南

## 問題：地圖設備綁定失敗 "the string did not match the expected pattern"

### ✅ 已修復的內容

#### 1. API Base URL 配置

之前 `API_BASE_URL` 是空字串，導致 API 請求失敗。

**修復**：

- 創建 `liff/.env` 文件
- 設定 `VITE_FUNCTIONS_BASE_URL=https://us-central1-safe-net-tw.cloudfunctions.net`
- 在服務文件中添加預設值

**現在的 API 請求格式**：

```
https://us-central1-safe-net-tw.cloudfunctions.net/bindDeviceToLineUser
```

### 🔍 診斷步驟

#### 1. 檢查瀏覽器 Console

打開地圖頁面，按 F12 開啟 DevTools，然後：

**嘗試綁定設備時，查看 Console 輸出**：

```
正常情況應該看到：
✅ "Binding device..."
✅ 綁定成功提示

錯誤情況會看到：
❌ "Error binding device: ..."
❌ 具體的錯誤訊息
```

#### 2. 檢查 Network 標籤

在 DevTools 的 Network 標籤中：

1. 尋找 `bindDeviceToLineUser` 請求
2. 查看請求的 URL 是否正確
3. 查看 Response 的錯誤訊息

**正確的請求**：

```
URL: https://us-central1-safe-net-tw.cloudfunctions.net/bindDeviceToLineUser
Method: POST
Status: 200 OK
```

**錯誤的請求**：

```
URL: /bindDeviceToLineUser (相對路徑 - 錯誤)
或
Status: 400/404/500 (檢查 Response 內容)
```

#### 3. 檢查輸入格式

**產品序號格式**：

- 正確：`1-1001`, `ABC-123`, `DEVICE001`
- 系統會自動轉為大寫：`1-1001` → `1-1001`

**暱稱**：任意文字（選填）

**年齡**：0-150 的數字（選填）

**性別**：

- 男性 → `MALE`
- 女性 → `FEMALE`
- 其他 → `OTHER`

### 🧪 測試方法

#### 方法 1：使用測試設備

1. 確認資料庫中有測試設備：
   - 到 Firebase Console → Firestore
   - 查看 `devices` 集合
   - 找一個 `bindingType: "UNBOUND"` 的設備
   - 記下它的 `deviceName`（例如：`1-1001`）

2. 在 LIFF 地圖中嘗試綁定：
   - 輸入該 `deviceName`
   - 填寫其他資訊
   - 點擊確認

#### 方法 2：查看 Functions 日誌

1. 到 Firebase Console
2. Functions → Logs
3. 篩選 `bindDeviceToLineUser`
4. 查看錯誤訊息

### ⚠️ 常見錯誤與解決方案

#### 錯誤 1：Device not found

```
錯誤：Device with deviceName 'XXX' not found
```

**原因**：資料庫中沒有這個設備

**解決**：

1. 確認輸入的序號正確
2. 到 Firestore 檢查 devices 集合中是否有該設備
3. 確認 `deviceName` 欄位的值

#### 錯誤 2：Device is already bound to an elder

```
錯誤：Device is already bound to an elder in the tenant system
```

**原因**：該設備已經綁定給長者了

**解決**：

1. 先在Line OA 管理系統中解綁該設備
2. 或使用其他未綁定的設備

#### 錯誤 3：LINE user not found

```
錯誤：LINE user not found
```

**原因**：用戶尚未完成 LINE 登入

**解決**：

1. 確認已經從 LINE 打開 LIFF
2. 確認 Console 顯示 "LIFF initialized successfully"
3. 確認 "Is logged in: true"

#### 錯誤 4：CORS 錯誤

```
錯誤：Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**原因**：Functions 的 CORS 設定問題

**解決**：

- 我們的 Functions 已經設定 `Access-Control-Allow-Origin: *`
- 如果還是出現，可能是瀏覽器快取問題

### 🔧 手動測試 API

您可以使用 curl 命令測試 API 是否正常：

```bash
curl -X POST https://us-central1-safe-net-tw.cloudfunctions.net/bindDeviceToLineUser \
  -H "Content-Type: application/json" \
  -d '{
    "lineUserId": "測試用戶ID",
    "deviceName": "1-1001",
    "nickname": "測試設備",
    "age": 75,
    "gender": "MALE"
  }'
```

**預期回應**：

```json
{
  "success": true,
  "device": { ... },
  "boundAt": "..."
}
```

### 📋 檢查清單

在嘗試綁定設備前，請確認：

- [ ] 已從 LINE 內打開 LIFF
- [ ] 已完成 LINE 登入（Console 顯示 "Is logged in: true"）
- [ ] 已選擇社區（如果有多個社區）
- [ ] 輸入的設備序號確實存在於資料庫中
- [ ] 該設備的 `bindingType` 是 `UNBOUND`
- [ ] 網路連接正常

### 💡 如果問題持續

請提供以下資訊：

1. 瀏覽器 Console 的完整錯誤訊息
2. Network 標籤中 `bindDeviceToLineUser` 請求的 Response
3. 您輸入的設備序號
4. Firebase Functions 日誌中的錯誤

這樣我可以更精確地幫您診斷問題！

### 🚀 最新部署

已重新部署包含修復的版本：

- ✅ 設定正確的 API Base URL
- ✅ 添加預設值避免空字串
- ✅ 創建 .env 環境變數文件

請清除瀏覽器快取（完全關閉 LINE 重開）後再次測試！
