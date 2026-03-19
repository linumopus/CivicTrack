import { useCallback, useEffect, useMemo, useState } from 'react';
import type { IComplaint } from '@shared-types/index';
import { fetchComplaints } from './complaintsApi';

export function useComplaints() {
  const [complaints, setComplaints] = useState<IComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchComplaints();
      setComplaints(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const byId = useMemo(() => {
    const map = new Map<string, IComplaint>();
    for (const c of complaints) map.set(c._id, c);
    return map;
  }, [complaints]);

  return { complaints, setComplaints, byId, isLoading, error, refresh };
}

