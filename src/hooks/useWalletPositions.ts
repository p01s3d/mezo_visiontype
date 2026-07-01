import { useCallback, useEffect, useState } from 'react';
import type { Address } from 'viem';
import {
  fetchWalletProtocolPositions,
  fetchWalletTokens,
  fetchWalletTotalBalance,
  flattenProtocolPositions,
  hasDebankAccessKey,
  normalizeWalletTokens,
  type PersonalPosition,
  type WalletToken,
} from '../api/debank';

type WalletPositionsState = {
  positions: PersonalPosition[];
  tokens: WalletToken[];
  totalBalanceUsd: number | null;
  loading: boolean;
  error: string | null;
  missingApiKey: boolean;
  updatedAt: Date | null;
  refresh: () => void;
};

export function useWalletPositions(address: Address | undefined): WalletPositionsState {
  const [positions, setPositions] = useState<PersonalPosition[]>([]);
  const [tokens, setTokens] = useState<WalletToken[]>([]);
  const [totalBalanceUsd, setTotalBalanceUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingApiKey, setMissingApiKey] = useState(!hasDebankAccessKey());
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!address) {
      setPositions([]);
      setTokens([]);
      setTotalBalanceUsd(null);
      setError(null);
      setMissingApiKey(!hasDebankAccessKey());
      return;
    }

    if (!hasDebankAccessKey()) {
      setMissingApiKey(true);
      setPositions([]);
      setTokens([]);
      setTotalBalanceUsd(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMissingApiKey(false);

    try {
      const [protocols, totalBalance, rawTokens] = await Promise.all([
        fetchWalletProtocolPositions(address),
        fetchWalletTotalBalance(address),
        fetchWalletTokens(address),
      ]);

      setPositions(flattenProtocolPositions(protocols));
      setTokens(normalizeWalletTokens(rawTokens));
      setTotalBalanceUsd(totalBalance.total_usd_value);
      setUpdatedAt(new Date());
    } catch (err) {
      if (err instanceof Error && err.message === 'MISSING_API_KEY') {
        setMissingApiKey(true);
        setPositions([]);
        setTokens([]);
        setTotalBalanceUsd(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load wallet data');
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
    tokens,
    totalBalanceUsd,
    loading,
    error,
    missingApiKey,
    updatedAt,
    refresh: load,
  };
}
