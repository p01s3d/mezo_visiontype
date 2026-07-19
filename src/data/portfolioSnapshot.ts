import type {
  GroupedPoolPosition,
  LpTransaction,
  PersonalPosition,
  WalletToken,
} from '../api/walletTypes';
import { DEMO_LP_TRANSACTIONS } from './demoLpTransactions';
import { DEMO_NET_WORTH_USD, DEMO_WALLET_TOKENS } from './demoPortfolio';
import { DEMO_PERSONAL_POSITIONS } from './demoPersonalPositions';
import { DEMO_POOL_POSITIONS } from './demoPools';
import { DEMO_BENTO_CHART } from './demoHealthScore';

export type WalletDataMode = 'demo' | 'live' | 'empty';
export type SnapshotSource = 'demo' | 'cache' | 'network' | 'none';
export type EmptyReason =
  | 'no_cache'
  | 'no_network'
  | 'fetch_error'
  | 'wallet_empty'
  | 'refreshing';

export type ChartSlice = {
  portfolioValues: number[];
  rawPortfolioValues: number[];
  rawTimestamps: number[];
  /** Overlay axis timestamps (aligned with portfolioValues / btc). */
  timestamps: number[];
  btcOverlayValues: number[] | null;
  portfolioChangePct: number;
  vsBtcPct: number | null;
  fromApi: boolean;
  loading: boolean;
};

export type PortfolioSnapshot = {
  mode: WalletDataMode;
  source: SnapshotSource;
  emptyReason?: EmptyReason;
  fetchedAt: number | null;
  bookLoading: boolean;
  chartLoading: boolean;
  totalBalanceUsd: number;
  walletTokens: WalletToken[];
  poolPositions: GroupedPoolPosition[];
  personalPositions: PersonalPosition[];
  lpTransactions: LpTransaction[];
  balanceChart: ChartSlice;
  bentoChart: ChartSlice;
};

const EMPTY_CHART: ChartSlice = {
  portfolioValues: [],
  rawPortfolioValues: [],
  rawTimestamps: [],
  timestamps: [],
  btcOverlayValues: null,
  portfolioChangePct: 0,
  vsBtcPct: null,
  fromApi: false,
  loading: false,
};

function demoChartFromBento(loading = false): ChartSlice {
  return {
    portfolioValues: DEMO_BENTO_CHART.portfolio,
    rawPortfolioValues: DEMO_BENTO_CHART.raw,
    rawTimestamps: DEMO_BENTO_CHART.timestamps,
    timestamps: DEMO_BENTO_CHART.timestamps,
    btcOverlayValues: DEMO_BENTO_CHART.btc,
    portfolioChangePct: 5.13,
    vsBtcPct: DEMO_BENTO_CHART.vsBtcPct,
    fromApi: false,
    loading,
  };
}

export function buildDemoSnapshot(parts?: {
  balanceChart?: ChartSlice;
  bentoChart?: ChartSlice;
}): PortfolioSnapshot {
  return {
    mode: 'demo',
    source: 'demo',
    fetchedAt: null,
    bookLoading: false,
    chartLoading: false,
    totalBalanceUsd: DEMO_NET_WORTH_USD,
    walletTokens: DEMO_WALLET_TOKENS,
    poolPositions: DEMO_POOL_POSITIONS,
    personalPositions: DEMO_PERSONAL_POSITIONS,
    lpTransactions: DEMO_LP_TRANSACTIONS,
    balanceChart: parts?.balanceChart ?? demoChartFromBento(),
    bentoChart: parts?.bentoChart ?? demoChartFromBento(),
  };
}

export function buildEmptySnapshot(
  reason: EmptyReason,
  meta?: { bookLoading?: boolean; chartLoading?: boolean; fetchedAt?: number | null },
): PortfolioSnapshot {
  return {
    mode: 'empty',
    source: 'none',
    emptyReason: reason,
    fetchedAt: meta?.fetchedAt ?? null,
    bookLoading: meta?.bookLoading ?? false,
    chartLoading: meta?.chartLoading ?? false,
    totalBalanceUsd: 0,
    walletTokens: [],
    poolPositions: [],
    personalPositions: [],
    lpTransactions: [],
    balanceChart: { ...EMPTY_CHART, loading: meta?.chartLoading ?? false },
    bentoChart: { ...EMPTY_CHART, loading: meta?.chartLoading ?? false },
  };
}

export type LiveSnapshotParts = {
  source: 'cache' | 'network';
  fetchedAt?: number | null;
  bookLoading?: boolean;
  chartLoading?: boolean;
  totalBalanceUsd: number;
  walletTokens: WalletToken[];
  poolPositions: GroupedPoolPosition[];
  personalPositions: PersonalPosition[];
  lpTransactions: LpTransaction[];
  balanceChart: ChartSlice;
  bentoChart: ChartSlice;
};

