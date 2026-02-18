import { useCallback, useState } from 'react';

interface UsePegaApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function usePegaApi<T>() {
  const [state, setState] = useState<UsePegaApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setState({ data: null, loading: false, error: message });
      throw err;
    }
  }, []);

  return { ...state, execute };
}
