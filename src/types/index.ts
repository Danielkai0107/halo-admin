// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string | null;
  phone?: string;
  avatar?: string;
}

export type UserRole = "SUPER_ADMIN" | "TENANT_ADMIN" | "STAFF";

export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  TENANT_ADMIN: "TENANT_ADMIN",
  STAFF: "STAFF",
} as const;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

// Tenant
export interface Tenant {
  id: string;
  code: string;
  name: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  // LINE 通知設定
  lineLiffId?: string;
  lineLiffEndpointUrl?: string;
  lineChannelAccessToken?: string;
  lineChannelSecret?: string;
  settings?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Elder
export interface Elder {
  id: string;
  tenantId: string;
  name: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate?: string;
  age?: number;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  photo?: string;
  notes?: string;
  status: ElderStatus;
  inactiveThresholdHours: number;
  lastActivityAt?: string;
  lastSeenLocation?: any;
  isActive: boolean;
  deviceId?: string;
  device?: Device;
  tenant?: Tenant;
}

export type ElderStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "HOSPITALIZED"
  | "DECEASED"
  | "MOVED_OUT";

export const ElderStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  HOSPITALIZED: "HOSPITALIZED",
  DECEASED: "DECEASED",
  MOVED_OUT: "MOVED_OUT",
} as const;

// BeaconUUID (服務識別碼管理)
export interface BeaconUUID {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Device
export interface Device {
  id: string;
  tenantId: string | null;
  elderId: string | null;
  // ✅ 核心識別欄位（用於 Beacon 識別）
  uuid: string;           // 必填 - 服務識別碼（所有同公司設備統一）
  major: number;          // 必填 - 群組編號（例如：社區/區域）
  minor: number;          // 必填 - 設備編號（每張卡片唯一）
  // ⚠️ 輔助欄位
  macAddress?: string;    // 選填 - Beacon MAC 會隨機變化，僅供參考
  deviceName?: string;
  type: DeviceType;
  batteryLevel?: number;
  lastSeen?: string;
  lastRssi?: number;
  isActive: boolean;
  elder?: Elder;
}

export type DeviceType = "IBEACON" | "EDDYSTONE" | "GENERIC_BLE";

export const DeviceType = {
  IBEACON: "IBEACON",
  EDDYSTONE: "EDDYSTONE",
  GENERIC_BLE: "GENERIC_BLE",
} as const;

// Gateway
export interface Gateway {
  id: string;
  tenantId: string;
  serialNumber: string;
  macAddress?: string;     // MAC Address for commercial receivers
  imei?: string;           // IMEI for mobile phones
  name: string;
  location?: string;
  type: GatewayType;
  latitude?: number;
  longitude?: number;
  deviceInfo?: any;
  isActive: boolean;
  tenant?: Tenant;
}

export type GatewayType = "GENERAL" | "BOUNDARY" | "MOBILE";

export const GatewayType = {
  GENERAL: "GENERAL",
  BOUNDARY: "BOUNDARY",
  MOBILE: "MOBILE",
} as const;

// Alert
export interface Alert {
  id: string;
  tenantId: string;
  elderId: string;
  gatewayId?: string;
  type: AlertType;
  status: AlertStatus;
  severity: AlertSeverity;
  title: string;
  message: string;
  details?: any;
  latitude?: number;
  longitude?: number;
  triggeredAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  // 警報分配相關
  assignedTo?: string;          // 分配給哪位成員的 appUser ID
  assignedAt?: string;          // 分配時間
  assignmentStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED';  // 分配狀態
  elder?: Elder;
  gateway?: Gateway;
}

export type AlertType =
  | "BOUNDARY"
  | "INACTIVE"
  | "FIRST_ACTIVITY"
  | "LOW_BATTERY"
  | "EMERGENCY";

export const AlertType = {
  BOUNDARY: "BOUNDARY",
  INACTIVE: "INACTIVE",
  FIRST_ACTIVITY: "FIRST_ACTIVITY",
  LOW_BATTERY: "LOW_BATTERY",
  EMERGENCY: "EMERGENCY",
} as const;

export type AlertStatus = "PENDING" | "NOTIFIED" | "RESOLVED" | "DISMISSED";

export const AlertStatus = {
  PENDING: "PENDING",
  NOTIFIED: "NOTIFIED",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED",
} as const;

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const AlertSeverity = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

// API Response
export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Dashboard Stats
export interface DashboardStats {
  tenants: { total: number };
  elders: { total: number; active: number };
  devices: { total: number };
  gateways: { total: number };
  alerts: { pending: number; today: number };
  logs: { today: number };
}
