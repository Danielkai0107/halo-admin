# 帳號刪除 FCM 推送通知功能

## 📋 概述

當管理員在後台刪除Line 用戶管理時，系統會在刪除前自動發送 FCM 推送通知給該用戶，通知類型為 `ACCOUNT_DELETED`。

## ✅ 部署狀態

- **部署時間：** 2026-01-24
- **Function URL：** https://deletemapappuser-kmzfyt3t5a-uc.a.run.app
- **狀態：** ✅ 已部署並啟用

## 🔄 執行流程

當管理員刪除用戶時，Cloud Function 會按以下順序執行：

1. ✅ **權限檢查** - 驗證是否為管理員或用戶本人
2. ✅ **發送 FCM 通知** - 如果用戶有 FCM token，發送推送通知
3. ✅ **解綁設備** - 如果有綁定設備，執行解綁並匿名化活動記錄
4. ✅ **刪除通知點位** - 刪除用戶的所有通知點位
5. ✅ **刪除 Firestore 文檔** - 刪除 `mapAppUsers` 文檔
6. ✅ **刪除 Firebase Auth** - 刪除 Auth 帳號

## 📱 FCM 通知內容

### Notification Payload

```json
{
  "notification": {
    "title": "帳號已被刪除",
    "body": "您的帳號已被管理員刪除，請重新登入或聯繫客服。"
  },
  "data": {
    "type": "ACCOUNT_DELETED",
    "userId": "user_id_here",
    "timestamp": "2026-01-24T10:30:00.000Z"
  }
}
```

### Android 設定

```json
{
  "android": {
    "priority": "high",
    "notification": {
      "channelId": "account_management",
      "priority": "high",
      "sound": "default"
    }
  }
}
```

### iOS 設定

```json
{
  "apns": {
    "payload": {
      "aps": {
        "alert": {
          "title": "帳號已被刪除",
          "body": "您的帳號已被管理員刪除，請重新登入或聯繫客服。"
        },
        "sound": "default",
        "badge": 1
      }
    }
  }
}
```

## 📱 App 端處理建議

### 1. 監聽 FCM 通知

**Android (Kotlin):**

```kotlin
override fun onMessageReceived(remoteMessage: RemoteMessage) {
    val notificationType = remoteMessage.data["type"]

    if (notificationType == "ACCOUNT_DELETED") {
        val userId = remoteMessage.data["userId"]
        val timestamp = remoteMessage.data["timestamp"]

        // 立即登出用戶
        handleAccountDeleted(userId, timestamp)
    }
}

private fun handleAccountDeleted(userId: String?, timestamp: String?) {
    // 1. 清除本地數據
    clearLocalData()

    // 2. 登出 Firebase Auth
    FirebaseAuth.getInstance().signOut()

    // 3. 顯示通知或對話框
    showAccountDeletedDialog()

    // 4. 導航到登入頁面
    navigateToLoginScreen()
}
```

**iOS (Swift):**

```swift
func userNotificationCenter(_ center: UNUserNotificationCenter,
                          willPresent notification: UNNotification,
                          withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {

    let userInfo = notification.request.content.userInfo

    if let notificationType = userInfo["type"] as? String,
       notificationType == "ACCOUNT_DELETED" {
        let userId = userInfo["userId"] as? String
        let timestamp = userInfo["timestamp"] as? String

        // 立即登出用戶
        handleAccountDeleted(userId: userId, timestamp: timestamp)
    }
}

private func handleAccountDeleted(userId: String?, timestamp: String?) {
    // 1. 清除本地數據
    clearLocalData()

    // 2. 登出 Firebase Auth
    try? Auth.auth().signOut()

    // 3. 顯示通知或對話框
    showAccountDeletedAlert()

    // 4. 導航到登入頁面
    navigateToLoginScreen()
}
```

**React Native:**

```javascript
messaging().onMessage(async (remoteMessage) => {
  const notificationType = remoteMessage.data?.type;

  if (notificationType === "ACCOUNT_DELETED") {
    const userId = remoteMessage.data?.userId;
    const timestamp = remoteMessage.data?.timestamp;

    // 立即登出用戶
    handleAccountDeleted(userId, timestamp);
  }
});

const handleAccountDeleted = async (userId, timestamp) => {
  // 1. 清除本地數據
  await clearLocalData();

  // 2. 登出 Firebase Auth
  await auth().signOut();

  // 3. 顯示通知或對話框
  Alert.alert(
    "帳號已被刪除",
    "您的帳號已被管理員刪除，請重新登入或聯繫客服。",
    [{ text: "確定", onPress: () => navigation.navigate("Login") }],
  );
};
```

### 2. 建議的 Android Notification Channel

在 App 啟動時創建通知頻道：

```kotlin
private fun createAccountManagementChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val channel = NotificationChannel(
            "account_management",
            "帳號管理",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "帳號相關的重要通知"
            enableVibration(true)
            setShowBadge(true)
        }

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.createNotificationChannel(channel)
    }
}
```

## 🔍 API 回應格式

刪除成功後，API 會返回以下資訊：

```json
{
  "success": true,
  "message": "Map app user deleted successfully",
  "details": {
    "fcmNotificationSent": true,
    "firestoreDeleted": true,
    "authDeleted": true,
    "deviceUnbound": true,
    "notificationPointsDeleted": 2
  }
}
```

**欄位說明：**

- `fcmNotificationSent`: 是否成功發送 FCM 通知
- `firestoreDeleted`: Firestore 文檔是否刪除
- `authDeleted`: Firebase Auth 帳號是否刪除
- `deviceUnbound`: 是否有解綁設備
- `notificationPointsDeleted`: 刪除的通知點位數量

## ⚠️ 注意事項

### 1. FCM Token 必須存在

- 只有當用戶的 `fcmToken` 欄位有值時，才會發送通知
- 如果用戶從未設定 FCM token，通知會被跳過但刪除流程仍會繼續

### 2. 通知發送失敗處理

- 如果 FCM 通知發送失敗（例如 token 過期），不會影響刪除流程
- 錯誤會被記錄在 Cloud Functions 日誌中
- `fcmNotificationSent` 會返回 `false`

### 3. 時序問題

- 通知在刪除流程**最開始**就會發送
- App 端可能會在收到通知後嘗試訪問 API，但此時帳號可能已被刪除
- 建議 App 端在收到 `ACCOUNT_DELETED` 通知後直接登出，不要嘗試其他 API 呼叫

### 4. 測試建議

1. 在測試環境先測試 FCM 通知是否正常送達
2. 測試 App 端收到通知後的登出流程
3. 測試用戶沒有 FCM token 時的刪除流程
4. 測試 FCM token 過期時的刪除流程

## 📊 監控建議

### Cloud Functions 日誌

可以在 Firebase Console 中查看以下日誌：

```
✅ 成功發送：FCM notification sent to user {userId} before account deletion
❌ 發送失敗：Failed to send FCM notification to user {userId}: {error}
⚠️  無 Token：User {userId} has no FCM token, skipping notification
```

### 統計指標

建議追蹤以下指標：

- FCM 通知發送成功率
- App 端收到通知的比例
- 用戶從收到通知到登出的平均時間

## 🔗 相關文檔

- [FCM Token 更新 API](./MAP_APP_API_ENDPOINTS.md#updateMapUserFcmToken)
- [刪除用戶 API](./MAP_APP_API_ENDPOINTS.md#deleteMapAppUser)
- [Firebase Cloud Messaging 文檔](https://firebase.google.com/docs/cloud-messaging)

## 更新日期

- **創建日期：** 2026-01-24
- **最後更新：** 2026-01-24
