import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { authClient } from '@/lib/auth';
import type { DashboardStats } from '@/types/dashboard';

interface UseStatsResult {
  data: DashboardStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useStats(accountId: number | null = null): UseStatsResult {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await authClient.getSession();

      if (!session?.data?.session?.token) {
        throw new Error('Not authenticated');
      }

      const url = accountId
        ? `${API_BASE_URL}/api/stats?accountId=${accountId}`
        : `${API_BASE_URL}/api/stats`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.data.session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const stats = await response.json() as DashboardStats;
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, isLoading, error, refetch: fetchStats };
}
