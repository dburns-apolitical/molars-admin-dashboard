import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useAccountFilter() {
  const [searchParams, setSearchParams] = useSearchParams();

  const accountId = searchParams.get('accountId')
    ? Number(searchParams.get('accountId'))
    : null;

  const setAccountId = useCallback(
    (id: number | null) => {
      setSearchParams((prev) => {
        if (id === null) {
          prev.delete('accountId');
        } else {
          prev.set('accountId', String(id));
        }
        return prev;
      });
    },
    [setSearchParams]
  );

  return { accountId, setAccountId };
}
