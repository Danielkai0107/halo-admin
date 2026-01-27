import { MOCK_DATA } from '../config/mockMode';
import type { Tenant, TenantMember } from '../types';

/**
 * 假資料版本的 useAuth hook
 * 用於切版開發，不需要真實的 Firebase 和 LINE 登入
 */
export const useMockAuth = () => {
  return {
    isLoading: false,
    isAuthenticated: true,
    profile: MOCK_DATA.user,
    appUserId: MOCK_DATA.permissions.appUserId,
    memberships: [] as TenantMember[],
    currentMembership: null,
    isAdmin: MOCK_DATA.permissions.isAdmin,
    error: null,
    tenant: null as Tenant | null,
  };
};
