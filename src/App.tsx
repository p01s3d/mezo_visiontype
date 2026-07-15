import { useCallback, useState } from 'react';
import type { ColorScheme } from '@coinbase/cds-common';
import { ThemeProvider } from '@coinbase/cds-web';
import { PortalProvider } from '@coinbase/cds-web/overlays';
import { defiTheme } from './theme/defiTheme';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { MediaQueryProvider } from '@coinbase/cds-web/system';
import { Navbar } from './components/Navbar';
import { AssetList } from './components/AssetList';
import { HomeDashboard, HoldingsView, TransactionsView } from './components/Home';
import { DefiSidebar } from './components/Sidebar';
import { WorkflowGuide } from './components/WorkflowGuide';
import { MezoApp } from './components/Mezo/MezoApp';
import { ALL_NAV } from './data/navConfig';
import { useDefiData } from './hooks/useDefiData';
import { useWalletPositions } from './hooks/useWalletPositions';
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

const DashboardApp = () => {
  const [showGuide, setShowGuide] = useState(isGuideView);
  const [activeNavIndex, setActiveNavIndex] = useState(0);
  const activeNavItem = ALL_NAV[activeNavIndex];
  const dataSource = activeNavItem.dataSource;
  const isHome = dataSource === 'home';
  const isHoldings = dataSource === 'holdings';
  const isTransactions = dataSource === 'transactions';

  const [activeColorScheme, setActiveColorScheme] = useState<ColorScheme>('light');
  const { address, isConnected } = useConnection();
  const { pools, protocols, loading, error, updatedAt, refresh } = useDefiData();
  const {
    positions: personalPositions,
    tokens: walletTokens,
    totalBalanceUsd,
    loading: personalLoading,
    error: personalError,
    missingApiKey,
    apiKeyIssue,
    updatedAt: personalUpdatedAt,
    refresh: refreshPersonal,
  } = useWalletPositions(address, dataSource);
  const activeView = activeNavItem.view;

  const toggleColorScheme = () => setActiveColorScheme((s) => (s === 'light' ? 'dark' : 'light'));

  const handleNavSelect = useCallback((index: number) => {
    clearGuideFromUrl();
    setShowGuide(false);
    setActiveNavIndex(index);
  }, []);

  const navbarTitle = showGuide ? 'Build guide' : activeNavItem.title;

  return (
    <MediaQueryProvider>
      <ThemeProvider theme={defiTheme} activeColorScheme={activeColorScheme}>
        <PortalProvider>
          <HStack alignItems="stretch" background="bg" height="100vh" overflow="hidden" width="100%">
            <DefiSidebar activeIndex={activeNavIndex} onSelect={handleNavSelect} />
            <VStack flexGrow={1} minHeight={0} overflow="auto" width="100%" zIndex={0}>
            <Navbar title={navbarTitle} toggleColorScheme={toggleColorScheme} />
            {showGuide ? (
              <WorkflowGuide />
            ) : isHome ? (
              <HomeDashboard
                apiKeyIssue={apiKeyIssue}
                isConnected={isConnected}
                missingApiKey={missingApiKey}
                personalLoading={personalLoading}
                totalBalanceUsd={totalBalanceUsd}
                walletTokens={walletTokens}
              />
            ) : isHoldings ? (
              <HoldingsView
                isConnected={isConnected}
                loading={personalLoading}
                totalBalanceUsd={totalBalanceUsd}
                walletTokens={walletTokens}
              />
            ) : isTransactions ? (
              <TransactionsView isConnected={isConnected} loading={personalLoading} />
            ) : (
              <HStack alignItems="flex-start" width="100%">
                <VStack flexGrow={1} maxWidth={720}>
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
                      personalError={personalError}
                      missingApiKey={missingApiKey}
                      apiKeyIssue={apiKeyIssue}
                      updatedAt={updatedAt}
                      personalUpdatedAt={personalUpdatedAt}
                      onRefresh={refresh}
                      onRefreshPersonal={refreshPersonal}
                      pageSize={8}
                    />
                  </Box>
                </VStack>
              </HStack>
            )}
            </VStack>
          </HStack>
        </PortalProvider>
      </ThemeProvider>
    </MediaQueryProvider>
  );
};
