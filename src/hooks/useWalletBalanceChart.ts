import { useEffect, useRef, useState } from 'react';
import type { Address } from 'viem';
import {
  fetchBtcBenchmarkChart,
  fetchWalletBalanceChart,
  type ChartPeriod,
  type ChartSeries,
} from '../api/zerion';
import { generateSparklineValues } from '../utils/chartData';
import {
  buildRelativeOverlay,
  rebaseTo100,
  rebasedRange,
  vsBtcDeltaPct,
} from '../utils/chartSeries';
import { getPercentChangeFromSeries } from '../utils/chartData';
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
  /** Unix seconds aligned with rawPortfolioValues (daily heatmap / drawdown). */
  rawTimestamps: number[];
  /**
   * Unix seconds for the plotted overlay series (portfolioValues / btcOverlayValues).
   * When BTC is present these are the time-aligned grid — not the raw wallet timestamps.
   */
  timestamps: number[];
  btcOverlayValues: number[] | null;
  portfolioChangePct: number;
  vsBtcPct: number | null;
  /**
   * How portfolio/BTC were paired. Only `time` is honest; missing/legacy with BTC is audited.
   * Index-aligned overlays are stripped on hydrate.
   */
  alignMode?: 'time' | null;
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
  const rebasedAlone = rebaseTo100(portfolioValues);
  const rebased =
    overlay?.portfolio ?? (rebasedAlone.length >= 2 ? rebasedAlone : portfolioValues);
  return {
    portfolioValues: rebased,
    rawPortfolioValues: portfolioValues,
    rawTimestamps: timestamps,
    timestamps: overlay?.timestamps ?? timestamps,
    btcOverlayValues: overlay?.btc ?? null,
    portfolioChangePct: getPercentChangeFromSeries(portfolioValues),
    vsBtcPct: overlay?.vsBtcPct ?? vsBtcDeltaPct(portfolioValues, btcRaw, timestamps, timestamps),
    alignMode: overlay?.alignMode ?? null,
    loading: false,
    fromApi: false,
    period,
  };
}

function emptyChartState(period: ChartPeriod, loading = true): BalanceChartState {
  return {
    portfolioValues: [],
    rawPortfolioValues: [],
    rawTimestamps: [],
    timestamps: [],
    btcOverlayValues: null,
    portfolioChangePct: 0,
    vsBtcPct: null,
    alignMode: null,
    loading,
    fromApi: false,
    period,
  };
}

/**
 * Honest review of cached chart JSON:
 * - lengths must line up
 * - portfolioChangePct / vsBtcPct recomputed from series (never trust stale %)
 * - BTC overlay kept only when time-aligned (or verifiably rebased same length)
 */
function auditChartState(
  state: Omit<BalanceChartState, 'loading'> & { rawTimestamps?: number[]; alignMode?: 'time' | null },
): Omit<BalanceChartState, 'loading'> | null {
  const raw = state.rawPortfolioValues;
  const portfolio = state.portfolioValues;
  if (!Array.isArray(raw) || !Array.isArray(portfolio) || raw.length < 2 || portfolio.length < 2) {
    return null;
  }

  let rawTimestamps = state.rawTimestamps;
  if (!Array.isArray(rawTimestamps) || rawTimestamps.length !== raw.length) {
    // Legacy: timestamps matched raw when there was no BTC overlay remap.
    if (Array.isArray(state.timestamps) && state.timestamps.length === raw.length) {
      rawTimestamps = state.timestamps;
    } else {
      return null;
    }
  }

  let overlayTs =
    Array.isArray(state.timestamps) && state.timestamps.length === portfolio.length
      ? state.timestamps
      : rawTimestamps;

  let btc = Array.isArray(state.btcOverlayValues) ? state.btcOverlayValues : null;
  let alignMode: 'time' | null = state.alignMode === 'time' ? 'time' : null;
  let vsBtcPct: number | null = null;

  if (btc) {
    const lengthsOk =
      btc.length === portfolio.length &&
      overlayTs.length === portfolio.length &&
      btc.length >= 2;
    // Reject index-era overlays: no alignMode and first points not on a shared ~100 baseline.
    const startsRebased =
      lengthsOk &&
      Math.abs(portfolio[0] - 100) < 1 &&
      Math.abs(btc[0] - 100) < 1;
    if (!lengthsOk || (alignMode !== 'time' && !startsRebased)) {
      btc = null;
      alignMode = null;
      // Fall back to raw wallet plot when dishonest BTC is stripped.
      if (portfolio.length !== raw.length) {
        return {
          portfolioValues: raw,
          rawPortfolioValues: raw,
          rawTimestamps,
          timestamps: rawTimestamps,
          btcOverlayValues: null,
          portfolioChangePct: getPercentChangeFromSeries(raw),
          vsBtcPct: null,
          alignMode: null,
          fromApi: true,
          period: state.period,
        };
      }
    } else {
      const p = rebaseTo100(portfolio);
      const b = rebaseTo100(btc);
      // Flat BTC cache = the old zero-start bug; strip it.
      if (p.length >= 2 && b.length >= 2 && rebasedRange(b) >= 0.05) {
        return {
          ...state,
          portfolioValues: p,
          btcOverlayValues: b,
          rawTimestamps,
          timestamps: overlayTs,
          portfolioChangePct: getPercentChangeFromSeries(raw),
          vsBtcPct: p[p.length - 1] - b[b.length - 1],
          alignMode: 'time',
          fromApi: true,
        };
      }
      // Rebase failed (non-positive start) — drop dishonest BTC.
      btc = null;
      alignMode = null;
      if (portfolio.length !== raw.length) {
        return {
          portfolioValues: raw,
          rawPortfolioValues: raw,
          rawTimestamps,
          timestamps: rawTimestamps,
          btcOverlayValues: null,
          portfolioChangePct: getPercentChangeFromSeries(raw),
          vsBtcPct: null,
          alignMode: null,
          fromApi: true,
          period: state.period,
        };
      }
    }
  }

  return {
    ...state,
    rawTimestamps,
    timestamps: overlayTs,
    btcOverlayValues: null,
    portfolioChangePct: getPercentChangeFromSeries(raw),
    vsBtcPct: null,
    alignMode: null,
    fromApi: true,
  };
}

