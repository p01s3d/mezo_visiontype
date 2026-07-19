import { useCallback, useEffect, useRef, useState } from 'react';
import type { Address } from 'viem';
import type { GroupedPoolPosition, PersonalPosition, PoolPositionLeg, WalletToken } from '../api/walletTypes';
import {
  fetchWalletComplexPositions,
  fetchWalletFungiblePnl,
  fetchWalletPortfolio,
  fetchWalletTokens,
  getZerionApiKeyIssue,
} from '../api/zerion';
import type { DataSource } from '../components/AssetList';
import type { DataView } from '../utils/defiViews';
import { groupPoolPositions } from '../utils/groupPoolPositions';
import {
  collectFungibleIds,
  type FungiblePnlStats,
  withPoolUnrealizedPnl,
} from '../utils/poolPnl';
import {
  clearWalletPositionsCache,
  isCacheFresh,
  isCacheUsable,
  readJsonCache,
  walletPositionsCacheKey,
  writeJsonCache,
} from '../utils/walletDataCache';

type WalletPositionsState = {
  positions: PersonalPosition[];
  poolPositions: GroupedPoolPosition[];
  tokens: WalletToken[];
  totalBalanceUsd: number | null;
  loading: boolean;
  error: string | null;
  missingApiKey: boolean;
  apiKeyIssue: 'missing' | 'empty' | null;
  updatedAt: Date | null;
  /** True when the current book was hydrated from address cache (usable ≤7d). */
  fromCache: boolean;
  /** True while an explicit Refresh is refetching; UI keeps the previous book. */
  isRefreshing: boolean;
  refresh: () => void;
};

type WalletCache = {
  address: Address;
  positions: PersonalPosition[];
  poolLegs: PoolPositionLeg[];
  pnlByFungibleId: Record<string, FungiblePnlStats>;
  tokens: WalletToken[];
  totalBalanceUsd: number | null;
  positionsFetchedAt: number | null;
  pnlFetchedAt: number | null;
  tokensFetchedAt: number | null;
  portfolioFetchedAt: number | null;
};

let walletCache: WalletCache | null = null;

function cacheLatestAt(cache: WalletCache): number | null {
  return (
    cache.portfolioFetchedAt ??
    cache.pnlFetchedAt ??
    cache.positionsFetchedAt ??
    cache.tokensFetchedAt ??
    null
  );
}

function resolveCache(address: Address): WalletCache | null {
  if (walletCache?.address.toLowerCase() === address.toLowerCase()) {
    return walletCache;
  }
  const stored = readJsonCache<WalletCache>(walletPositionsCacheKey(address));
  if (!stored || stored.address.toLowerCase() !== address.toLowerCase()) {
    return null;
  }
  if (!isCacheUsable(cacheLatestAt(stored))) {
    return null;
  }
  walletCache = stored;
  return stored;
}

function persistCache(cache: WalletCache): void {
  walletCache = cache;
  writeJsonCache(walletPositionsCacheKey(cache.address), cache);
}

function applyCacheToState(
  cache: WalletCache,
  wantsPoolPnl: boolean,
  setters: {
    setPositions: (v: PersonalPosition[]) => void;
    setPoolPositions: (v: GroupedPoolPosition[]) => void;
    setTokens: (v: WalletToken[]) => void;
    setTotalBalanceUsd: (v: number | null) => void;
    setUpdatedAt: (v: Date | null) => void;
  },
) {
  setters.setPositions(cache.positions);
  setters.setPoolPositions(buildPoolPositions(cache.poolLegs, cache.pnlByFungibleId, wantsPoolPnl));
  setters.setTokens(cache.tokens);
  setters.setTotalBalanceUsd(cache.totalBalanceUsd);
  const at = cacheLatestAt(cache);
  setters.setUpdatedAt(at ? new Date(at) : null);
}

function needsPersonalPositions(dataSource: DataSource): boolean {
  return dataSource === 'personal' || dataSource === 'home';
}

function needsPoolPositions(dataSource: DataSource): boolean {
  return dataSource === 'home' || dataSource === 'transactions' || dataSource === 'personal';
}

