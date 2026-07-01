import { useCallback, useEffect, useState } from 'react';
import type { Address } from 'viem';
import {
  fetchWalletProtocolPositions,
  fetchWalletTotalBalance,
  flattenProtocolPositions,
  hasDebankAccessKey,
  type PersonalPosition,
} from '../api/debank';

type WalletPositionsState = {
  positions: PersonalPosition[];
  totalBalanceUsd: number | null;
  loading: boolean;
  error: string | null;
  missingApiKey: boolean;
  updatedAt: Date | null;
  refresh: () => void;
};

export function useWalletPositions(address: Address | undefined): WalletPositionsState {
  const [positions, setPositions] = useState<PersonalPosition[]>([]);
  const [totalBalanceUsd, setTotalBalanceUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingApiKey, setMissingApiKey] = useState(!hasDebankAccessKey());
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!address) {
      setPositions([]);
      setTotalBalanceUsd(null);
      setError(null);
      setMissingApiKey(!hasDebankAccessKey());
      return;
    }

    if (!hasDebankAccessKey()) {
      setMissingApiKey(true);
      setPositions([]);
      setTotalBalanceUsd(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMissingApiKey(false);

    try {
      const [protocols, totalBalance] = await Promise.all([
        fetchWalletProtocolPositions(address),
        fetchWalletTotalBalance(address),
      ]);

      setPositions(flattenProtocolPositions(protocols));
      setTotalBalanceUsd(totalBalance.total_usd_value);
      setUpdatedAt(new Date());
    } catch (err) {
      if (err instanceof Error && err.message === 'MISSING_API_KEY') {
        setMissingApiKey(true);
        setPositions([]);
        setTotalBalanceUsd(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load wallet positions');
      }
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    positions,
    totalBalanceUsd,
    loading,
    error,
    missingApiKey,
    updatedAt,
    refresh: load,
  };
}