/** Cached series must include raw USD + matching raw timestamps. */
function isChartCacheHydratable(state: Omit<BalanceChartState, 'loading'>): boolean {
  return (
    state.rawPortfolioValues.length >= 2 &&
    state.rawTimestamps.length >= 2 &&
    state.rawTimestamps.length === state.rawPortfolioValues.length &&
    state.portfolioValues.length >= 2 &&
    state.timestamps.length === state.portfolioValues.length &&
    (state.btcOverlayValues == null ||
      (state.btcOverlayValues.length === state.portfolioValues.length &&
        state.alignMode === 'time'))
  );
}

function resolveChartCache(address: Address, period: ChartPeriod): ChartCache | null {
  const key = walletChartCacheKey(address, period);
  const mem = chartMemory.get(key);
  if (mem) {
    const audited = auditChartState(mem.state);
    if (audited && isChartCacheHydratable(audited)) {
      const next = { ...mem, state: audited };
      chartMemory.set(key, next);
      return next;
    }
  }
  const stored = readJsonCache<ChartCache>(key);
  if (!stored || stored.address.toLowerCase() !== address.toLowerCase() || stored.period !== period) {
    return null;
  }
  if (!isCacheUsable(stored.fetchedAt)) return null;
  const audited = auditChartState(stored.state);
  if (!audited || !isChartCacheHydratable(audited)) return null;
  const next = { ...stored, state: audited };
  chartMemory.set(key, next);
  return next;
}

function persistChartCache(cache: ChartCache): void {
  if (!cache.state.fromApi || !isChartCacheHydratable(cache.state)) return;
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
  const fetchGen = useRef(0);
  const lastRefreshEpoch = useRef(refreshEpoch);
  const [state, setState] = useState<BalanceChartState>(() => {
    // Demo charts only when disconnected. Connected-without-address → empty, never sample.
    if (!isConnected) return demoBalanceChart(totalUsd, period);
    if (!address) return emptyChartState(period, true);
    const cached = resolveChartCache(address, period);
    if (cached) {
      return {
        ...cached.state,
        loading: !isCacheFresh(cached.fetchedAt),
        fromApi: true,
        period,
      };
    }
    return emptyChartState(period);
  });

  useEffect(() => {
    if (!isConnected) {
      fetchGen.current += 1;
      setState(demoBalanceChart(totalUsd, period));
      return;
    }
    if (!address) {
      fetchGen.current += 1;
      setState(emptyChartState(period, true));
      return;
    }

    const gen = ++fetchGen.current;
    const forcedByRefresh = refreshEpoch !== lastRefreshEpoch.current;
    lastRefreshEpoch.current = refreshEpoch;
    const cached = resolveChartCache(address, period);

    if (cached) {
      setState({
        ...cached.state,
        loading: !isCacheFresh(cached.fetchedAt) || forcedByRefresh,
        fromApi: true,
        period,
      });
      // Incomplete overlay (no BTC) — refetch even if cache is "fresh".
      const overlayOk =
        cached.state.btcOverlayValues != null && cached.state.btcOverlayValues.length >= 2;
      if (isCacheFresh(cached.fetchedAt) && overlayOk && !forcedByRefresh) {
        return;
      }
    } else {
      // Keep last good chart on Refresh (cache was cleared); blank only when nothing to show.
      setState((prev) => {
        if (prev.fromApi && prev.rawPortfolioValues.length >= 2 && prev.period === period) {
          return { ...prev, loading: true };
        }
        return emptyChartState(period, true);
      });
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

        // Stale effect (Strict Mode / period change) — still persist so the next hydrate works.
        const isStale = gen !== fetchGen.current;

        if (wallet.values.length < 2 || wallet.timestamps.length !== wallet.values.length) {
          if (!isStale) {
            setState(emptyChartState(period, false));
          }
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
          rawTimestamps: wallet.timestamps,
          timestamps: overlay?.timestamps ?? wallet.timestamps,
          btcOverlayValues: overlay?.btc ?? null,
          portfolioChangePct: wallet.changePct,
          vsBtcPct: overlay?.vsBtcPct ?? null,
          alignMode: overlay?.alignMode ?? null,
          fromApi: true,
          period,
        };

        persistChartCache({
          address: address.toLowerCase(),
          period,
          state: nextState,
          fetchedAt: Date.now(),
        });

        if (!isStale) {
          setState({ ...nextState, loading: false });
        }
      } catch (err) {
        console.error('[useWalletBalanceChart]', err);
        if (gen !== fetchGen.current) return;
        const latest = resolveChartCache(address, period);
        if (latest) {
          setState({ ...latest.state, loading: false, fromApi: true, period });
        } else {
          setState(emptyChartState(period, false));
        }
      }
    })();
    // Intentionally omit totalUsd: it only seeds disconnected demo charts; refetching
    // when portfolio total arrives was cancelling in-flight month/day chart requests.
  }, [address, isConnected, period, refreshEpoch]);

  // Connected path: never surface demo sparklines (fromApi false with values).
  if (isConnected && !state.fromApi) {
    return emptyChartState(period, state.loading);
  }

  return state;
}
