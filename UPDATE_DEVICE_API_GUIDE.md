# Cloud Function API 文檔：updateMapUserDevice

## 📡 API 端點

**Function Name**: `updateMapUserDevice`

**URL (部署後)**:
```
https://updatemapuserdevice-kmzfyt3t5a-uc.a.run.app
```

## 🎯 功能說明

允許 Map App 用戶更新自己的頭像和設備相關資訊（暱稱、年齡、性別）。

### 資料儲存位置
- **頭像** (`avatar`) → 儲存在 `mapAppUsers` collection
- **設備資訊** (`nickname`, `age`, `gender`) → 儲存在 `devices` collection

---

## 📥 請求格式

### Method
```
POST
```

### Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <Firebase_ID_Token>"
}
```

### Request Body

所有欄位都是**可選的**，可以只更新需要的部分。

```typescript
{
  "userId": "string (必填)",        // Map App 用戶 ID
  "avatar": "string (選填)",        // 頭像檔名，例如：01.png, 02.png
  "nickname": "string (選填)",      // 設備暱稱，例如：爸爸的卡片
  "age": "number (選填)",           // 使用者年齡，例如：75
  "gender": "string (選填)"         // 性別：MALE | FEMALE | OTHER
}
```

---

## 📤 回應格式

### 成功回應 (200 OK)
```json
{
  "success": true,
  "message": "設備資訊已更新",
  "updated": {
    "avatar": true,      // 是否更新了頭像
    "nickname": true,    // 是否更新了暱稱
    "age": true,         // 是否更新了年齡
    "gender": false      // 是否更新了性別
  }
}
```

### 錯誤回應

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized: Missing or invalid token"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden: Cannot update another user's device"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "錯誤訊息"
}
```

---

## 📝 使用範例

### 範例 1：只更新頭像
```json
{
  "userId": "abc123",
  "avatar": "01.png"
}
```

### 範例 2：只更新設備資訊
```json
{
  "userId": "abc123",
  "nickname": "爸爸的卡片",
  "age": 75,
  "gender": "MALE"
}
```

### 範例 3：同時更新頭像和設備資訊
```json
{
  "userId": "abc123",
  "avatar": "02.png",
  "nickname": "媽媽的手錶",
  "age": 72,
  "gender": "FEMALE"
}
```

### 範例 4：清空暱稱
```json
{
  "userId": "abc123",
  "nickname": ""
}
```

---

## 🔒 權限控制

1. **一般用戶**：只能更新自己的資料 (`userId` 必須等於 token 中的 `uid`)
2. **管理員**：可以更新任何用戶的資料 (role 為 `SUPER_ADMIN` 或 `TENANT_ADMIN`)

---

## ⚠️ 重要說明

### 1. 未綁定設備的情況
- 如果用戶**沒有綁定設備**，只會更新 `avatar`
- `nickname`, `age`, `gender` 會被忽略（不會報錯）
- 回應中的 `updated` 欄位會顯示實際更新情況

### 2. 資料驗證
- `userId` 必填
- `age` 如果提供，應為正整數
- `gender` 如果提供，必須是 `MALE`, `FEMALE`, 或 `OTHER`

### 3. 與其他 API 的關係
- 綁定設備時也會寫入 `nickname`, `age`, `gender` (使用 `bindDeviceToMapUser`)
- 解綁設備時會清空這些欄位並匿名化歷史記錄 (使用 `unbindDeviceFromMapUser`)

---

## 🚀 部署指令

### 部署單一 Function
```bash
firebase deploy --only functions:updateMapUserDevice
```

### 部署所有 Map App Functions
```bash
firebase deploy --only functions:mapUserAuth,functions:updateMapUserFcmToken,functions:bindDeviceToMapUser,functions:unbindDeviceFromMapUser,functions:updateMapUserDevice
```

---

## 🧪 測試指令

使用 curl 測試：

```bash
curl -X POST \
  https://updatemapuserdevice-kmzfyt3t5a-uc.a.run.app \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "userId": "YOUR_USER_ID",
    "avatar": "01.png",
    "nickname": "測試設備",
    "age": 75,
    "gender": "MALE"
  }'
```

---

## 📊 Firestore 資料結構

### 更新前
```
mapAppUsers/abc123
  ├── name: "王小明"
  ├── avatar: null
  └── boundDeviceId: "device001"

devices/device001
  ├── boundTo: "abc123"
  ├── mapUserNickname: null
  ├── mapUserAge: null
  └── mapUserGender: null
```

### 更新後 (完整更新)
```
mapAppUsers/abc123
  ├── name: "王小明"
  ├── avatar: "01.png"              ← 更新
  ├── boundDeviceId: "device001"
  └── updatedAt: Timestamp          ← 更新

devices/device001
  ├── boundTo: "abc123"
  ├── mapUserNickname: "爸爸的卡片" ← 更新
  ├── mapUserAge: 75                ← 更新
  ├── mapUserGender: "MALE"         ← 更新
  └── updatedAt: Timestamp          ← 更新
```

---

## 🔗 相關 API

