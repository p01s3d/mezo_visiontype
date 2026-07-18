import { useState } from 'react';
import { Banner } from '@coinbase/cds-web/banner';
import { Box, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import type { ChartPeriod } from '../../api/zerion';
import type { Protocol } from '../../api/defillama';
import type { GroupedPoolPosition, WalletToken } from '../../api/walletTypes';
import type { PortfolioHealthScore } from '../../utils/portfolioHealthScore';
import type { BentoInsights } from '../../prompts/portfolioHealthPrompt';
import type { CoachInsight } from '../../utils/coachInsight';
import { BalanceBreakdown, type AllocationDestination } from './BalanceBreakdown';
import { BalanceOverview } from './BalanceOverview';
import { HealthScorePanel } from './HealthScorePanel';
import { PricesSection } from './PricesSection';
import { DashboardSectionDivider, DashboardWithTradeRail } from './TradeRail';

type HomeDashboardProps = {
  walletTokens: WalletToken[];
  poolPositions: GroupedPoolPosition[];
  totalBalanceUsd: number | null;
  personalLoading: boolean;
  missingApiKey: boolean;
  apiKeyIssue: 'missing' | 'empty' | null;
  isConnected: boolean;
  health: PortfolioHealthScore | null;
  bentoInsights?: BentoInsights | null;
  coachInsight?: CoachInsight | null;
  aiLoading: boolean;
  missingOpenRouterKey: boolean;
  onAllocationNavigate?: (destination: AllocationDestination) => void;
  chartValues?: number[];
  rawChartValues?: number[];
  chartTimestamps?: number[];
  portfolioChangePct?: number | null;
  chartLoading?: boolean;
  chartPeriod: ChartPeriod;
  onChartPeriodChange: (period: ChartPeriod) => void;
  bentoPortfolioSeries?: number[];
  bentoBtcSeries?: number[] | null;
  bentoRawValues?: number[];
  bentoTimestamps?: number[];
  bentoVsBtcPct?: number | null;
  bentoLoading?: boolean;
  protocols?: Protocol[];
  refreshEpoch?: number;
};

export const HomeDashboard = ({
  walletTokens,
  poolPositions,
  totalBalanceUsd,
  personalLoading,
  missingApiKey,
  apiKeyIssue,
  isConnected,
  health,
  bentoInsights = null,
  coachInsight = null,
  aiLoading,
  missingOpenRouterKey,
  onAllocationNavigate,
  chartValues = [],
  rawChartValues = [],
  chartTimestamps = [],
  portfolioChangePct = null,
  chartLoading = false,
  chartPeriod,
  onChartPeriodChange,
  bentoPortfolioSeries = [],
  bentoBtcSeries = null,
  bentoRawValues = [],
  bentoTimestamps = [],
  bentoVsBtcPct = null,
  bentoLoading = false,
  protocols = [],
  refreshEpoch = 0,
}: HomeDashboardProps) => {
  const [chartExpanded, setChartExpanded] = useState(false);

  return (
    <DashboardWithTradeRail>
      {isConnected && missingApiKey ? (
        <Banner startIcon="info" title="Zerion API key required" variant="warning">
          {apiKeyIssue === 'empty'
            ? 'Your .env has VITE_ZERION_API_KEY but the value is empty. Paste your key from dashboard.zerion.io, save, then restart the dev server.'
            : 'Add your API key to .env as VITE_ZERION_API_KEY. Get a free key at dashboard.zerion.io, then restart the dev server.'}
        </Banner>
      ) : null}
      <Box paddingX={2} paddingY={2} width="100%">
        <VStack gap={2} width="100%">
          <BalanceOverview
            chartLoading={chartLoading}
            chartPeriod={chartPeriod}
            chartTimestamps={chartTimestamps}
            chartValues={chartValues}
            expanded={chartExpanded}
            isConnected={isConnected}
            loading={personalLoading}
            onChartPeriodChange={onChartPeriodChange}
            onToggleExpanded={() => setChartExpanded((open) => !open)}
            portfolioChangePct={portfolioChangePct}
            rawChartValues={rawChartValues}
            totalBalanceUsd={totalBalanceUsd}
          />
          <VStack gap={1} width="100%">
            <Text font="label2">Allocation</Text>
            <BalanceBreakdown
              isConnected={isConnected}
              loading={personalLoading}
              onNavigate={onAllocationNavigate}
              poolPositions={poolPositions}
              walletTokens={walletTokens}
            />
          </VStack>
        </VStack>
      </Box>
      <DashboardSectionDivider />
      <HealthScorePanel
        bentoInsights={bentoInsights}
        btcSeries={bentoBtcSeries}
        coachInsight={coachInsight}
        health={health}
        isConnected={isConnected}
        loading={(personalLoading || aiLoading || bentoLoading) && !health}
        missingOpenRouterKey={missingOpenRouterKey}
        poolPositions={poolPositions}
        portfolioSeries={bentoPortfolioSeries}
        protocols={protocols}
        rawPortfolioValues={bentoRawValues}
        refreshEpoch={refreshEpoch}
        timestamps={bentoTimestamps}
        vsBtcPct={bentoVsBtcPct}
        walletTokens={walletTokens}
      />
      <DashboardSectionDivider />
      <PricesSection
        isConnected={isConnected}
        loading={personalLoading}
        refreshEpoch={refreshEpoch}
        walletTokens={walletTokens}
      />
    </DashboardWithTradeRail>
  );
};
