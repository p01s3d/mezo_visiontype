import { useState } from 'react';
import { Banner } from '@coinbase/cds-web/banner';
import { Box, VStack } from '@coinbase/cds-web/layout';
import type { ChartPeriod } from '../../api/zerion';
import type { Protocol } from '../../api/defillama';
import type { GroupedPoolPosition, WalletToken } from '../../api/walletTypes';
import {
  emptyReasonMessage,
  emptyReasonTitle,
  type EmptyReason,
  type WalletDataMode,
} from '../../data/portfolioSnapshot';
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
  dataMode: WalletDataMode;
  emptyReason?: EmptyReason;
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
  bentoRawTimestamps?: number[];
  bentoTimestamps?: number[];
  bentoLoading?: boolean;
  dayRawValues?: number[];
  dayRawTimestamps?: number[];
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
  dataMode,
  emptyReason,
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
  bentoRawTimestamps = [],
  bentoTimestamps = [],
  bentoLoading = false,
  dayRawValues = [],
  dayRawTimestamps = [],
  protocols = [],
  refreshEpoch = 0,
}: HomeDashboardProps) => {
  const [chartExpanded, setChartExpanded] = useState(false);
  const isLive = dataMode !== 'demo';

  return (
    <DashboardWithTradeRail>
      {isLive && missingApiKey ? (
        <Banner startIcon="info" title="Zerion API key required" variant="warning">
          {apiKeyIssue === 'empty'
            ? 'Your .env has VITE_ZERION_API_KEY but the value is empty. Paste your key from dashboard.zerion.io, save, then restart the dev server.'
            : 'Add your API key to .env as VITE_ZERION_API_KEY. Get a free key at dashboard.zerion.io, then restart the dev server.'}
        </Banner>
      ) : null}
      {dataMode === 'empty' && (!personalLoading || emptyReason === 'refreshing') ? (
        <Box paddingX={2} paddingTop={2} width="100%">
          <Banner startIcon="info" title={emptyReasonTitle(emptyReason)} variant="informational">
            {emptyReasonMessage(emptyReason)}
          </Banner>
        </Box>
      ) : null}
      <Box paddingX={2} paddingY={2} width="100%">
        <VStack gap={2} width="100%">
          <BalanceOverview
            chartLoading={chartLoading}
            chartPeriod={chartPeriod}
            chartTimestamps={chartTimestamps}
            chartValues={chartValues}
            dataMode={dataMode}
            expanded={chartExpanded}
            loading={personalLoading}
            onChartPeriodChange={onChartPeriodChange}
            onToggleExpanded={() => setChartExpanded((open) => !open)}
            portfolioChangePct={portfolioChangePct}
            rawChartValues={rawChartValues}
            totalBalanceUsd={totalBalanceUsd}
          />
          <BalanceBreakdown
            dataMode={dataMode}
            loading={personalLoading}
            onNavigate={onAllocationNavigate}
            poolPositions={poolPositions}
            walletTokens={walletTokens}
          />
        </VStack>
      </Box>
      <DashboardSectionDivider />
      <HealthScorePanel
        bentoInsights={bentoInsights}
        btcSeries={bentoBtcSeries}
        chartsLoading={bentoLoading || chartLoading}
        coachInsight={coachInsight}
        dataMode={dataMode}
        dayRawTimestamps={dayRawTimestamps}
        dayRawValues={dayRawValues}
        health={health}
        loading={
          dataMode !== 'demo' &&
          !health &&
          (personalLoading || aiLoading || (dataMode === 'live' && bentoLoading))
        }
        missingOpenRouterKey={missingOpenRouterKey}
        poolPositions={poolPositions}
        portfolioSeries={bentoPortfolioSeries}
        protocols={protocols}
        rawPortfolioValues={bentoRawValues}
        rawTimestamps={bentoRawTimestamps}
        refreshEpoch={refreshEpoch}
        timestamps={bentoTimestamps}
        walletTokens={walletTokens}
      />
      <DashboardSectionDivider />
      <PricesSection
        isConnected={isLive}
        loading={personalLoading}
        refreshEpoch={refreshEpoch}
        walletTokens={walletTokens}
      />
    </DashboardWithTradeRail>
  );
};
