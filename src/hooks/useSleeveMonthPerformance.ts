import { useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchFungiblePeriodChanges,
  type ChartPeriod,
} from '../api/zerion';
import type { GroupedPoolPosition, WalletToken } from '../api/walletTypes';
import {
  applyPeriodBarScale,
  computeSleevePerformance,
  computeSleevePerformanceFromReturns,
  demoSleevePerformance,
  selectSleeveChartFungibleIds,
  type SleevePerformance,
} from '../utils/sleevePerformance';
import type { WalletDataMode } from '../data/portfolioSnapshot';
import {
  clearWalletSleeveCache,
  isCacheFresh,
  readJsonCache,
  sleeveReturnsCachePrefix,
  writeJsonCache,
} from '../utils/walletDataCache';

export type SleevePerformancePeriod = Extract<ChartPeriod, 'day' | 'month' | 'year'>;

/** Snapshot status for 30D / 1Y (1D needs no network). */
export type SleeveSnapshotStatus = 'idle' | 'loading' | 'ready' | 'cached' | 'quota' | 'empty';

const FUNGIBLE_ID_LIMIT = 20;

type PeriodReturns = {
  month: Record<string, number>;
  year: Record<string, number>;
  fetchedAt: number;
};

const memoryCache = new Map<string, PeriodReturns>();

function storageKey(idKey: string): string {
  return `${sleeveReturnsCachePrefix()}${idKey}`;
}

function readCache(idKey: string): PeriodReturns | null {
  const mem = memoryCache.get(idKey);
  if (mem) return mem;
  const stored = readJsonCache<PeriodReturns>(storageKey(idKey));
  if (stored?.fetchedAt) {
    memoryCache.set(idKey, stored);
    return stored;
  }
  return null;
}

function writeCache(idKey: string, value: PeriodReturns): void {
  memoryCache.set(idKey, value);
  writeJsonCache(storageKey(idKey), value);
}

function isQuotaError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /rate limit|throttl/i.test(message);
}

/** Clear sleeve snapshots (call from header Refresh). */
export function clearSleeveReturnsCache(): void {
  memoryCache.clear();
  clearWalletSleeveCache();
}

/**
 * Value-weighted sleeve returns for 1D / 30D / 1Y.
 * 1D = position 24h % (free). 30D + 1Y = one fungibles list call, cached 24h until Refresh.
 */
export function useSleeveMonthPerformance(
  walletTokens: WalletToken[],
  poolPositions: GroupedPoolPosition[],
  dataMode: WalletDataMode,
  period: SleevePerformancePeriod = 'month',
  refreshEpoch = 0,
): {
  sleeves: SleevePerformance[];
  loading: boolean;
  status: SleeveSnapshotStatus;
} {
  const hasHoldings = walletTokens.length > 0 || poolPositions.length > 0;
  const enabled = dataMode === 'live' && hasHoldings;
  const fungibleIds = useMemo(
    () => selectSleeveChartFungibleIds(walletTokens, poolPositions, FUNGIBLE_ID_LIMIT),
    [walletTokens, poolPositions],
  );
  const idKey = fungibleIds.join(',');

  const [monthReturns, setMonthReturns] = useState<Record<string, number>>(() => {
    if (!idKey) return {};
    return readCache(idKey)?.month ?? {};
  });
  const [yearReturns, setYearReturns] = useState<Record<string, number>>(() => {
    if (!idKey) return {};
    return readCache(idKey)?.year ?? {};
  });
  const [status, setStatus] = useState<SleeveSnapshotStatus>(() => {
    if (!idKey) return 'idle';
    const cached = readCache(idKey);
    if (!cached) return 'idle';
    return isCacheFresh(cached.fetchedAt) ? 'ready' : 'cached';
  });
  const lastRefreshEpoch = useRef(refreshEpoch);

  useEffect(() => {
    if (!enabled || !idKey) {
      setMonthReturns({});
      setYearReturns({});
      setStatus('idle');
      return;
    }

    const cached = readCache(idKey);
    const forced = refreshEpoch !== lastRefreshEpoch.current;
    lastRefreshEpoch.current = refreshEpoch;

    if (cached) {
      setMonthReturns(cached.month);
      setYearReturns(cached.year);
      setStatus(isCacheFresh(cached.fetchedAt) && !forced ? 'ready' : 'cached');
      if (isCacheFresh(cached.fetchedAt) && !forced) {
        return;
      }
    } else {
      setStatus('loading');
    }

    let cancelled = false;

    void (async () => {
      try {
        const ids = idKey.split(',').filter(Boolean);
        const changes = await fetchFungiblePeriodChanges(ids);
        if (cancelled) return;

        const month: Record<string, number> = {};
        const year: Record<string, number> = {};
        for (const [id, row] of Object.entries(changes)) {
          if (row.percent30d != null) month[id] = row.percent30d;
          if (row.percent365d != null) year[id] = row.percent365d;
        }

        const next: PeriodReturns = { month, year, fetchedAt: Date.now() };
        writeCache(idKey, next);

        setMonthReturns(month);
        setYearReturns(year);
        setStatus(
          Object.keys(month).length === 0 && Object.keys(year).length === 0 ? 'empty' : 'ready',
        );
      } catch (err) {
        if (cancelled) return;
        if (cached) {
          setMonthReturns(cached.month);
          setYearReturns(cached.year);
          setStatus(isQuotaError(err) ? 'quota' : 'cached');
          return;
        }
        setMonthReturns({});
        setYearReturns({});
        setStatus(isQuotaError(err) ? 'quota' : 'empty');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, idKey, refreshEpoch]);

  const sleeves = useMemo(() => {
    if (dataMode === 'demo') return demoSleevePerformance(period);
    if (dataMode === 'empty' || !hasHoldings) {
      return applyPeriodBarScale(computeSleevePerformance([], []), period);
    }

    if (period === 'day') {
      return applyPeriodBarScale(
        computeSleevePerformance(walletTokens, poolPositions),
        'day',
      );
    }

    const returns = period === 'month' ? monthReturns : yearReturns;
    return applyPeriodBarScale(
      computeSleevePerformanceFromReturns(walletTokens, poolPositions, returns),
      period,
    );
  }, [
    dataMode,
    hasHoldings,
    period,
    monthReturns,
    yearReturns,
    walletTokens,
    poolPositions,
  ]);

  const loading = enabled && period !== 'day' && status === 'loading';

  return { sleeves, loading, status };
}