- **綁定設備**: `bindDeviceToMapUser` - 同時會設定 nickname, age, gender
- **解綁設備**: `unbindDeviceFromMapUser` - 複製活動記錄到匿名 collection，清空設備活動記錄
- **獲取用戶資料**: `getMapUserProfile` - 讀取包含頭像和設備資訊

---

## 📊 解綁時的資料處理

### 解綁流程說明

當用戶解綁設備時：

1. **複製活動記錄**到全域 `anonymousActivities` collection
   - 保留統計用欄位（deviceId, timestamp, location, rssi 等）
   - 移除個人識別資訊（boundTo, nickname, age, gender）
   - 新增 `anonymizedAt` 和 `archiveSessionId` 欄位

2. **刪除原始活動記錄**從 `devices/{deviceId}/activities/`

3. **更新設備狀態**為 `UNBOUND`

4. **清空用戶綁定**（`boundDeviceId = null`）

### 資料結構變化

```
解綁前：
devices/D1/activities/
  ├── act_1 { boundTo: "userA", bindingType: "MAP_USER", timestamp, location }
  └── act_2 { boundTo: "userA", bindingType: "MAP_USER", timestamp, location }

↓ 執行解綁 ↓

解綁後：
devices/D1/activities/
  └── (空的，記錄已被刪除)

anonymousActivities/  (全域 collection)
  ├── {autoId_1} { 
  │     deviceId: "D1",
  │     bindingType: "ANONYMOUS", 
  │     boundTo: null,
  │     timestamp: ...,
  │     latitude: ...,
  │     anonymizedAt: "2025-01-23T...",
  │     archiveSessionId: "abc123"  // 同一批次
  │   }
  └── {autoId_2} { 
        deviceId: "D1",
        bindingType: "ANONYMOUS",
        archiveSessionId: "abc123"  // 同一批次
      }
```

### 匿名記錄保留的欄位

| 欄位 | 保留 | 說明 |
|------|------|------|
| `deviceId` | ✅ | 設備 ID（統計用） |
| `timestamp` | ✅ | 活動時間（統計用） |
| `gatewayId` | ✅ | 接收器 ID（統計用） |
| `gatewayName` | ✅ | 接收器名稱 |
| `latitude/longitude` | ✅ | 位置（統計用） |
| `rssi` | ✅ | 信號強度（統計用） |
| `bindingType` | ✅ → `"ANONYMOUS"` | 標記為匿名 |
| `boundTo` | ❌ → `null` | 移除用戶關聯 |
| `anonymizedAt` | ✅ (新增) | 記錄匿名化時間 |
| `archiveSessionId` | ✅ (新增) | 同一次解綁的記錄分組 |
| `originalActivityId` | ✅ (新增) | 原始活動 ID |

### 重新綁定時

當用戶重新綁定**同一個設備**或**不同設備**時：
- 設備的 `activities` 是空的（全新開始）
- 新的活動記錄會正常寫入 `devices/{deviceId}/activities/`
- 匿名記錄保留在 `anonymousActivities/` 用於統計分析

---

## 📝 前端整合建議

### Dart/Flutter 範例

```dart
Future<bool> updateDeviceInfo({
  required String userId,
  String? avatar,
  String? nickname,
  int? age,
  String? gender,
}) async {
  try {
    final token = await FirebaseAuth.instance.currentUser?.getIdToken();
    
    final response = await http.post(
      Uri.parse('https://updatemapuserdevice-kmzfyt3t5a-uc.a.run.app'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'userId': userId,
        if (avatar != null) 'avatar': avatar,
        if (nickname != null) 'nickname': nickname,
        if (age != null) 'age': age,
        if (gender != null) 'gender': gender,
      }),
    );

    final data = jsonDecode(response.body);
    return data['success'] == true;
  } catch (e) {
    print('更新設備資訊失敗: $e');
    return false;
  }
}
```

### JavaScript/React 範例

```javascript
async function updateDeviceInfo({
  userId,
  avatar,
  nickname,
  age,
  gender,
}) {
  try {
    const token = await auth.currentUser.getIdToken();
    
    const response = await fetch(
      'https://updatemapuserdevice-kmzfyt3t5a-uc.a.run.app',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          ...(avatar && { avatar }),
          ...(nickname && { nickname }),
          ...(age && { age }),
          ...(gender && { gender }),
        }),
      }
    );

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('更新設備資訊失敗:', error);
    return false;
  }
}
```

---

## ✅ 檢查清單

部署前確認：
- [ ] `functions/src/mapApp/deviceUpdate.ts` 已建立
- [ ] `functions/src/index.ts` 已註冊 export
- [ ] `npm run build` 編譯成功
- [ ] 確認 `mapAppUsers` 和 `devices` collection 名稱正確
- [ ] 確認欄位名稱：`mapUserNickname`, `mapUserAge`, `mapUserGender`

部署後測試：
- [ ] 測試只更新頭像
- [ ] 測試只更新設備資訊
- [ ] 測試同時更新頭像和設備資訊
- [ ] 測試未綁定設備的用戶
- [ ] 測試權限控制（不能更新別人的資料）
