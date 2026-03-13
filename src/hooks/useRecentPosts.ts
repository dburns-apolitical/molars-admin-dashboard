import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { authClient } from '@/lib/auth';
import type { RecentPost } from '@/types/dashboard';

interface UseRecentPostsResult {
  recentPosts: RecentPost[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useRecentPosts(): UseRecentPostsResult {
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecentPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await authClient.getSession();

      if (!session?.data?.session?.token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/stats/recent-posts`, {
        headers: {
          'Authorization': `Bearer ${session.data.session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recent posts: ${response.statusText}`);
      }

      const result = await response.json() as { success: boolean; recentPosts: RecentPost[] };
      setRecentPosts(result.recentPosts);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentPosts();
  }, [fetchRecentPosts]);

  return { recentPosts, isLoading, error, refetch: fetchRecentPosts };
}
