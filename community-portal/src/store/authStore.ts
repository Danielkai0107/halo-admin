import { create } from 'zustand';
import type { SaasUser, Tenant } from '../types';

interface AuthState {
  user: SaasUser | null;
  tenant: Tenant | null;
  loading: boolean;
  setUser: (user: SaasUser | null) => void;
  setTenant: (tenant: Tenant | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  loading: true,
  setUser: (user) => set({ user }),
  setTenant: (tenant) => set({ tenant }),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ user: null, tenant: null, loading: false }),
}));