function needsPoolPnl(dataSource: DataSource, view: DataView): boolean {
  return (dataSource === 'personal' && view === 'liquidity') || dataSource === 'home';
}

function needsTokens(dataSource: DataSource): boolean {
  return (
    dataSource === 'tokens' ||
    dataSource === 'home' ||
    dataSource === 'holdings' ||
    dataSource === 'personal'
  );
}

function needsPortfolio(dataSource: DataSource): boolean {
  return (
    dataSource === 'home' ||
    dataSource === 'holdings' ||
    dataSource === 'personal' ||
    dataSource === 'tokens'
  );
}

function buildPoolPositions(
  poolLegs: PoolPositionLeg[],
  pnlByFungibleId: Record<string, FungiblePnlStats>,
  includePnl: boolean,
): GroupedPoolPosition[] {
  const grouped = groupPoolPositions(poolLegs);
  return includePnl ? withPoolUnrealizedPnl(grouped, pnlByFungibleId) : grouped;
}

export function useWalletPositions(
  address: Address | undefined,
  dataSource: DataSource,
  view: DataView = 'dashboard',
): WalletPositionsState {
  const [positions, setPositions] = useState<PersonalPosition[]>([]);
  const [poolPositions, setPoolPositions] = useState<GroupedPoolPosition[]>([]);
  const [tokens, setTokens] = useState<WalletToken[]>([]);
  const [totalBalanceUsd, setTotalBalanceUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingApiKey, setMissingApiKey] = useState(Boolean(getZerionApiKeyIssue()));
  const [apiKeyIssue, setApiKeyIssue] = useState<'missing' | 'empty' | null>(getZerionApiKeyIssue());
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fetchGen = useRef(0);
  const refreshingRef = useRef(false);

  const wantsPersonal = needsPersonalPositions(dataSource);
  const wantsPools = needsPoolPositions(dataSource);
  const wantsPoolPnl = needsPoolPnl(dataSource, view);
  const wantsTokens = needsTokens(dataSource);
  const wantsPortfolio = needsPortfolio(dataSource);

  const endRefresh = useCallback(() => {
    refreshingRef.current = false;
    setIsRefreshing(false);
  }, []);

  const load = useCallback(
    async (force = false) => {
      if (!address) {
        fetchGen.current += 1;
        setPositions([]);
        setPoolPositions([]);
        setTokens([]);
        setTotalBalanceUsd(null);
        setUpdatedAt(null);
        setFromCache(false);
        endRefresh();
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
        setPositions([]);
        setPoolPositions([]);
        setTokens([]);
        setTotalBalanceUsd(null);
        setUpdatedAt(null);
        setFromCache(false);
        endRefresh();
        setLoading(false);
        setError(null);
        return;
      }

      // Don't let a silent effect re-entry cancel/stampede an in-flight Refresh.
      if (!force && refreshingRef.current) {
        return;
      }

      const gen = ++fetchGen.current;

      // Explicit Refresh: keep current book on screen (SWR). Only the navbar spinner moves.
      if (force) {
        clearWalletPositionsCache(address);
        refreshingRef.current = true;
        setIsRefreshing(true);
        setError(null);
        setMissingApiKey(false);
        setApiKeyIssue(null);
      }

      const cache = resolveCache(address);
      const hasCachedPositions = Boolean(cache && isCacheFresh(cache.positionsFetchedAt));
      const hasCachedPnl = Boolean(cache && isCacheFresh(cache.pnlFetchedAt));
      const hasCachedTokens = Boolean(cache && isCacheFresh(cache.tokensFetchedAt));
      const hasCachedPortfolio = Boolean(cache && isCacheFresh(cache.portfolioFetchedAt));
      const needsComplexFetch = wantsPersonal || wantsPools;
      const needsPnlFetch = wantsPoolPnl;

      const allFresh =
        Boolean(cache) &&
        (!wantsPortfolio || hasCachedPortfolio) &&
        (!needsComplexFetch || hasCachedPositions) &&
        (!needsPnlFetch || hasCachedPnl) &&
        (!wantsTokens || hasCachedTokens);

      if (!force) {
        if (cache) {
          applyCacheToState(cache, wantsPoolPnl, {
            setPositions,
            setPoolPositions,
            setTokens,
            setTotalBalanceUsd,
            setUpdatedAt,
          });
          setFromCache(true);
          setMissingApiKey(false);
          setApiKeyIssue(null);
          setError(null);
        } else {
          // Connected, no usable cache — zeros only (never leave prior address / demo).
          setPositions([]);
          setPoolPositions([]);
          setTokens([]);
          setTotalBalanceUsd(null);
          setUpdatedAt(null);
          setFromCache(false);
        }

        if (allFresh) {
          setLoading(false);
          endRefresh();
          return;
        }

        // Stale-while-revalidate: keep cached numbers; skeleton only when empty.
        setLoading(!cache);
        setError(null);
        setMissingApiKey(false);
        setApiKeyIssue(null);
      }

      try {
        let nextPositions = cache?.positions ?? [];
        let nextPoolLegs = cache?.poolLegs ?? [];
        let nextPnlByFungibleId = cache?.pnlByFungibleId ?? {};
        let nextTokens = cache?.tokens ?? [];
        let nextTotal = cache?.totalBalanceUsd ?? null;
        let positionsFetchedAt = cache?.positionsFetchedAt ?? null;
        let pnlFetchedAt = cache?.pnlFetchedAt ?? null;
        let tokensFetchedAt = cache?.tokensFetchedAt ?? null;
        let portfolioFetchedAt = cache?.portfolioFetchedAt ?? null;

        if (wantsPortfolio && (!hasCachedPortfolio || force)) {
          nextTotal = await fetchWalletPortfolio(address);
          portfolioFetchedAt = Date.now();
        }

        if (needsComplexFetch && (!hasCachedPositions || force)) {
          const complex = await fetchWalletComplexPositions(address);
          nextPositions = complex.personalPositions;
          nextPoolLegs = complex.poolLegs;
          positionsFetchedAt = Date.now();
        }

        if (needsPnlFetch && (!hasCachedPnl || force)) {
          const fungibleIds = collectFungibleIds(nextPoolLegs);
          nextPnlByFungibleId = await fetchWalletFungiblePnl(address, fungibleIds);
          pnlFetchedAt = Date.now();
        }

        if (wantsTokens && (!hasCachedTokens || force)) {
          nextTokens = await fetchWalletTokens(address);
          tokensFetchedAt = Date.now();
        }

        if (gen !== fetchGen.current) return;

        const nextCache: WalletCache = {
          address,
          positions: nextPositions,
          poolLegs: nextPoolLegs,
          pnlByFungibleId: nextPnlByFungibleId,
          tokens: nextTokens,
          totalBalanceUsd: nextTotal,
          positionsFetchedAt,
          pnlFetchedAt,
          tokensFetchedAt,
          portfolioFetchedAt,
        };
        persistCache(nextCache);

        // Atomic commit: swap in the new book when the full fetch finishes.
        setPositions(nextPositions);
        setPoolPositions(buildPoolPositions(nextPoolLegs, nextPnlByFungibleId, wantsPoolPnl));
        setTokens(nextTokens);
        setTotalBalanceUsd(nextTotal);
        setFromCache(false);
        setUpdatedAt(
          new Date(portfolioFetchedAt ?? pnlFetchedAt ?? positionsFetchedAt ?? tokensFetchedAt ?? Date.now()),
        );
      } catch (err) {
        if (gen !== fetchGen.current) return;
        // Keep on-screen book if we had cache/state; only error when there was nothing to show.
        if (!cache) {
          setError(err instanceof Error ? err.message : 'Failed to load wallet data');
          setFromCache(false);
        }
      } finally {
        if (gen === fetchGen.current) {
          setLoading(false);
          endRefresh();
        }
      }
    },
    [
      address,
      wantsPersonal,
      wantsPools,
      wantsPoolPnl,
      wantsTokens,
      wantsPortfolio,
      endRefresh,
    ],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return {
    positions,
    poolPositions,
    tokens,
    totalBalanceUsd,
    loading,
    error,
    missingApiKey,
    apiKeyIssue,
    updatedAt,
    fromCache,
    isRefreshing,
    refresh: () => {
      void load(true);
    },
  };
}
