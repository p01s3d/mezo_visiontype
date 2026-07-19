import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import type { ColorScheme } from '@coinbase/cds-common';
import { ThemeProvider } from '@coinbase/cds-web';
import { PortalProvider } from '@coinbase/cds-web/overlays';
import { defiTheme } from './theme/defiTheme';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { MediaQueryProvider } from '@coinbase/cds-web/system';
import { Navbar } from './components/Navbar';
import { AssetList } from './components/AssetList';
import { HomeDashboard, HoldingsView, BorrowView, PoolsView, VoteView, TransactionsView } from './components/Home';
import { DefiSidebar } from './components/Sidebar';
import { WorkflowGuide } from './components/WorkflowGuide';
import { MezoApp } from './components/Mezo/MezoApp';
import { ALL_NAV } from './data/navConfig';
import { useDefiData } from './hooks/useDefiData';
import { usePositionHealth } from './hooks/usePositionHealth';
import { clearWalletChartCache, useWalletBalanceChart } from './hooks/useWalletBalanceChart';
import { clearFungibleChartsMemory } from './hooks/useFungibleCharts';
import { clearSleeveReturnsCache } from './hooks/useSleeveMonthPerformance';
import { useWalletLpTransactions } from './hooks/useWalletLpTransactions';
import { useWalletPositions } from './hooks/useWalletPositions';
import { usePortfolioSnapshot } from './hooks/usePortfolioSnapshot';
import { TradeIntentProvider } from './hooks/useTradeIntent';
import type { TokenCategory } from './utils/tokenCategories';
import { riskyTransactionIds } from './utils/transactionHealth';
import type { AllocationDestination } from './components/Home/BalanceBreakdown';
import type { ChartPeriod } from './api/zerion';
import { useConnection } from 'wagmi';

function isGuideView() {
  return new URLSearchParams(window.location.search).has('guide');
}

const IS_TXS_VIEW = new URLSearchParams(window.location.search).has('txs');

function clearGuideFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('guide')) return;
  url.searchParams.delete('guide');
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(null, '', next || url.pathname);
}

export const App = () => {
  // ?txs renders the standalone prototype, bypassing the CDS shell entirely.
  return IS_TXS_VIEW ? <MezoApp /> : <DashboardApp />;
};

const HOLDINGS_NAV_INDEX = ALL_NAV.findIndex((item) => item.id === 'holdings');
const POOLS_NAV_INDEX = ALL_NAV.findIndex((item) => item.id === 'pools');

