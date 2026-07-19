import { Banner } from '@coinbase/cds-web/banner';
import { Box, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import type { GroupedPoolPosition } from '../../api/walletTypes';
import type { PositionVerdict } from '../../types/positionHealth';
import {
  emptyReasonMessage,
  emptyReasonTitle,
  type EmptyReason,
  type WalletDataMode,
} from '../../data/portfolioSnapshot';
import { poolsTotalUsd } from '../../utils/groupPoolPositions';
import { PoolsList } from './PoolsList';
import { DashboardWithTradeRail } from './TradeRail';
import { RollingUsdBalance } from './RollingUsdBalance';

const CONTENT_PADDING_X = 2;

type PoolsViewProps = {
  poolPositions: GroupedPoolPosition[];
  loading: boolean;
  dataMode: WalletDataMode;
  emptyReason?: EmptyReason;
  missingApiKey?: boolean;
  apiKeyIssue?: 'missing' | 'empty' | null;
  verdictsByPositionId?: Record<string, PositionVerdict>;
};

export const PoolsView = ({
  poolPositions,
  loading,
  dataMode,
  emptyReason,
  missingApiKey = false,
  apiKeyIssue = null,
  verdictsByPositionId = {},
}: PoolsViewProps) => {
  const isDemo = dataMode === 'demo';
  const isLive = dataMode === 'live';
  const poolsTotal = poolsTotalUsd(poolPositions);

  return (
    <DashboardWithTradeRail>
      {isLive && missingApiKey ? (
        <Banner startIcon="info" title="Zerion API key required" variant="warning">
          {apiKeyIssue === 'empty'
            ? 'Your .env has VITE_ZERION_API_KEY but the value is empty. Paste your key from dashboard.zerion.io, save, then restart the dev server.'
            : 'Add your API key to .env as VITE_ZERION_API_KEY. Get a free key at dashboard.zerion.io, then restart the dev server.'}
        </Banner>
      ) : null}
      {dataMode === 'empty' && (!loading || emptyReason === 'refreshing') ? (
        <Box paddingX={CONTENT_PADDING_X} paddingTop={2} width="100%">
          <Banner startIcon="info" title={emptyReasonTitle(emptyReason)} variant="informational">
            {emptyReasonMessage(emptyReason)}
          </Banner>
        </Box>
      ) : null}
      <VStack gap={0} width="100%">
        <Box paddingBottom={2} paddingTop={2} paddingX={CONTENT_PADDING_X} width="100%">
          <VStack gap={0.5} width="100%">
            <RollingUsdBalance
              font="display2"
              loading={loading && !isDemo}
              value={poolsTotal}
            />
            {isDemo ? (
              <Text color="fgMuted" font="label2">
                Sample pools — connect wallet to see yours
              </Text>
            ) : null}
          </VStack>
        </Box>

        <VStack gap={0} paddingX={CONTENT_PADDING_X} paddingY={2} width="100%">
          <PoolsList
            emptyMessage="No liquidity positions yet."
            isConnected={isLive}
            loading={loading}
            pools={poolPositions}
            verdictsByPositionId={verdictsByPositionId}
          />
        </VStack>
      </VStack>
    </DashboardWithTradeRail>
  );
};
