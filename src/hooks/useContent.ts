import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { authClient } from '@/lib/auth';
import type { ContentItem } from '@/types/dashboard';

type ContentType = 'hooks' | 'captions';

interface UseContentResult {
  hooks: ContentItem[];
  captions: ContentItem[];
  isLoading: boolean;
  error: Error | null;
  addHook: (text: string, accountIds?: number[]) => Promise<{ success: boolean; error?: string }>;
  addCaption: (text: string, accountIds?: number[]) => Promise<{ success: boolean; error?: string }>;
  toggleHook: (id: number, enabled: boolean) => Promise<void>;
  toggleCaption: (id: number, enabled: boolean) => Promise<void>;
  toggleItemAccount: (type: ContentType, itemId: number, accountId: number, assigned: boolean) => Promise<void>;
}

async function getAuthHeaders() {
  const session = await authClient.getSession();
  if (!session?.data?.session?.token) {
    throw new Error('Not authenticated');
  }
  return {
    'Authorization': `Bearer ${session.data.session.token}`,
    'Content-Type': 'application/json',
  };
}

export function useContent(accountId: number | null = null): UseContentResult {
  const [hooks, setHooks] = useState<ContentItem[]>([]);
  const [captions, setCaptions] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({ all: 'true' });
      if (accountId !== null) params.set('accountId', String(accountId));
      const qs = params.toString();

      const [hooksRes, captionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/hooks?${qs}`, { headers }),
        fetch(`${API_BASE_URL}/api/captions?${qs}`, { headers }),
      ]);

      if (!hooksRes.ok || !captionsRes.ok) {
        throw new Error('Failed to fetch content');
      }

      const hooksData = await hooksRes.json();
      const captionsData = await captionsRes.json();
      setHooks(hooksData.hooks);
      setCaptions(captionsData.captions);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addHook = useCallback(async (text: string, accountIds?: number[]) => {
    try {
      const headers = await getAuthHeaders();
      const body: Record<string, unknown> = { text };
      if (accountIds?.length) body.accountIds = accountIds;
      const res = await fetch(`${API_BASE_URL}/api/hooks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      setHooks(prev => [data.hook, ...prev]);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to add hook' };
    }
  }, []);

  const addCaption = useCallback(async (text: string, accountIds?: number[]) => {
    try {
      const headers = await getAuthHeaders();
      const body: Record<string, unknown> = { text };
      if (accountIds?.length) body.accountIds = accountIds;
      const res = await fetch(`${API_BASE_URL}/api/captions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      setCaptions(prev => [data.caption, ...prev]);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to add caption' };
    }
  }, []);

  const toggleHook = useCallback(async (id: number, enabled: boolean) => {
    setHooks(prev => prev.map(h => h.id === id ? { ...h, enabled } : h));
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/hooks/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        setHooks(prev => prev.map(h => h.id === id ? { ...h, enabled: !enabled } : h));
      }
    } catch {
      setHooks(prev => prev.map(h => h.id === id ? { ...h, enabled: !enabled } : h));
    }
  }, []);

  const toggleCaption = useCallback(async (id: number, enabled: boolean) => {
    setCaptions(prev => prev.map(c => c.id === id ? { ...c, enabled } : c));
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/captions/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        setCaptions(prev => prev.map(c => c.id === id ? { ...c, enabled: !enabled } : c));
      }
    } catch {
      setCaptions(prev => prev.map(c => c.id === id ? { ...c, enabled: !enabled } : c));
    }
  }, []);

  const toggleItemAccount = useCallback(async (type: ContentType, itemId: number, acctId: number, assigned: boolean) => {
    const setter = type === 'hooks' ? setHooks : setCaptions;

    // Optimistic update
    setter(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const accounts = assigned
        ? item.accounts.filter(a => a.id !== acctId)
        : [...item.accounts, { id: acctId, name: '' }];
      return { ...item, accounts };
    }));

    try {
      const headers = await getAuthHeaders();
      if (assigned) {
        // Remove assignment
        const res = await fetch(`${API_BASE_URL}/api/accounts/${acctId}/${type}/${itemId}`, {
          method: 'DELETE',
          headers,
        });
        if (!res.ok) throw new Error('Failed');
      } else {
        // Add assignment
        const idKey = type === 'hooks' ? 'hookIds' : 'captionIds';
        const res = await fetch(`${API_BASE_URL}/api/accounts/${acctId}/${type}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ [idKey]: [itemId] }),
        });
        if (!res.ok) throw new Error('Failed');
      }
      // Refetch to get correct account names
      await fetchAll();
    } catch {
      // Revert on error
      setter(prev => prev.map(item => {
        if (item.id !== itemId) return item;
        const accounts = assigned
          ? [...item.accounts, { id: acctId, name: '' }]
          : item.accounts.filter(a => a.id !== acctId);
        return { ...item, accounts };
      }));
    }
  }, [fetchAll]);

  return { hooks, captions, isLoading, error, addHook, addCaption, toggleHook, toggleCaption, toggleItemAccount };
}
