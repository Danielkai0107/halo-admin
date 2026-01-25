# 座標選填功能

## 📋 功能說明

API 的 `lat` 和 `lng` 欄位現在是**選填**的，支援固定設備（無 GPS）的使用場景。

---

## ✅ 支援的上傳方式

### 方式 1：不帶座標 ✅ 固定設備推薦

```json
{
  "gateway_id": "FIXED-GATEWAY-001",
  "timestamp": 1737363092720,
  "beacons": [...]
}
```

**適用於：** 固定安裝的接收器（無 GPS）
**系統行為：** 使用資料庫中的 Gateway 固定座標

---

### 方式 2：帶座標 ✅ 移動設備推薦

```json
{
  "gateway_id": "MOBILE-GATEWAY-001",
  "lat": 25.033964,
  "lng": 121.564468,
  "timestamp": 1737363092720,
  "beacons": [...]
}
```

**適用於：** 移動接收器（手機 App，有 GPS）
**系統行為：** 使用上傳的實時 GPS 座標

---

### 方式 3：座標為 0,0 ✅ 也支援

```json
{
  "gateway_id": "FIXED-GATEWAY-002",
  "lat": 0,
  "lng": 0,
  "timestamp": 1737363092720,
  "beacons": [...]
}
```

**適用於：** 固定設備的替代方式
**系統行為：** 視為無效座標，使用資料庫座標

---

## 🎯 位置決定邏輯

### 邏輯流程

```typescript
function determineLocation(gateway, uploadedLat?, uploadedLng?) {
  // 1. MOBILE 類型：優先使用上傳的 GPS
  if (gateway.type === 'MOBILE' && uploadedLat && uploadedLng) {
    return { lat: uploadedLat, lng: uploadedLng };
  }
  
  // 2. 使用資料庫中的固定座標
  if (gateway.latitude && gateway.longitude) {
    return { lat: gateway.latitude, lng: gateway.longitude };
  }
  
  // 3. 備用：使用上傳的座標
  if (uploadedLat && uploadedLng) {
    return { lat: uploadedLat, lng: uploadedLng };
  }
  
  // 4. 最後備用：(0, 0)
  return { lat: 0, lng: 0 };
}
```

### 優先順序表

| Gateway 類型 | 第一優先 | 第二優先 | 最後備用 |
|-------------|---------|---------|---------|
| **MOBILE** | 上傳的 GPS | 資料庫座標 | (0, 0) |
| **GENERAL** | 資料庫座標 | 上傳的 GPS | (0, 0) |
| **BOUNDARY** | 資料庫座標 | 上傳的 GPS | (0, 0) |

---

## Android App 實作建議

### 智能判斷

```kotlin
class BeaconUploader(
    private val gatewayType: GatewayType,
    private val locationManager: LocationManager
) {
    fun createPayload(
        gatewayId: String,
        beacons: List<Beacon>
    ): BeaconUploadPayload {
        return when (gatewayType) {
            GatewayType.MOBILE -> {
                // 移動設備：必須提供 GPS
                val location = locationManager.getLastKnownLocation()
                BeaconUploadPayload(
                    gateway_id = gatewayId,
                    lat = location?.latitude,   // 提供 GPS
                    lng = location?.longitude,  // 提供 GPS
                    timestamp = System.currentTimeMillis(),
                    beacons = beacons.map { it.toBeaconData() }
                )
            }
            
            GatewayType.FIXED -> {
                // 固定設備：省略座標
                BeaconUploadPayload(
                    gateway_id = gatewayId,
                    // 不提供 lat/lng
                    timestamp = System.currentTimeMillis(),
                    beacons = beacons.map { it.toBeaconData() }
                )
            }
        }
    }
}
```

### 簡化版

