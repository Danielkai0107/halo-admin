import { create } from 'zustand';
import type { Tenant } from '../types';

interface TenantState {
  selectedTenant: Tenant | null;
  selectTenant: (tenant: Tenant) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  selectedTenant: null,
  selectTenant: (tenant) => set({ selectedTenant: tenant }),
  clearTenant: () => set({ selectedTenant: null }),
}));
