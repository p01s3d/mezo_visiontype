import { useCallback, useEffect, useState } from 'react';
import {
  fetchProtocols,
  fetchYieldPools,
  type Protocol,
  type YieldPool,
} from '../api/defillama';

type DefiDataState = {
  pools: YieldPool[];
  protocols: Protocol[];
  loading: boolean;
  error: string | null;
  updatedAt: Date | null;
  refresh: () => void;
};

export function useDefiData(): DefiDataState {
  const [pools, setPools] = useState<YieldPool[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextPools, nextProtocols] = await Promise.all([fetchYieldPools(), fetchProtocols()]);
      setPools(nextPools);
      setProtocols(nextProtocols);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load DeFi data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void load();
    }, 5 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [load]);

  return {
    pools,
    protocols,
    loading,
    error,
    updatedAt,
    refresh: load,
  };
}
