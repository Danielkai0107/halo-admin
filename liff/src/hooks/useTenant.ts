import { useState, useEffect } from 'react';
import { subscribeToDocument } from '../lib/firestore';
import type { Tenant } from '../types';

export const useTenant = (tenantId: string | null) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // 訂閱社區資料變更
    const unsubscribe = subscribeToDocument<Tenant>(
      'tenants',
      tenantId,
      (data) => {
        setTenant(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId]);

  return { tenant, loading };
};
