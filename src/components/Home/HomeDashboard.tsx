import { Banner } from '@coinbase/cds-web/banner';
import { Box, Divider, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import type { WalletToken } from '../../api/walletTypes';
import { BalanceBreakdown } from './BalanceBreakdown';
import { BalanceOverview } from './BalanceOverview';
import { ForYouSection } from './ForYouSection';
import { PricesSection } from './PricesSection';
import { DashboardWithTradeRail } from './TradeRail';

type HomeDashboardProps = {
  walletTokens: WalletToken[];
  totalBalanceUsd: number | null;
  personalLoading: boolean;
  missingApiKey: boolean;
  apiKeyIssue: 'missing' | 'empty' | null;
  isConnected: boolean;
};

export const HomeDashboard = ({
  walletTokens,
  totalBalanceUsd,
  personalLoading,
  missingApiKey,
  apiKeyIssue,
  isConnected,
}: HomeDashboardProps) => {
  return (
    <DashboardWithTradeRail>
      {isConnected && missingApiKey ? (
        <Banner startIcon="info" title="Zerion API key required" variant="warning">
          {apiKeyIssue === 'empty'
            ? 'Your `.env` has `VITE_ZERION_API_KEY` but the value is empty. Paste your key from dashboard.zerion.io, save, then restart the dev server.'
            : 'Add your API key to `.env` as `VITE_ZERION_API_KEY`. Get a free key at dashboard.zerion.io, then restart the dev server.'}
        </Banner>
      ) : null}
      <Box paddingX={2} paddingY={2}>
        <VStack gap={2} width="100%">
          <BalanceOverview
            isConnected={isConnected}
            loading={personalLoading}
            totalBalanceUsd={totalBalanceUsd}
          />
          <VStack gap={1} width="100%">
            <Text font="label2">Allocation</Text>
            <BalanceBreakdown
              isConnected={isConnected}
              loading={personalLoading}
              walletTokens={walletTokens}
            />
          </VStack>
        </VStack>
      </Box>
      <Divider />
      <ForYouSection
        isConnected={isConnected}
        loading={personalLoading}
        walletTokens={walletTokens}
      />
      <Divider />
      <PricesSection
        isConnected={isConnected}
        loading={personalLoading}
        walletTokens={walletTokens}
      />
    </DashboardWithTradeRail>
  );
};