export function buildLiveSnapshot(parts: LiveSnapshotParts): PortfolioSnapshot {
  return {
    mode: 'live',
    source: parts.source,
    fetchedAt: parts.fetchedAt ?? null,
    bookLoading: parts.bookLoading ?? false,
    chartLoading: parts.chartLoading ?? false,
    totalBalanceUsd: parts.totalBalanceUsd,
    walletTokens: parts.walletTokens,
    poolPositions: parts.poolPositions,
    personalPositions: parts.personalPositions,
    lpTransactions: parts.lpTransactions,
    balanceChart: parts.balanceChart,
    bentoChart: parts.bentoChart,
  };
}

export function emptyReasonTitle(reason: EmptyReason | undefined): string {
  return reason === 'refreshing' ? 'Refreshing' : 'No wallet data';
}

export function emptyReasonMessage(reason: EmptyReason | undefined): string {
  switch (reason) {
    case 'refreshing':
      return 'Fetching a fresh snapshot from Zerion…';
    case 'fetch_error':
      return 'Could not load wallet data. Values stay at zero until Refresh succeeds.';
    case 'wallet_empty':
      return 'This wallet has no balances or positions yet. Values stay at zero.';
    case 'no_network':
      return 'No new data from the network. Values stay at zero until Refresh succeeds.';
    case 'no_cache':
    default:
      return 'No cached data for this wallet. Values stay at zero until data loads — try Refresh.';
  }
}

export function chartSliceFromHook(chart: {
  portfolioValues: number[];
  rawPortfolioValues: number[];
  rawTimestamps?: number[];
  timestamps: number[];
  btcOverlayValues: number[] | null;
  portfolioChangePct: number;
  vsBtcPct: number | null;
  fromApi: boolean;
  loading: boolean;
}): ChartSlice {
  const raw = Array.isArray(chart.rawPortfolioValues) ? chart.rawPortfolioValues : [];
  const portfolio = Array.isArray(chart.portfolioValues) ? chart.portfolioValues : [];
  let rawTimestamps = Array.isArray(chart.rawTimestamps) ? chart.rawTimestamps : [];
  let timestamps = Array.isArray(chart.timestamps) ? chart.timestamps : [];

  // Legacy / partial state: recover raw timestamps from overlay axis when lengths match.
  if (rawTimestamps.length !== raw.length && timestamps.length === raw.length) {
    rawTimestamps = timestamps;
  }
  if (timestamps.length !== portfolio.length && rawTimestamps.length === portfolio.length) {
    timestamps = rawTimestamps;
  }

  return {
    portfolioValues: portfolio,
    rawPortfolioValues: raw,
    rawTimestamps,
    timestamps,
    btcOverlayValues: chart.btcOverlayValues,
    portfolioChangePct: chart.portfolioChangePct,
    vsBtcPct: chart.vsBtcPct,
    fromApi: chart.fromApi,
    loading: chart.loading,
  };
}

function isLiveSeries(slice: ChartSlice): boolean {
  return (
    slice.fromApi &&
    slice.rawPortfolioValues.length >= 2 &&
    slice.rawTimestamps.length === slice.rawPortfolioValues.length
  );
}

/** Prefer month bento; fall back to day balance chart. Live API series only. */
export function pickLiveBentoChart(month: ChartSlice, day: ChartSlice): ChartSlice {
  if (isLiveSeries(month)) return month;
  if (isLiveSeries(day)) return day;
  // Month may still be loading while day already landed — prefer day mid-flight.
  if (day.fromApi && day.rawPortfolioValues.length >= 2) {
    return chartSliceFromHook(day);
  }
  if (month.fromApi && month.rawPortfolioValues.length >= 2) {
    return chartSliceFromHook(month);
  }
  return {
    ...EMPTY_CHART,
    loading: month.loading || day.loading,
  };
}

export function hasLiveBook(parts: {
  walletTokens: WalletToken[];
  poolPositions: GroupedPoolPosition[];
  personalPositions: PersonalPosition[];
  totalBalanceUsd: number | null;
}): boolean {
  return (
    parts.walletTokens.length > 0 ||
    parts.poolPositions.length > 0 ||
    parts.personalPositions.length > 0 ||
    (parts.totalBalanceUsd != null && parts.totalBalanceUsd > 0)
  );
}

/** Drop any demo-* rows that must never appear in a live/empty book. */
export function sanitizeLiveBook<T extends { id?: string; groupId?: string; fungibleId?: string | null }>(
  rows: T[],
): T[] {
  return rows.filter((row) => {
    const id = row.id ?? row.groupId ?? '';
    const fungible = row.fungibleId ?? '';
    return !String(id).startsWith('demo-') && !String(fungible).startsWith('demo-');
  });
}
