import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { authClient } from '@/lib/auth';

interface ContentItem {
  id: number;
  text: string;
  enabled: boolean;
  created_at: string;
}

interface UseContentResult {
  hooks: ContentItem[];
  captions: ContentItem[];
  isLoading: boolean;
  error: Error | null;
  addHook: (text: string) => Promise<{ success: boolean; error?: string }>;
  addCaption: (text: string) => Promise<{ success: boolean; error?: string }>;
  toggleHook: (id: number, enabled: boolean) => Promise<void>;
  toggleCaption: (id: number, enabled: boolean) => Promise<void>;
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

export function useContent(): UseContentResult {
  const [hooks, setHooks] = useState<ContentItem[]>([]);
  const [captions, setCaptions] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const [hooksRes, captionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/hooks?all=true`, { headers }),
        fetch(`${API_BASE_URL}/api/captions?all=true`, { headers }),
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
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addHook = useCallback(async (text: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/hooks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text }),
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

  const addCaption = useCallback(async (text: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/captions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text }),
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

  return { hooks, captions, isLoading, error, addHook, addCaption, toggleHook, toggleCaption };
}
