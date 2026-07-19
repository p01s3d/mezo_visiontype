import { useMemo } from 'react';
import type { Address } from 'viem';
import type {
  GroupedPoolPosition,
  LpTransaction,
  PersonalPosition,
  WalletToken,
} from '../api/walletTypes';
import {
  buildDemoSnapshot,
  buildEmptySnapshot,
  buildLiveSnapshot,
  chartSliceFromHook,
  hasLiveBook,
  pickLiveBentoChart,
  sanitizeLiveBook,
  type ChartSlice,
  type PortfolioSnapshot,
} from '../data/portfolioSnapshot';
import type { BalanceChartState } from './useWalletBalanceChart';

type UsePortfolioSnapshotArgs = {
  address: Address | undefined;
  isConnected: boolean;
  walletTokens: WalletToken[];
  poolPositions: GroupedPoolPosition[];
  personalPositions: PersonalPosition[];
  lpTransactions: LpTransaction[];
  totalBalanceUsd: number | null;
  bookLoading: boolean;
  bookError: string | null;
  fromCache: boolean;
  bookFetchedAt: number | null;
  /** Explicit Navbar / Refresh clear-first in flight. */
  isRefreshing?: boolean;
  balanceChart: BalanceChartState;
  bentoChart: BalanceChartState;
};

function toSlice(chart: BalanceChartState): ChartSlice {
  return chartSliceFromHook(chart);
}

function emptyChartSlice(loading: boolean): ChartSlice {
  return {
    portfolioValues: [],
    rawPortfolioValues: [],
    rawTimestamps: [],
    timestamps: [],
    btcOverlayValues: null,
    portfolioChangePct: 0,
    vsBtcPct: null,
    fromApi: false,
    loading,
  };
}

/**
 * Single gate for demo | live | empty. Connected path never receives DEMO_* data.
 */
export function usePortfolioSnapshot({
  address,
  isConnected,
  walletTokens,
  poolPositions,
  personalPositions,
  lpTransactions,
  totalBalanceUsd,
  bookLoading,
  bookError,
  fromCache,
  bookFetchedAt,
  isRefreshing = false,
  balanceChart,
  bentoChart,
}: UsePortfolioSnapshotArgs): PortfolioSnapshot {
  return useMemo(() => {
    // Sample portfolio only when fully disconnected — never while a wallet session is active.
    if (!isConnected) {
      return buildDemoSnapshot({
        balanceChart: toSlice(balanceChart),
        bentoChart: toSlice(bentoChart),
      });
    }

    // Connected but address not ready yet (wagmi hydration) — zeros, not demo.
    if (!address) {
      return buildEmptySnapshot('no_cache', {
        bookLoading: true,
        chartLoading: true,
        fetchedAt: null,
      });
    }

    const tokens = sanitizeLiveBook(walletTokens);
    const pools = sanitizeLiveBook(poolPositions);
    const personal = sanitizeLiveBook(personalPositions);
    const txs = sanitizeLiveBook(lpTransactions);

    const balance = toSlice(balanceChart);
    const month = toSlice(bentoChart);
    // Only API-backed series — never pass demo sparklines into live snapshot.
    const liveBalance =
      balance.fromApi && balance.rawPortfolioValues.length >= 2
        ? balance
        : emptyChartSlice(balance.loading);
    const liveMonth =
      month.fromApi && month.rawPortfolioValues.length >= 2
        ? month
        : emptyChartSlice(month.loading);
    const bento = pickLiveBentoChart(liveMonth, liveBalance);
    const chartLoading = balance.loading || month.loading;

    const book = hasLiveBook({
      walletTokens: tokens,
      poolPositions: pools,
      personalPositions: personal,
      totalBalanceUsd,
    });
    const chartLive = liveBalance.fromApi || liveMonth.fromApi || bento.fromApi;

    // Refresh is stale-while-revalidate: keep live book/charts on screen; isRefreshing
    // only drives the navbar spinner, not an empty snapshot.
    if (book || chartLive) {
      const source: 'cache' | 'network' =
        fromCache && (bookLoading || !chartLive) ? 'cache' : 'network';
      return buildLiveSnapshot({
        source,
        fetchedAt: bookFetchedAt,
        bookLoading,
        chartLoading,
        totalBalanceUsd: totalBalanceUsd ?? 0,
        walletTokens: tokens,
        poolPositions: pools,
        personalPositions: personal,
        lpTransactions: txs,
        balanceChart: liveBalance,
        bentoChart: bento,
      });
    }

    if (bookLoading || chartLoading) {
      return buildEmptySnapshot(isRefreshing ? 'refreshing' : 'no_cache', {
        bookLoading,
        chartLoading,
        fetchedAt: null,
      });
    }

    if (bookError) {
      return buildEmptySnapshot('fetch_error', { fetchedAt: bookFetchedAt });
    }

    if (totalBalanceUsd === 0 || totalBalanceUsd === null) {
      return buildEmptySnapshot('wallet_empty', { fetchedAt: bookFetchedAt });
    }

    return buildEmptySnapshot('no_network', { fetchedAt: bookFetchedAt });
  }, [
    address,
    isConnected,
    walletTokens,
    poolPositions,
    personalPositions,
    lpTransactions,
    totalBalanceUsd,
    bookLoading,
    bookError,
    fromCache,
    bookFetchedAt,
    isRefreshing,
    balanceChart,
    bentoChart,
  ]);
}