```kotlin
// 如果你的接收器是固定設備
fun uploadBeacons(gatewayId: String, beacons: List<Beacon>) {
    val payload = mapOf(
        "gateway_id" to gatewayId,
        // 完全不提供 lat/lng
        "timestamp" to System.currentTimeMillis(),
        "beacons" to beacons.map { beacon ->
            mapOf(
                "uuid" to beacon.id1.toString(),
                "major" to beacon.id2.toInt(),
                "minor" to beacon.id3.toInt(),
                "rssi" to beacon.rssi
            )
        }
    )
    
    apiService.uploadBeacons(payload)
}
```

---

## 🔧 後台設定

### 固定設備的完整設定流程

#### 步驟 1：註冊 Gateway（可選，會自動註冊）

如果想預先設定固定座標：

```
後台 → 接收點管理 → 新增接收點

填寫：
├─ 序列號: FIXED-GATEWAY-001
├─ 名稱: 社區大門接收器
├─ 類型: GENERAL 或 BOUNDARY
├─ 位置: 社區正門
├─ GPS 座標: 重要
│   ├─ 緯度: 25.033964
│   └─ 經度: 121.564468
└─ 狀態: 啟用
```

#### 步驟 2：上傳資料

```json
{
  "gateway_id": "FIXED-GATEWAY-001",
  // 不提供座標，系統會使用上面設定的 GPS
  "timestamp": 1737363092720,
  "beacons": [...]
}
```

**結果：** 位置記錄會使用 `25.033964, 121.564468`

---

## 📊 三種接收器的最佳實踐

### 1. 移動接收器（手機 App）

```kotlin
// 提供實時 GPS
val payload = BeaconUploadPayload(
    gateway_id = getDeviceId(),
    lat = currentLocation.latitude,   ✅ 必須提供
    lng = currentLocation.longitude,  ✅ 必須提供
    timestamp = System.currentTimeMillis(),
    beacons = scannedBeacons
)
```

### 2. 固定接收器（無 GPS）

```kotlin
// 完全省略座標
val payload = BeaconUploadPayload(
    gateway_id = "FIXED-001",
    // lat 和 lng 不提供  ✅ 推薦
    timestamp = System.currentTimeMillis(),
    beacons = scannedBeacons
)

// 系統會使用資料庫中預設的座標
```

### 3. 固定接收器（有備用座標）

```kotlin
// 提供備用座標
val payload = BeaconUploadPayload(
    gateway_id = "FIXED-002",
    lat = 0.0,    // 備用值
    lng = 0.0,    // 備用值
    timestamp = System.currentTimeMillis(),
    beacons = scannedBeacons
)

// 系統會優先使用資料庫座標
```

---

## ⚠️ 重要提醒

### 固定設備必須在後台設定座標

如果固定設備：
1. **不上傳座標**
2. **資料庫也沒有設定座標**

結果：位置會是 `(0, 0)`，地圖連結會失效

**解決方法：**
- 在後台「接收點管理」中編輯 Gateway
- 填寫正確的 GPS 座標

---

## 🎉 優點總結

### 1. 靈活性
- ✅ 移動設備可以提供實時 GPS
- ✅ 固定設備可以省略座標
- ✅ 支援混合場景

### 2. 簡化開發
- ✅ 固定設備不需要取得 GPS 權限
- ✅ 不需要偽造座標
- ✅ 程式碼更簡潔

### 3. 資源節省
- ✅ 固定設備不需要 GPS 模組
- ✅ 省電（不啟動 GPS）
- ✅ 減少資料傳輸量

### 4. 集中管理
- ✅ 固定設備的座標在後台統一管理
- ✅ 修改座標不需要更新 App
- ✅ 更易於維護

---

## 🔗 API 端點

```
主要: https://receivebeacondata-kmzfyt3t5a-uc.a.run.app
備用: https://us-central1-safe-net-tw.cloudfunctions.net/receiveBeaconData
```

**兩個端點都支援座標選填！**

---

**部署日期：** 2026-01-20  
**功能：** 座標選填（lat/lng optional）  
**測試狀態：** ✅ 通過所有測試
