import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export function useApi<T>(path: string | null) {
  const { token } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(
    async (silent = false) => {
      if (!path || !token) {
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      }

      try {
        const payload = await apiRequest<T>(path, { token });
        setData(payload);
        setError(null);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          setError(requestError.message);
        } else {
          setError(requestError instanceof Error ? requestError.message : 'Something went wrong.');
        }
      } finally {
        setLoading(false);
      }
    },
    [path, token],
  );

  useFocusEffect(
    useCallback(() => {
      reload(true);
    }, [reload]),
  );

  return { data, error, loading, reload, setData };
}
