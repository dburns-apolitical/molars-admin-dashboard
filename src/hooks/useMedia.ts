import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { authClient } from '@/lib/auth';
import type { MediaItem } from '@/types/dashboard';

interface UseMediaResult {
  media: MediaItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useMedia(accountId: number | null): UseMediaResult {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(accountId !== null);
  const [error, setError] = useState<Error | null>(null);

  const fetchMedia = useCallback(async () => {
    if (accountId === null) {
      setMedia([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const session = await authClient.getSession();
      if (!session?.data?.session?.token) {
        throw new Error('Not authenticated');
      }
      const res = await fetch(
        `${API_BASE_URL}/api/media?accountId=${accountId}`,
        {
          headers: {
            Authorization: `Bearer ${session.data.session.token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch media: ${res.status} ${res.statusText}`);
      }
      const data = await res.json() as { media: MediaItem[] };
      setMedia(data.media);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setMedia([]);
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  return { media, isLoading, error, refetch: fetchMedia };
}
