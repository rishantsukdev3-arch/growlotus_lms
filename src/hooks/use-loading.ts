import { useState, useCallback } from 'react';

export function useLoading() {
  const [loadingKeys, setLoadingKeys] = useState<Record<string, boolean>>({});

  const withLoading = useCallback(
    async (key: string, fn: () => Promise<void>) => {
      if (loadingKeys[key]) return; // already running — ignore double click
      setLoadingKeys(prev => ({ ...prev, [key]: true }));
      try {
        await fn();
      } finally {
        setLoadingKeys(prev => ({ ...prev, [key]: false }));
      }
    },
    [loadingKeys]
  );

  const isLoading = useCallback(
    (key: string) => !!loadingKeys[key],
    [loadingKeys]
  );

  return { withLoading, isLoading };
}