import { useState, useEffect } from 'react';
import type { ColorScheme } from '@coinbase/cds-common';
import { ThemeProvider } from '@coinbase/cds-web';
import { defaultTheme } from '@coinbase/cds-web/themes/defaultTheme';
import { Box, Divider, HStack, VStack } from '@coinbase/cds-web/layout';
import { Sidebar, SidebarItem } from '@coinbase/cds-web/navigation';
import { MediaQueryProvider } from '@coinbase/cds-web/system';
import { Navbar } from './components/Navbar';
import { AssetList, type DataSource } from './components/AssetList';
import { CDSLogo } from './components/CDSLogo';
import { CardList } from './components/CardList';
import { SearchInput } from '@coinbase/cds-web/controls';
import { Button, ButtonGroup } from '@coinbase/cds-web/buttons';
import { useDefiData } from './hooks/useDefiData';
import { useWalletPositions } from './hooks/useWalletPositions';
import { NAV_VIEWS } from './utils/defiViews';
import { useConnection } from 'wagmi';

const navItems = [
  {
    title: 'Dashboard',
    icon: 'chartPie',
  },
  {
    title: 'Protocols',
    icon: 'defi',
  },
  {
    title: 'Liquidity',
    icon: 'trading',
  },
  {
    title: 'Staking',
    icon: 'giftBox',
  },
  {
    title: 'Swap',
    icon: 'pay',
  },
  {
    title: 'Yield',
    icon: 'cash',
  },
  {
    title: 'Analytics',
    icon: 'newsFeed',
  },
] as const;

export const App = () => {
  const [activeNavIndex, setActiveNavIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [dataSource, setDataSource] = useState<DataSource>('market');
  const activeNavItem = navItems[activeNavIndex];

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
  const activeView = NAV_VIEWS[activeNavIndex];

  useEffect(() => {
    if (isConnected) {
      setDataSource('personal');
    } else {
      setDataSource('market');
    }
  }, [isConnected]);

  const toggleColorScheme = () => setActiveColorScheme((s) => (s === 'light' ? 'dark' : 'light'));

  return (
    <MediaQueryProvider>
      <ThemeProvider theme={defaultTheme} activeColorScheme={activeColorScheme}>
        <HStack background="bg">
          <Sidebar autoCollapse height="100vh" logo={<CDSLogo />}>
            {navItems.map(({ title, icon }, index) => (
              <SidebarItem
                key={title}
                active={index === activeNavIndex}
                icon={icon}
                onClick={() => {
                  setActiveNavIndex(index);
                  setSearch('');
                }}
                title={title}
              />
            ))}
          </Sidebar>
          <VStack width="100%" zIndex={0}>
            <Navbar title={activeNavItem.title} toggleColorScheme={toggleColorScheme} />
            <HStack width="100%">
              <VStack width={{ base: 500, desktop: 660 }}>
                <Box padding={2}>
                  <VStack gap={2}>
                    {isConnected ? (
                      <ButtonGroup accessibilityLabel="Data source">
                        <Button
                          compact
                          onClick={() => setDataSource('personal')}
                          variant={dataSource === 'personal' ? 'primary' : 'secondary'}
                        >
                          My positions
                        </Button>
                        <Button
                          compact
                          onClick={() => setDataSource('tokens')}
                          variant={dataSource === 'tokens' ? 'primary' : 'secondary'}
                        >
                          Tokens
                        </Button>
                        <Button
                          compact
                          onClick={() => setDataSource('market')}
                          variant={dataSource === 'market' ? 'primary' : 'secondary'}
                        >
                          Market
                        </Button>
                      </ButtonGroup>
                    ) : null}
                    <SearchInput
                      compact
                      accessibilityLabel="Search"
                      onChangeText={setSearch}
                      placeholder={
                        dataSource === 'tokens'
                          ? 'Search your tokens'
                          : dataSource === 'personal'
                            ? 'Search your positions'
                            : 'Search positions and protocols'
                      }
                      value={search}
                    />
                  </VStack>
                </Box>
                <Box paddingX={2} width="100%">
                  <AssetList
                    dataSource={dataSource}
                    view={activeView}
                    search={search}
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
                    pageSize={5}
                  />
                </Box>
              </VStack>
              <Divider direction="vertical" />
              <Box paddingX={3} paddingY={2}>
                <CardList
                  pools={pools}
                  loading={loading}
                  totalBalanceUsd={totalBalanceUsd}
                  positionCount={personalPositions.length}
                  tokenCount={walletTokens.length}
                  topToken={walletTokens[0] ?? null}
                  personalLoading={personalLoading}
                />
              </Box>
            </HStack>
          </VStack>
        </HStack>
      </ThemeProvider>
    </MediaQueryProvider>
  );
};
