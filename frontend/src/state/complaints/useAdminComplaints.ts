import { useCallback, useEffect, useState } from 'react';
import type { IComplaint } from '@shared-types/index';
import { apiFetch } from '../../lib/api';

export function useAdminComplaints(token: string | null) {
  const [complaints, setComplaints] = useState<IComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ complaints: IComplaint[] }>('/api/complaints/admin', { token });
      setComplaints(res.complaints);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { complaints, setComplaints, isLoading, error, refresh };
}

