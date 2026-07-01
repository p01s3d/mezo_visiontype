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
  updatedAt: Date;
};

let walletCache: WalletCache | null = null;

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

      if (
        !force &&
        walletCache &&
        walletCache.address === address &&
        Date.now() - walletCache.updatedAt.getTime() < 60_000
      ) {
        setPositions(walletCache.positions);
        setTokens(walletCache.tokens);
        setTotalBalanceUsd(walletCache.totalBalanceUsd);
        setUpdatedAt(walletCache.updatedAt);
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
        const needsPositions = dataSource === 'personal';
        const needsTokens = dataSource === 'tokens';
        const requests: Promise<unknown>[] = [fetchWalletPortfolio(address)];

        if (needsPositions) {
          requests.push(fetchWalletProtocolPositions(address));
        }
        if (needsTokens) {
          requests.push(fetchWalletTokens(address));
        }

        const results = await Promise.all(requests);
        const portfolioTotal = results[0] as number;
        let nextPositions = walletCache?.address === address ? walletCache.positions : [];
        let nextTokens = walletCache?.address === address ? walletCache.tokens : [];

        let resultIndex = 1;
        if (needsPositions) {
          nextPositions = results[resultIndex] as PersonalPosition[];
          resultIndex += 1;
        }
        if (needsTokens) {
          nextTokens = results[resultIndex] as WalletToken[];
        }

        const nextUpdatedAt = new Date();
        walletCache = {
          address,
          positions: nextPositions,
          tokens: nextTokens,
          totalBalanceUsd: portfolioTotal,
          updatedAt: nextUpdatedAt,
        };

        setPositions(nextPositions);
        setTokens(nextTokens);
        setTotalBalanceUsd(portfolioTotal);
        setUpdatedAt(nextUpdatedAt);
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
