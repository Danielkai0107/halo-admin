/**
 * 切版模式配置
 * 將此設定為 true 即可使用假資料進行切版開發
 * 設定為 false 則使用真實的 Firebase 資料和 LINE 登入
 */
export const MOCK_MODE = false; // 改為 false 啟用真實登入

/**
 * 假資料配置
 */
export const MOCK_DATA = {
  // 假的用戶資料
  user: {
    userId: "mock-user-001",
    displayName: "測試用戶",
    pictureUrl: undefined,
    email: "test@example.com",
  },

  // 假的 tenant 資料
  tenant: {
    id: "mock-tenant-001",
    code: "MOCK001",
    name: "示範社區",
    address: "台北市信義區信義路五段7號",
    contactPhone: "02-1234-5678",
    contactEmail: "demo@example.com",
    isActive: true,
    settings: {
      enableNotifications: true,
      enableGPS: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // 假的權限設定
  permissions: {
    isAdmin: true,
    isLoading: false,
    appUserId: "mock-app-user-001",
  },

  // 假的長輩資料
  elders: [
    {
      id: "elder-001",
      tenantId: "mock-tenant-001",
      name: "陳阿公",
      gender: "MALE" as const,
      age: 75,
      phone: "0912-345-678",
      address: "社區 A 棟 3 樓",
      emergencyContact: "陳小明",
      emergencyPhone: "0923-456-789",
      photo: undefined,
      status: "ACTIVE" as const,
      inactiveThresholdHours: 24,
      lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小時前
      isActive: true,
      device: {
        id: "device-001",
        deviceName: "MG6-001",
        uuid: "1-1001",
        macAddress: "AA:BB:CC:DD:EE:01",
        batteryLevel: 85,
        lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30分鐘前
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "elder-002",
      tenantId: "mock-tenant-001",
      name: "王阿嬤",
      gender: "FEMALE" as const,
      age: 72,
      phone: "0933-567-890",
      address: "社區 B 棟 5 樓",
      emergencyContact: "王小華",
      emergencyPhone: "0945-678-901",
      photo: undefined,
      status: "ACTIVE" as const,
      inactiveThresholdHours: 24,
      lastActivityAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5小時前
      isActive: true,
      device: {
        id: "device-002",
        deviceName: "MG6-002",
        uuid: "1-1002",
        macAddress: "AA:BB:CC:DD:EE:02",
        batteryLevel: 45,
        lastSeen: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1小時前
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "elder-003",
      tenantId: "mock-tenant-001",
      name: "李伯伯",
      gender: "MALE" as const,
      age: 68,
      phone: "0956-789-012",
      address: "社區 C 棟 2 樓",
      emergencyContact: "李小芳",
      emergencyPhone: "0967-890-123",
      photo: undefined,
      status: "ACTIVE" as const,
      inactiveThresholdHours: 24,
      lastActivityAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15分鐘前
      isActive: true,
      device: {
        id: "device-003",
        deviceName: "MG6-003",
        uuid: "1-1003",
        macAddress: "AA:BB:CC:DD:EE:03",
        batteryLevel: 92,
        lastSeen: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10分鐘前
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "elder-004",
      tenantId: "mock-tenant-001",
      name: "張奶奶",
      gender: "FEMALE" as const,
      age: 80,
      phone: "0978-901-234",
      address: "社區 A 棟 8 樓",
      emergencyContact: "張大偉",
      emergencyPhone: "0989-012-345",
      photo: undefined,
      status: "HOSPITALIZED" as const,
      inactiveThresholdHours: 24,
      lastActivityAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2天前
      isActive: true,
      device: {
        id: "device-004",
        deviceName: "MG6-004",
        uuid: "1-1004",
        macAddress: "AA:BB:CC:DD:EE:04",
        batteryLevel: 15,
        lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1天前
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "elder-005",
      tenantId: "mock-tenant-001",
      name: "劉爺爺",
      gender: "MALE" as const,
      age: 77,
      phone: "0912-234-567",
      address: "社區 D 棟 6 樓",
      emergencyContact: "劉小美",
      emergencyPhone: "0923-345-678",
      photo: undefined,
      status: "ACTIVE" as const,
      inactiveThresholdHours: 24,
      lastActivityAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1小時前
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],

  // 假的通知點資料
  gateways: [
    {
      id: "gateway-001",
      tenantId: "mock-tenant-001",
      serialNumber: "GW-001",
      name: "社區大門",
      location: "社區正門入口",
      type: "SAFE_ZONE",
      latitude: 25.033,
      longitude: 121.565,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "gateway-002",
      tenantId: "mock-tenant-001",
      serialNumber: "GW-002",
      name: "便利商店",
      location: "社區便利商店",
      type: "OBSERVE_ZONE",
      latitude: 25.034,
      longitude: 121.566,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "gateway-003",
      tenantId: "mock-tenant-001",
      serialNumber: "GW-003",
      name: "社區公園",
      location: "社區後方公園",
      type: "SAFE_ZONE",
      latitude: 25.032,
      longitude: 121.567,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "gateway-004",
      tenantId: "mock-tenant-001",
      serialNumber: "GW-004",
      name: "學校門口",
      location: "附近國小門口",
      type: "SCHOOL_ZONE",
      latitude: 25.035,
      longitude: 121.564,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};
