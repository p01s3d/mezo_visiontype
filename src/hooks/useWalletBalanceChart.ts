import { useEffect, useState } from 'react';
import type { Address } from 'viem';
import {
  fetchBtcBenchmarkChart,
  fetchWalletBalanceChart,
  type ChartPeriod,
  type ChartSeries,
} from '../api/zerion';
import { generateSparklineValues } from '../utils/chartData';
import { buildRelativeOverlay, rebaseTo100, vsBtcDeltaPct } from '../utils/chartSeries';
import {
  isCacheFresh,
  isCacheUsable,
  readJsonCache,
  walletChartCacheKey,
  writeJsonCache,
  clearWalletChartCache as clearPersistedChartCache,
} from '../utils/walletDataCache';

export type BalanceChartState = {
  portfolioValues: number[];
  /** Raw USD series for signal math (drawdown) and expanded scrubbing chart. */
  rawPortfolioValues: number[];
  /** Unix seconds aligned with rawPortfolioValues when from API / demo. */
  timestamps: number[];
  btcOverlayValues: number[] | null;
  portfolioChangePct: number;
  vsBtcPct: number | null;
  loading: boolean;
  fromApi: boolean;
  period: ChartPeriod;
};

type ChartCache = {
  address: string;
  period: ChartPeriod;
  state: Omit<BalanceChartState, 'loading'>;
  fetchedAt: number;
};

const chartMemory = new Map<string, ChartCache>();

function demoSeed(period: ChartPeriod): string {
  return `portfolio-${period}`;
}

function demoPointCount(period: ChartPeriod): number {
  switch (period) {
    case 'hour':
      return 24;
    case 'day':
      return 48;
    case 'week':
      return 56;
    case 'month':
      return 60;
    case 'year':
    case 'max':
      return 90;
    default:
      return 72;
  }
}

function demoTimestamps(count: number, period: ChartPeriod): number[] {
  const now = Math.floor(Date.now() / 1000);
  const stepSeconds =
    period === 'hour'
      ? 60
      : period === 'day'
        ? 30 * 60
        : period === 'week'
          ? 3 * 3600
          : period === 'month'
            ? 12 * 3600
            : 24 * 3600;
  return Array.from({ length: count }, (_, index) => now - (count - 1 - index) * stepSeconds);
}

function demoBalanceChart(totalUsd: number, period: ChartPeriod): BalanceChartState {
  const points = demoPointCount(period);
  const portfolioValues = generateSparklineValues(
    demoSeed(period),
    points,
    Math.max(totalUsd, 1),
    totalUsd > 0 ? 'up' : 'flat',
  );
  const btcRaw = generateSparklineValues(`btc-${period}`, points, 100, 'up');
  const timestamps = demoTimestamps(points, period);
  const overlay = buildRelativeOverlay(portfolioValues, timestamps, btcRaw, timestamps);
  const rebased = overlay?.portfolio ?? rebaseTo100(portfolioValues);
  return {
    portfolioValues: rebased,
    rawPortfolioValues: portfolioValues,
    timestamps: overlay?.timestamps ?? timestamps,
    btcOverlayValues: overlay?.btc ?? null,
    portfolioChangePct:
      portfolioValues.length >= 2 && portfolioValues[0] !== 0
        ? ((portfolioValues[portfolioValues.length - 1] - portfolioValues[0]) / portfolioValues[0]) *
          100
        : 0,
    vsBtcPct: overlay?.vsBtcPct ?? vsBtcDeltaPct(portfolioValues, btcRaw, timestamps, timestamps),
    loading: false,
    fromApi: false,
    period,
  };
}

function resolveChartCache(address: Address, period: ChartPeriod): ChartCache | null {
  const key = walletChartCacheKey(address, period);
  const mem = chartMemory.get(key);
  if (mem) return mem;
  const stored = readJsonCache<ChartCache>(key);
  if (!stored || stored.address.toLowerCase() !== address.toLowerCase() || stored.period !== period) {
    return null;
  }
  if (!isCacheUsable(stored.fetchedAt)) return null;
  chartMemory.set(key, stored);
  return stored;
}

