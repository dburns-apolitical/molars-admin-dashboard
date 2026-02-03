import { useEffect, useState, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { authClient } from '@/lib/auth';
import type { PostStatus } from '@/types/dashboard';

export interface PostStatusData {
  id: number;
  status: PostStatus;
  created_at: Date;
  updated_at: Date;
  instagram_post_id: string | null;
  views: number | null;
  video: {
    id: number;
    title: string;
  };
  hook: {
    id: number;
    text: string;
  };
  caption: {
    id: number;
    text: string;
  };
  hashtags: string[];
}

interface PostStatusResponse {
  success: boolean;
  post?: PostStatusData;
  error?: string;
}

interface UsePostStatusResult {
  data: PostStatusData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const POLL_INTERVAL = 10000; // 10 seconds

export function usePostStatus(postId: string | undefined): UsePostStatusResult {
  const [data, setData] = useState<PostStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<number | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!postId) {
      setError(new Error('No post ID provided'));
      setIsLoading(false);
      return;
    }

    try {
      const session = await authClient.getSession();

      if (!session?.data?.session?.token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/post-status?postId=${postId}`,
        {
          headers: {
            Authorization: `Bearer ${session.data.session.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch post status: ${response.statusText}`);
      }

      const result = (await response.json()) as PostStatusResponse;

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch post status');
      }

      if (result.post) {
        setData(result.post);

        // Stop polling if status is terminal (success or failed)
        if (result.post.status === 'success' || result.post.status === 'failed') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    // Initial fetch
    fetchStatus();

    // Set up polling
    intervalRef.current = window.setInterval(fetchStatus, POLL_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStatus]);

  return { data, isLoading, error, refetch: fetchStatus };
}
