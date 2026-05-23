import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { authClient } from '@/lib/auth';
import type { ImpressionsHistoryData } from '@/types/dashboard';

interface UseImpressionsHistoryResult {
  data: ImpressionsHistoryData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useImpressionsHistory(accountId: number | null = null): UseImpressionsHistoryResult {
  const [data, setData] = useState<ImpressionsHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchImpressionsHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await authClient.getSession();

      if (!session?.data?.session?.token) {
        throw new Error('Not authenticated');
      }

      const url = accountId
        ? `${API_BASE_URL}/api/stats/impressions-history?accountId=${accountId}`
        : `${API_BASE_URL}/api/stats/impressions-history`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.data.session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch impressions history: ${response.statusText}`);
      }

      const result = await response.json() as ImpressionsHistoryData & { success: boolean };
      setData({
        dailyImpressions: result.dailyImpressions,
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
    fetchImpressionsHistory();
  }, [fetchImpressionsHistory]);

  return { data, isLoading, error, refetch: fetchImpressionsHistory };
}
