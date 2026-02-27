import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { authClient } from '@/lib/auth';
import type { Evaluation } from '@/types/dashboard';

interface UseEvaluationsResult {
  data: Evaluation[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useEvaluations(limit: number = 50): UseEvaluationsResult {
  const [data, setData] = useState<Evaluation[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvaluations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await authClient.getSession();

      if (!session?.data?.session?.token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/evaluations?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${session.data.session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch evaluations: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result.evaluations);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  return { data, isLoading, error, refetch: fetchEvaluations };
}
