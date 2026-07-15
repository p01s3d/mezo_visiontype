import { Box, Divider, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { Icon } from '@coinbase/cds-web/icons';
import { DEMO_TRANSACTIONS } from '../../data/demoTransactions';
import { FilterGroup } from './FilterGroup';
import { HomePressableRow } from './HomePressableRow';
import { DashboardWithTradeRail } from './TradeRail';
import { TransactionsList } from './TransactionsList';

const CONTENT_PADDING_X = 2;

type TransactionsViewProps = {
  loading?: boolean;
  isConnected?: boolean;
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

export const TransactionsView = ({ loading = false, isConnected = false }: TransactionsViewProps) => {
  const transactions = DEMO_TRANSACTIONS;

  return (
    <DashboardWithTradeRail>
      <VStack gap={0} width="100%">
        <Box paddingTop={2} paddingX={CONTENT_PADDING_X} width="100%">
          <Text font="title3">Manage</Text>
        </Box>
        <Box paddingX={CONTENT_PADDING_X} width="100%">
          <RecurringBuysRow />
        </Box>

        <Box paddingTop={3} paddingX={CONTENT_PADDING_X} width="100%">
          <Text font="title3">Activity</Text>
        </Box>
        <Box paddingX={CONTENT_PADDING_X} width="100%">
          <FilterGroup />
        </Box>

        <VStack gap={0} paddingX={CONTENT_PADDING_X} width="100%">
          <Divider />
          <TransactionsList
            emptyMessage={
              isConnected ? 'No transactions found for this wallet.' : 'Connect wallet to see your transactions.'
            }
            loading={loading && isConnected}
            transactions={transactions}
          />
          {!isConnected ? (
            <Text color="fgMuted" font="label2" paddingBottom={3}>
              Showing sample activity — connect wallet to see yours
            </Text>
          ) : null}
        </VStack>
      </VStack>
    </DashboardWithTradeRail>
  );
};
