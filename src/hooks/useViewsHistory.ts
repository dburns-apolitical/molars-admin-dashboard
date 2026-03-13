import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { authClient } from '@/lib/auth';
import type { ViewsHistoryData } from '@/types/dashboard';

interface UseViewsHistoryResult {
  data: ViewsHistoryData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useViewsHistory(accountId: number | null = null): UseViewsHistoryResult {
  const [data, setData] = useState<ViewsHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchViewsHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await authClient.getSession();

      if (!session?.data?.session?.token) {
        throw new Error('Not authenticated');
      }

      const url = accountId
        ? `${API_BASE_URL}/api/stats/views-history?accountId=${accountId}`
        : `${API_BASE_URL}/api/stats/views-history`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.data.session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch views history: ${response.statusText}`);
      }

      const result = await response.json() as ViewsHistoryData & { success: boolean };
      setData({
        dailyViews: result.dailyViews,
        last28DaysTotal: result.last28DaysTotal,
        previous28DaysTotal: result.previous28DaysTotal,
        deltaPercent: result.deltaPercent,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchViewsHistory();
  }, [fetchViewsHistory]);

  return { data, isLoading, error, refetch: fetchViewsHistory };
}
