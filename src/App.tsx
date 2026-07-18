import { useCallback, useMemo, useState } from 'react';
import type { ColorScheme } from '@coinbase/cds-common';
import { ThemeProvider } from '@coinbase/cds-web';
import { PortalProvider } from '@coinbase/cds-web/overlays';
import { defiTheme } from './theme/defiTheme';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { MediaQueryProvider } from '@coinbase/cds-web/system';
import { Navbar } from './components/Navbar';
import { AssetList } from './components/AssetList';
import { HomeDashboard, HoldingsView, PoolsView, TransactionsView } from './components/Home';
import { DefiSidebar } from './components/Sidebar';
import { WorkflowGuide } from './components/WorkflowGuide';
import { MezoApp } from './components/Mezo/MezoApp';
import { ALL_NAV } from './data/navConfig';
import { DEMO_POOL_POSITIONS } from './data/demoPools';
import { useDefiData } from './hooks/useDefiData';
import { usePositionHealth } from './hooks/usePositionHealth';
import { clearWalletChartCache, useWalletBalanceChart } from './hooks/useWalletBalanceChart';
import { clearFungibleChartsMemory } from './hooks/useFungibleCharts';
import { clearSleeveReturnsCache } from './hooks/useSleeveMonthPerformance';
import { useWalletLpTransactions } from './hooks/useWalletLpTransactions';
import { useWalletPositions } from './hooks/useWalletPositions';
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
  const displayPoolPositions = isConnected ? poolPositions : DEMO_POOL_POSITIONS;

  const displayTotal = totalBalanceUsd ?? 0;
  const balanceChart = useWalletBalanceChart(
    address,
    isConnected,
    displayTotal,
    chartPeriod,
    chartRefreshEpoch,
  );
  const bentoChart = useWalletBalanceChart(
    address,
    isConnected,
    displayTotal,
    'month',
    chartRefreshEpoch,
  );

  const health = usePositionHealth({
    address,
    walletTokens,
    poolPositions: displayPoolPositions,
    personalPositions,
    yieldPools: pools,
    protocols,
    enabled: isHome && isConnected && !personalLoading && !loading && !balanceChart.loading,
    dataLoading: personalLoading || loading || balanceChart.loading,
    vsBtcPct: bentoChart.vsBtcPct ?? balanceChart.vsBtcPct,
    portfolioChangePct: balanceChart.portfolioChangePct,
    rawPortfolioValues: bentoChart.rawPortfolioValues.length
      ? bentoChart.rawPortfolioValues
      : balanceChart.rawPortfolioValues,
    portfolioSeries: bentoChart.portfolioValues.length
      ? bentoChart.portfolioValues
      : balanceChart.portfolioValues,
    btcSeries: bentoChart.btcOverlayValues ?? balanceChart.btcOverlayValues,
    lpTransactions,
  });

  const flaggedTxIds = useMemo(
    () =>
      riskyTransactionIds(lpTransactions, displayPoolPositions, health.verdictsByPositionId),
    [lpTransactions, displayPoolPositions, health.verdictsByPositionId],
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

  const navbarTitle = showGuide ? 'Build guide' : activeNavItem.title;

  return (
    <MediaQueryProvider>
      <ThemeProvider theme={defiTheme} activeColorScheme={activeColorScheme}>
        <PortalProvider>
          <TradeIntentProvider>
          <HStack alignItems="stretch" background="bg" height="100vh" overflow="hidden" width="100%">
            <DefiSidebar activeIndex={activeNavIndex} onSelect={handleNavSelect} />
            <VStack flexGrow={1} minHeight={0} overflow="auto" width="100%" zIndex={0}>
            <Navbar
              alerts={health.alerts}
              onClearToast={health.clearToast}
              onMarkAlertRead={health.markAlertRead}
              onMarkAlertsRead={health.markAlertsRead}
              onRefresh={isConnected ? handleHomeRefresh : undefined}
              refreshing={personalLoading || health.aiLoading || balanceChart.loading}
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
                bentoBtcSeries={bentoChart.btcOverlayValues}
                bentoInsights={health.bentoInsights}
                coachInsight={health.coachInsight}
                bentoLoading={bentoChart.loading}
                bentoPortfolioSeries={bentoChart.portfolioValues}
                bentoRawValues={bentoChart.rawPortfolioValues}
                bentoTimestamps={bentoChart.timestamps}
                bentoVsBtcPct={bentoChart.vsBtcPct}
                chartLoading={balanceChart.loading}
                chartPeriod={chartPeriod}
                chartTimestamps={balanceChart.timestamps}
                chartValues={balanceChart.portfolioValues}
                health={health.health}
                isConnected={isConnected}
                missingApiKey={missingApiKey}
                missingOpenRouterKey={health.missingOpenRouterKey}
                onAllocationNavigate={handleAllocationNavigate}
                onChartPeriodChange={setChartPeriod}
                personalLoading={personalLoading}
                poolPositions={displayPoolPositions}
                portfolioChangePct={balanceChart.portfolioChangePct}
                protocols={protocols}
                rawChartValues={balanceChart.rawPortfolioValues}
                refreshEpoch={chartRefreshEpoch}
                totalBalanceUsd={totalBalanceUsd}
                walletTokens={walletTokens}
              />
            ) : isHoldings ? (
              <HoldingsView
                initialCategory={holdingsCategory}
                isConnected={isConnected}
                loading={personalLoading}
                totalBalanceUsd={totalBalanceUsd}
                verdictsByPositionId={health.verdictsByPositionId}
                walletTokens={walletTokens}
              />
            ) : isPools ? (
              <PoolsView
                apiKeyIssue={apiKeyIssue}
                isConnected={isConnected}
                loading={personalLoading}
                missingApiKey={missingApiKey}
                poolPositions={displayPoolPositions}
                verdictsByPositionId={health.verdictsByPositionId}
              />
            ) : isTransactions ? (
              <TransactionsView
                flaggedTransactionIds={flaggedTxIds}
                isConnected={isConnected}
                loading={lpTransactionsLoading || personalLoading}
                lpTransactions={lpTransactions}
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
                      personalPositions={personalPositions}
                      walletTokens={walletTokens}
                      loading={loading}
                      personalLoading={personalLoading}
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
                      isConnected={isConnected}
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
