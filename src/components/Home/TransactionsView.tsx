import { Banner } from '@coinbase/cds-web/banner';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { Icon } from '@coinbase/cds-web/icons';
import type { LpTransaction } from '../../api/walletTypes';
import {
  emptyReasonMessage,
  emptyReasonTitle,
  type EmptyReason,
  type WalletDataMode,
} from '../../data/portfolioSnapshot';
import { FilterGroup } from './FilterGroup';
import { HomePressableRow } from './HomePressableRow';
import { LpTransactionsList } from './LpTransactionsList';
import { DashboardSectionDivider, DashboardWithTradeRail } from './TradeRail';

const CONTENT_PADDING_X = 2;

type TransactionsViewProps = {
  lpTransactions: LpTransaction[];
  loading?: boolean;
  dataMode: WalletDataMode;
  emptyReason?: EmptyReason;
  flaggedTransactionIds?: Set<string>;
  riskyDepositCount?: number;
};

function RecurringBuysRow() {
  return (
    <HomePressableRow accessibilityLabel="Recurring buys, 1 active" bleedX={0} paddingY={2}>
      <HStack alignItems="center" gap={2} justifyContent="space-between" width="100%">
        <HStack alignItems="center" flexGrow={1} gap={1.5} minWidth={0}>
          <Box
            alignItems="center"
            background="bgPrimaryWash"
            borderRadius={1000}
            display="flex"
            height={40}
            justifyContent="center"
            width={40}
          >
            <Icon color="fgPrimary" name="clock" size="m" />
          </Box>
          <Text font="headline">Recurring buys</Text>
          <Box
            alignItems="center"
            background="bgLine"
            borderRadius={1000}
            display="flex"
            height={20}
            justifyContent="center"
            minWidth={20}
            paddingX={0.75}
          >
            <Text color="fgMuted" font="label2">
              1
            </Text>
          </Box>
        </HStack>
        <Icon color="fgMuted" name="caretRight" size="s" />
      </HStack>
    </HomePressableRow>
  );
}

export const TransactionsView = ({
  lpTransactions,
  loading = false,
  dataMode,
  emptyReason,
  flaggedTransactionIds = new Set(),
  riskyDepositCount = 0,
}: TransactionsViewProps) => {
  const isDemo = dataMode === 'demo';
  const isLive = dataMode === 'live';

  return (
    <DashboardWithTradeRail>
      <VStack gap={0} width="100%">
        {dataMode === 'empty' && (!loading || emptyReason === 'refreshing') ? (
          <Box paddingX={CONTENT_PADDING_X} paddingTop={2} width="100%">
            <Banner startIcon="info" title={emptyReasonTitle(emptyReason)} variant="informational">
              {emptyReasonMessage(emptyReason)}
            </Banner>
          </Box>
        ) : null}
        <Box paddingTop={2} paddingX={CONTENT_PADDING_X} width="100%">
          <Text font="title3">Manage</Text>
        </Box>
        <Box paddingX={CONTENT_PADDING_X} width="100%">
          <RecurringBuysRow />
        </Box>

        <DashboardSectionDivider />

        <Box paddingTop={3} paddingX={CONTENT_PADDING_X} width="100%">
          <Text font="title3">Activity</Text>
        </Box>
        {riskyDepositCount > 0 ? (
          <Box padding={CONTENT_PADDING_X} width="100%">
            <Banner startIcon="warning" title="Recent deposits into at-risk pools" variant="warning">
              {`${riskyDepositCount} recent LP deposit${riskyDepositCount === 1 ? '' : 's'} landed in positions flagged reduce or exit.`}
            </Banner>
          </Box>
        ) : null}
        <Box paddingX={CONTENT_PADDING_X} width="100%">
          <FilterGroup />
        </Box>

        <VStack gap={0} paddingX={CONTENT_PADDING_X} width="100%">
          <LpTransactionsList
            emptyMessage={
              isLive
                ? 'No liquidity activity found for this wallet.'
                : 'No liquidity activity yet.'
            }
            flaggedTransactionIds={flaggedTransactionIds}
            loading={loading && !isDemo}
            transactions={lpTransactions}
          />
          {isDemo ? (
            <Text color="fgMuted" font="label2" paddingBottom={3}>
              Showing sample LP activity — connect wallet to see yours
            </Text>
          ) : null}
        </VStack>
      </VStack>
    </DashboardWithTradeRail>
  );
};