function persistChartCache(cache: ChartCache): void {
  const key = walletChartCacheKey(cache.address, cache.period);
  chartMemory.set(key, cache);
  writeJsonCache(key, cache);
}

export function clearWalletChartCache(address: string): void {
  const addr = address.toLowerCase();
  for (const key of [...chartMemory.keys()]) {
    if (key.includes(`:${addr}:`) || key.endsWith(`:${addr}`) || key.includes(`chart:${addr}:`)) {
      chartMemory.delete(key);
    }
  }
  // Keys are `chart:${addr}:${period}`
  for (const period of ['hour', 'day', 'week', 'month', 'year', 'max'] as const) {
    chartMemory.delete(walletChartCacheKey(addr, period));
  }
  clearPersistedChartCache(addr);
}

export function useWalletBalanceChart(
  address: Address | undefined,
  isConnected: boolean,
  totalUsd: number,
  period: ChartPeriod = 'day',
  /** Bump to force refetch after cache clear. */
  refreshEpoch = 0,
): BalanceChartState {
  const [state, setState] = useState<BalanceChartState>(() => {
    if (!isConnected || !address) return demoBalanceChart(totalUsd, period);
    const cached = resolveChartCache(address, period);
    if (cached) {
      return { ...cached.state, loading: !isCacheFresh(cached.fetchedAt), period };
    }
    return { ...demoBalanceChart(totalUsd, period), loading: true, fromApi: false };
  });

  useEffect(() => {
    if (!isConnected || !address) {
      setState(demoBalanceChart(totalUsd, period));
      return;
    }

    let cancelled = false;
    const cached = resolveChartCache(address, period);

    if (cached) {
      setState({ ...cached.state, loading: !isCacheFresh(cached.fetchedAt), period });
      // Incomplete overlay (no BTC) — refetch even if cache is "fresh".
      const overlayOk =
        cached.state.btcOverlayValues != null && cached.state.btcOverlayValues.length >= 2;
      if (isCacheFresh(cached.fetchedAt) && overlayOk) {
        return;
      }
    } else {
      // Keep previous series on screen so CDS can morph into the next period.
      setState((prev) => ({ ...prev, loading: true, period }));
    }

    void (async () => {
      try {
        const [wallet, btc] = await Promise.all([
          fetchWalletBalanceChart(address, period),
          fetchBtcBenchmarkChart(period).catch((err) => {
            console.error('[useWalletBalanceChart] BTC benchmark failed', err);
            return null as ChartSeries | null;
          }),
        ]);

        if (cancelled) return;

        if (wallet.values.length < 2) {
          setState(demoBalanceChart(totalUsd, period));
          return;
        }

        const overlay =
          btc && btc.values.length >= 2 && btc.timestamps.length >= 2
            ? buildRelativeOverlay(
                wallet.values,
                wallet.timestamps,
                btc.values,
                btc.timestamps,
              )
            : null;

        const nextState: Omit<BalanceChartState, 'loading'> = {
          // Rebased + time-aligned when BTC exists; otherwise raw USD (no fake BTC).
          portfolioValues: overlay?.portfolio ?? wallet.values,
          rawPortfolioValues: wallet.values,
          timestamps: overlay?.timestamps ?? wallet.timestamps,
          btcOverlayValues: overlay?.btc ?? null,
          portfolioChangePct: wallet.changePct,
          vsBtcPct: overlay?.vsBtcPct ?? null,
          fromApi: true,
          period,
        };

        persistChartCache({
          address: address.toLowerCase(),
          period,
          state: nextState,
          fetchedAt: Date.now(),
        });

        setState({ ...nextState, loading: false });
      } catch (err) {
        console.error('[useWalletBalanceChart]', err);
        if (!cancelled && !cached) setState(demoBalanceChart(totalUsd, period));
        else if (!cancelled && cached) {
          setState({ ...cached.state, loading: false, period });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected, totalUsd, period, refreshEpoch]);

  return state;
}
