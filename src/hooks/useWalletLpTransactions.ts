import { useCallback, useEffect, useRef, useState } from 'react';
import type { Address } from 'viem';
import type { LpTransaction } from '../api/walletTypes';
import { fetchWalletLpTransactions, getZerionApiKeyIssue } from '../api/zerion';
import type { DataSource } from '../components/AssetList';
import {
  clearWalletLpTxCache,
  isCacheFresh,
  isCacheUsable,
  readJsonCache,
  walletLpTxCacheKey,
  writeJsonCache,
} from '../utils/walletDataCache';

type WalletLpTransactionsState = {
  transactions: LpTransaction[];
  loading: boolean;
  error: string | null;
  missingApiKey: boolean;
  apiKeyIssue: 'missing' | 'empty' | null;
  updatedAt: Date | null;
  refresh: () => void;
};

type LpTransactionsCache = {
  address: Address;
  transactions: LpTransaction[];
  fetchedAt: number | null;
};

let lpTransactionsCache: LpTransactionsCache | null = null;

function resolveCache(address: Address): LpTransactionsCache | null {
  if (lpTransactionsCache?.address.toLowerCase() === address.toLowerCase()) {
    return lpTransactionsCache;
  }
  const stored = readJsonCache<LpTransactionsCache>(walletLpTxCacheKey(address));
  if (!stored || stored.address.toLowerCase() !== address.toLowerCase()) {
    return null;
  }
  if (!isCacheUsable(stored.fetchedAt)) {
    return null;
  }
  lpTransactionsCache = stored;
  return stored;
}

function persistCache(cache: LpTransactionsCache): void {
  lpTransactionsCache = cache;
  writeJsonCache(walletLpTxCacheKey(cache.address), cache);
}

function needsLpTransactions(dataSource: DataSource): boolean {
  return dataSource === 'transactions';
}

export function useWalletLpTransactions(
  address: Address | undefined,
  dataSource: DataSource,
): WalletLpTransactionsState {
  const [transactions, setTransactions] = useState<LpTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingApiKey, setMissingApiKey] = useState(Boolean(getZerionApiKeyIssue()));
  const [apiKeyIssue, setApiKeyIssue] = useState<'missing' | 'empty' | null>(getZerionApiKeyIssue());
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const fetchGen = useRef(0);

  const load = useCallback(
    async (force = false) => {
      if (!needsLpTransactions(dataSource)) {
        fetchGen.current += 1;
        setTransactions([]);
        setError(null);
        setLoading(false);
        return;
      }

      if (!address) {
        fetchGen.current += 1;
        setTransactions([]);
        setUpdatedAt(null);
        setLoading(false);
        setError(null);
        setMissingApiKey(Boolean(getZerionApiKeyIssue()));
        setApiKeyIssue(getZerionApiKeyIssue());
        return;
      }

      const keyIssue = getZerionApiKeyIssue();
      if (keyIssue) {
        fetchGen.current += 1;
        setMissingApiKey(true);
        setApiKeyIssue(keyIssue);
        setTransactions([]);
        setUpdatedAt(null);
        setLoading(false);
        setError(null);
        return;
      }

      const gen = ++fetchGen.current;

      // Refresh keeps current txs on screen until the new list arrives.
      if (force) {
        clearWalletLpTxCache(address);
        setError(null);
        setMissingApiKey(false);
        setApiKeyIssue(null);
      }

      const cache = resolveCache(address);
      if (!force && cache) {
        setTransactions(cache.transactions);
        setUpdatedAt(cache.fetchedAt ? new Date(cache.fetchedAt) : null);
        setMissingApiKey(false);
        setApiKeyIssue(null);
        setError(null);
      }

      if (!force && cache && isCacheFresh(cache.fetchedAt)) {
        setLoading(false);
        return;
      }

      if (!force) {
        setLoading(!cache);
        setError(null);
        setMissingApiKey(false);
        setApiKeyIssue(null);
      }

      try {
        const nextTransactions = await fetchWalletLpTransactions(address);
        if (gen !== fetchGen.current) return;
        const next: LpTransactionsCache = {
          address,
          transactions: nextTransactions,
          fetchedAt: Date.now(),
        };
        persistCache(next);
        setTransactions(nextTransactions);
        setUpdatedAt(new Date(next.fetchedAt!));
      } catch (err) {
        if (gen !== fetchGen.current) return;
        if (!cache) {
          setError(err instanceof Error ? err.message : 'Failed to load LP transactions');
        }
      } finally {
        if (gen === fetchGen.current) {
          setLoading(false);
        }
      }
    },
    [address, dataSource],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return {
    transactions,
    loading,
    error,
    missingApiKey,
    apiKeyIssue,
    updatedAt,
    refresh: () => {
      void load(true);
    },
  };
}
