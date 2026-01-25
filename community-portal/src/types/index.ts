// SaaS User (社區管理員)
export interface SaasUser {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  tenantId: string;
  role: 'ADMIN' | 'MEMBER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tenant
export interface Tenant {
  id: string;
  code: string;
  name: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
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

// Device
export interface Device {
  id: string;
  uuid: string;
  major: number;
  minor: number;
  deviceName?: string;
  type: DeviceType;
  bindingType: DeviceBindingType;
  boundTo: string | null;
  boundAt: string | null;
  mapUserNickname?: string | null;
  mapUserAge?: number | null;
  mapUserGender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  tags: string[];
  macAddress?: string;
  batteryLevel?: number;
  lastSeen?: string;
  lastRssi?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  elder?: Elder;
}

export type DeviceType = "IBEACON" | "EDDYSTONE" | "GENERIC_BLE";

export const DeviceType = {
  IBEACON: "IBEACON",
  EDDYSTONE: "EDDYSTONE",
  GENERIC_BLE: "GENERIC_BLE",
} as const;

export type DeviceBindingType = "ELDER" | "MAP_USER" | "UNBOUND" | "ANONYMOUS";

export const DeviceBindingType = {
  ELDER: "ELDER",
  MAP_USER: "MAP_USER",
  UNBOUND: "UNBOUND",
  ANONYMOUS: "ANONYMOUS",
} as const;

// Gateway
export interface Gateway {
  id: string;
  tenantId: string | null;
  serialNumber: string;
  macAddress?: string;
  imei?: string;
  name: string;
  location?: string;
  type: GatewayType;
  latitude?: number;
  longitude?: number;
  deviceInfo?: any;
  isActive: boolean;
  tenant?: Tenant;
}

export type GatewayType = "SCHOOL_ZONE" | "SAFE_ZONE" | "OBSERVE_ZONE" | "INACTIVE";

export const GatewayType = {
  SCHOOL_ZONE: "SCHOOL_ZONE",
  SAFE_ZONE: "SAFE_ZONE",
  OBSERVE_ZONE: "OBSERVE_ZONE",
  INACTIVE: "INACTIVE",
} as const;

// Tenant Notification Point
export interface TenantNotificationPoint {
  id: string;
  tenantId: string;
  gatewayId: string;
  name: string;
  notificationMessage?: string;
  notifyOnElderActivity: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  gateway?: Gateway;
}

// Notification Log (從 activities 查詢而來)
export interface NotificationLog {
  id: string;
  elderId: string;
  elderName: string;
  timestamp: Date | any;
  gatewayId: string;
  gatewayName: string;
  gatewayType: GatewayType;
  latitude?: number;
  longitude?: number;
  rssi?: number;
  triggeredNotification: boolean;
  notificationType: 'LINE' | 'FCM' | null;
  notificationDetails?: {
    sentAt: Date;
    recipientCount: number;
  };
}

// Activity
export interface Activity {
  id: string;
  elderId?: string;
  gatewayId?: string;
  gatewayName?: string;
  gatewayType?: GatewayType;
  timestamp: any;
  rssi?: number;
  latitude?: number;
  longitude?: number;
  bindingType?: DeviceBindingType;
  triggeredNotification?: boolean;
  notificationType?: 'LINE' | 'FCM' | null;
  notificationDetails?: any;
  gateway?: Gateway;
}