const DashboardApp = () => {
  const [showGuide, setShowGuide] = useState(isGuideView);
  const [activeNavIndex, setActiveNavIndex] = useState(0);
  const [holdingsCategory, setHoldingsCategory] = useState<TokenCategory | null>(null);
  const activeNavItem = ALL_NAV[activeNavIndex];
  const dataSource = activeNavItem.dataSource;
  const activeView = activeNavItem.view;
  const isHome = dataSource === 'home';
  const isHoldings = dataSource === 'holdings';
  const isTransactions = dataSource === 'transactions';
  const isPools = dataSource === 'personal' && activeView === 'liquidity';
  const isBorrow = activeNavItem.id === 'borrow';
  const isVote = activeNavItem.id === 'vote';

  const [activeColorScheme, setActiveColorScheme] = useState<ColorScheme>('light');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('day');
  const [chartRefreshEpoch, setChartRefreshEpoch] = useState(0);
  const { address, isConnected } = useConnection();
  const { pools, protocols, loading, error, updatedAt, refresh } = useDefiData();
  const {
    positions: personalPositions,
    poolPositions,
    tokens: walletTokens,
    totalBalanceUsd,
    loading: personalLoading,
    error: personalError,
    missingApiKey,
    apiKeyIssue,
    updatedAt: personalUpdatedAt,
    fromCache,
    isRefreshing,
    refresh: refreshPersonal,
  } = useWalletPositions(address, dataSource, activeView);
  const {
    transactions: lpTransactions,
    loading: lpTransactionsLoading,
    error: lpTransactionsError,
    missingApiKey: lpMissingApiKey,
    apiKeyIssue: lpApiKeyIssue,
    refresh: refreshLpTransactions,
  } = useWalletLpTransactions(address, dataSource);

  const displayTotal = totalBalanceUsd ?? 0;
  const balanceChart = useWalletBalanceChart(
    address,
    isConnected,
    displayTotal,
    chartPeriod,
    chartRefreshEpoch,
  );
  /** Dedicated 1D series so Daily Performance matches net-worth day %, not MTD. */
  const dayChart = useWalletBalanceChart(
    address,
    isConnected,
    displayTotal,
    'day',
    chartRefreshEpoch,
  );
  const bentoChart = useWalletBalanceChart(
    address,
    isConnected,
    displayTotal,
    'month',
    chartRefreshEpoch,
  );

  const snapshot = usePortfolioSnapshot({
    address,
    isConnected,
    walletTokens,
    poolPositions,
    personalPositions,
    lpTransactions,
    totalBalanceUsd,
    bookLoading: personalLoading,
    bookError: personalError,
    fromCache,
    bookFetchedAt: personalUpdatedAt?.getTime() ?? null,
    isRefreshing,
    balanceChart,
    bentoChart,
  });

  const needsPositionHealth = isHome || isPools || isHoldings;
  const liveBook = snapshot.mode === 'live';

  const health = usePositionHealth({
    address,
    walletTokens: snapshot.walletTokens,
    poolPositions: snapshot.poolPositions,
    personalPositions: snapshot.personalPositions,
    yieldPools: pools,
    protocols,
    // Book-only gate. DefiLlama / chart loading used to flip enabled off and wipe health
    // (skeleton → blank). Those stay on dataLoading only.
    enabled: needsPositionHealth && liveBook && !snapshot.bookLoading,
    dataLoading: snapshot.bookLoading || loading || snapshot.balanceChart.loading,
    vsBtcPct: snapshot.bentoChart.vsBtcPct,
    portfolioChangePct: snapshot.balanceChart.portfolioChangePct,
    rawPortfolioValues: snapshot.bentoChart.rawPortfolioValues,
    portfolioSeries: snapshot.bentoChart.portfolioValues,
    btcSeries: snapshot.bentoChart.btcOverlayValues,
    lpTransactions: snapshot.lpTransactions,
  });

  const flaggedTxIds = useMemo(
    () =>
      riskyTransactionIds(
        snapshot.lpTransactions,
        snapshot.poolPositions,
        health.verdictsByPositionId,
      ),
    [snapshot.lpTransactions, snapshot.poolPositions, health.verdictsByPositionId],
  );

  const toggleColorScheme = () => setActiveColorScheme((s) => (s === 'light' ? 'dark' : 'light'));

  const handleNavSelect = useCallback((index: number) => {
    clearGuideFromUrl();
    setShowGuide(false);
    if (index === HOLDINGS_NAV_INDEX) {
      setHoldingsCategory(null);
    }
    setActiveNavIndex(index);
  }, []);

  const handleAllocationNavigate = useCallback((destination: AllocationDestination) => {
    clearGuideFromUrl();
    setShowGuide(false);
    if (destination === 'liquidity-pools') {
      setActiveNavIndex(POOLS_NAV_INDEX >= 0 ? POOLS_NAV_INDEX : 0);
      return;
    }
    setHoldingsCategory(destination);
    setActiveNavIndex(HOLDINGS_NAV_INDEX >= 0 ? HOLDINGS_NAV_INDEX : 0);
  }, []);

  const handleHomeRefresh = useCallback(() => {
    if (address) {
      clearWalletChartCache(address);
    }
    clearSleeveReturnsCache();
    clearFungibleChartsMemory();
    setChartRefreshEpoch((n) => n + 1);
    refreshPersonal();
    refreshLpTransactions();
    health.refresh();
  }, [address, refreshPersonal, refreshLpTransactions, health.refresh]);

  const navbarTitle = showGuide ? 'Build a dashboard' : activeNavItem.title;
  const isDemo = snapshot.mode === 'demo';

  return (
    <MediaQueryProvider>
      <ThemeProvider theme={defiTheme} activeColorScheme={activeColorScheme}>
        <PortalProvider>
          <TradeIntentProvider>
          <HStack
            alignItems="stretch"
            background="bg"
            height="100vh"
            overflow="hidden"
            style={
              {
                ['--chart-portfolio' as string]:
                  activeColorScheme === 'dark' ? '#6fc9b6' : '#5db8a6',
                ['--chart-benchmark' as string]:
                  activeColorScheme === 'dark' ? '#f0b86e' : '#e8a55a',
                ['--chart-accent' as string]:
                  activeColorScheme === 'dark' ? '#e08a6e' : '#cc785c',
                ['--chart-secondary' as string]:
                  activeColorScheme === 'dark' ? '#faf9f5' : '#141413',
              } as CSSProperties
            }
            width="100%"
          >
            <DefiSidebar activeIndex={activeNavIndex} onSelect={handleNavSelect} />
            <VStack flexGrow={1} minHeight={0} overflow="auto" width="100%" zIndex={0}>
            <Navbar
              alerts={health.alerts}
              onClearToast={health.clearToast}
              onMarkAlertRead={health.markAlertRead}
              onMarkAlertsRead={health.markAlertsRead}
              onRefresh={isConnected ? handleHomeRefresh : undefined}
              refreshing={
                isRefreshing ||
                snapshot.bookLoading ||
                health.aiLoading ||
                snapshot.balanceChart.loading
              }
              title={navbarTitle}
              toastAlert={health.toastAlert}
              toggleColorScheme={toggleColorScheme}
              unreadAlertCount={health.unreadAlertCount}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: '1 0 auto',
                minHeight: 'calc(100vh - 64px)',
                width: '100%',
              }}
            >
            {showGuide ? (
              <WorkflowGuide />
            ) : isHome ? (
              <HomeDashboard
                aiLoading={health.aiLoading}
                apiKeyIssue={apiKeyIssue}
                bentoBtcSeries={snapshot.bentoChart.btcOverlayValues}
                bentoInsights={health.bentoInsights}
                coachInsight={health.coachInsight}
                bentoLoading={snapshot.bentoChart.loading}
                bentoPortfolioSeries={snapshot.bentoChart.portfolioValues}
                bentoRawTimestamps={snapshot.bentoChart.rawTimestamps}
                bentoRawValues={snapshot.bentoChart.rawPortfolioValues}
                bentoTimestamps={snapshot.bentoChart.timestamps}
                chartLoading={snapshot.balanceChart.loading}
                chartPeriod={chartPeriod}
                chartTimestamps={snapshot.balanceChart.timestamps}
                chartValues={snapshot.balanceChart.portfolioValues}
                dataMode={snapshot.mode}
                dayRawTimestamps={dayChart.rawTimestamps}
                dayRawValues={dayChart.rawPortfolioValues}
                emptyReason={snapshot.emptyReason}
                health={snapshot.mode === 'empty' ? null : health.health}
                missingApiKey={missingApiKey}
                missingOpenRouterKey={health.missingOpenRouterKey}
                onAllocationNavigate={handleAllocationNavigate}
                onChartPeriodChange={setChartPeriod}
                personalLoading={snapshot.bookLoading}
                poolPositions={snapshot.poolPositions}
                portfolioChangePct={snapshot.balanceChart.portfolioChangePct}
                protocols={protocols}
                rawChartValues={snapshot.balanceChart.rawPortfolioValues}
                refreshEpoch={chartRefreshEpoch}
                totalBalanceUsd={snapshot.totalBalanceUsd}
                walletTokens={snapshot.walletTokens}
              />
            ) : isHoldings ? (
              <HoldingsView
                dataMode={snapshot.mode}
                emptyReason={snapshot.emptyReason}
                initialCategory={holdingsCategory}
                loading={snapshot.bookLoading}
                totalBalanceUsd={snapshot.totalBalanceUsd}
                verdictsByPositionId={health.verdictsByPositionId}
                walletTokens={snapshot.walletTokens}
              />
            ) : isPools ? (
              <PoolsView
                apiKeyIssue={apiKeyIssue}
                dataMode={snapshot.mode}
                emptyReason={snapshot.emptyReason}
                loading={snapshot.bookLoading}
                missingApiKey={missingApiKey}
                poolPositions={snapshot.poolPositions}
                verdictsByPositionId={health.verdictsByPositionId}
              />
            ) : isBorrow ? (
              <BorrowView
                apiKeyIssue={apiKeyIssue}
                dataMode={snapshot.mode}
                emptyReason={snapshot.emptyReason}
                loading={snapshot.bookLoading}
                missingApiKey={missingApiKey}
                personalPositions={snapshot.personalPositions}
              />
            ) : isVote ? (
              <VoteView
                apiKeyIssue={apiKeyIssue}
                dataMode={snapshot.mode}
                emptyReason={snapshot.emptyReason}
                loading={snapshot.bookLoading}
                missingApiKey={missingApiKey}
                personalPositions={snapshot.personalPositions}
                walletTokens={snapshot.walletTokens}
              />
            ) : isTransactions ? (
              <TransactionsView
                dataMode={snapshot.mode}
                emptyReason={snapshot.emptyReason}
                flaggedTransactionIds={flaggedTxIds}
                loading={lpTransactionsLoading || snapshot.bookLoading}
                lpTransactions={snapshot.lpTransactions}
                riskyDepositCount={flaggedTxIds.size}
              />
            ) : (
              <HStack alignItems="flex-start" width="100%">
                <VStack flexGrow={1} width="100%">
                  <Box paddingX={2} paddingY={2} width="100%">
                    <AssetList
                      dataSource={dataSource}
                      view={activeView}
                      search=""
                      pools={pools}
                      protocols={protocols}
                      personalPositions={snapshot.personalPositions}
                      walletTokens={snapshot.walletTokens}
                      loading={loading}
                      personalLoading={snapshot.bookLoading}
                      error={error}
                      personalError={personalError ?? lpTransactionsError}
                      missingApiKey={missingApiKey || lpMissingApiKey}
                      apiKeyIssue={apiKeyIssue ?? lpApiKeyIssue}
                      updatedAt={updatedAt}
                      personalUpdatedAt={personalUpdatedAt}
                      onRefresh={refresh}
                      onRefreshPersonal={() => {
                        refreshPersonal();
                        refreshLpTransactions();
                      }}
                      pageSize={8}
                      isConnected={!isDemo}
                    />
                  </Box>
                </VStack>
              </HStack>
            )}
            </div>
            </VStack>
          </HStack>
          </TradeIntentProvider>
        </PortalProvider>
      </ThemeProvider>
    </MediaQueryProvider>
  );
};
