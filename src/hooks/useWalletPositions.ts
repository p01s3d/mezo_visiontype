import { useCallback, useEffect, useState } from 'react';
import type { Address } from 'viem';
import type { PersonalPosition, WalletToken } from '../api/walletTypes';
import {
  fetchWalletPortfolio,
  fetchWalletProtocolPositions,
  fetchWalletTokens,
  getZerionApiKeyIssue,
} from '../api/zerion';
import type { DataSource } from '../components/AssetList';

type WalletPositionsState = {
  positions: PersonalPosition[];
  tokens: WalletToken[];
  totalBalanceUsd: number | null;
  loading: boolean;
  error: string | null;
  missingApiKey: boolean;
  apiKeyIssue: 'missing' | 'empty' | null;
  updatedAt: Date | null;
  refresh: () => void;
};

type WalletCache = {
  address: Address;
  positions: PersonalPosition[];
  tokens: WalletToken[];
  totalBalanceUsd: number | null;
  positionsFetchedAt: number | null;
  tokensFetchedAt: number | null;
  portfolioFetchedAt: number | null;
};

const CACHE_TTL_MS = 5 * 60 * 1000;

let walletCache: WalletCache | null = null;

function isFresh(timestamp: number | null): boolean {
  return timestamp !== null && Date.now() - timestamp < CACHE_TTL_MS;
}

export function useWalletPositions(
  address: Address | undefined,
  dataSource: DataSource,
): WalletPositionsState {
  const [positions, setPositions] = useState<PersonalPosition[]>([]);
  const [tokens, setTokens] = useState<WalletToken[]>([]);
  const [totalBalanceUsd, setTotalBalanceUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingApiKey, setMissingApiKey] = useState(Boolean(getZerionApiKeyIssue()));
  const [apiKeyIssue, setApiKeyIssue] = useState<'missing' | 'empty' | null>(getZerionApiKeyIssue());
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!address) {
        setPositions([]);
        setTokens([]);
        setTotalBalanceUsd(null);
        setError(null);
        setMissingApiKey(Boolean(getZerionApiKeyIssue()));
        setApiKeyIssue(getZerionApiKeyIssue());
        return;
      }

      const keyIssue = getZerionApiKeyIssue();
      if (keyIssue) {
        setMissingApiKey(true);
        setApiKeyIssue(keyIssue);
        setPositions([]);
        setTokens([]);
        setTotalBalanceUsd(null);
        setError(null);
        return;
      }

      const cache = walletCache?.address === address ? walletCache : null;
      const needsPositions = dataSource === 'personal' || dataSource === 'home';
      const needsTokens = dataSource === 'tokens' || dataSource === 'home' || dataSource === 'holdings';
      const hasCachedPositions = cache && isFresh(cache.positionsFetchedAt);
      const hasCachedTokens = cache && isFresh(cache.tokensFetchedAt);
      const hasCachedPortfolio = cache && isFresh(cache.portfolioFetchedAt);

      if (
        !force &&
        cache &&
        hasCachedPortfolio &&
        (!needsPositions || hasCachedPositions) &&
        (!needsTokens || hasCachedTokens)
      ) {
        setPositions(cache.positions);
        setTokens(cache.tokens);
        setTotalBalanceUsd(cache.totalBalanceUsd);
        setUpdatedAt(
          new Date(cache.portfolioFetchedAt ?? cache.positionsFetchedAt ?? cache.tokensFetchedAt ?? Date.now()),
        );
        setMissingApiKey(false);
        setApiKeyIssue(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      setMissingApiKey(false);
      setApiKeyIssue(null);

      try {
        let nextPositions = cache?.positions ?? [];
        let nextTokens = cache?.tokens ?? [];
        let nextTotal = cache?.totalBalanceUsd ?? null;
        let positionsFetchedAt = cache?.positionsFetchedAt ?? null;
        let tokensFetchedAt = cache?.tokensFetchedAt ?? null;
        let portfolioFetchedAt = cache?.portfolioFetchedAt ?? null;

        if (!hasCachedPortfolio || force) {
          nextTotal = await fetchWalletPortfolio(address);
          portfolioFetchedAt = Date.now();
        }

        if (needsPositions && (!hasCachedPositions || force)) {
          nextPositions = await fetchWalletProtocolPositions(address);
          positionsFetchedAt = Date.now();
        }

        if (needsTokens && (!hasCachedTokens || force)) {
          nextTokens = await fetchWalletTokens(address);
          tokensFetchedAt = Date.now();
        }

        walletCache = {
          address,
          positions: nextPositions,
          tokens: nextTokens,
          totalBalanceUsd: nextTotal,
          positionsFetchedAt,
          tokensFetchedAt,
          portfolioFetchedAt,
        };

        setPositions(nextPositions);
        setTokens(nextTokens);
        setTotalBalanceUsd(nextTotal);
        setUpdatedAt(
          new Date(portfolioFetchedAt ?? positionsFetchedAt ?? tokensFetchedAt ?? Date.now()),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    },
    [address, dataSource],
  );

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
    apiKeyIssue,
    updatedAt,
    refresh: () => {
      void load(true);
    },
  };
}
