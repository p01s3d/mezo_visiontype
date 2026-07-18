import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { Icon } from '@coinbase/cds-web/icons';
import { DEMO_LP_TRANSACTIONS } from '../../../data/demoLpTransactions';
import { FilterGroup } from '../../Home/FilterGroup';
import { HomePressableRow } from '../../Home/HomePressableRow';
import { LpTransactionsList } from '../../Home/LpTransactionsList';
import { DashboardSectionDivider } from '../../Home/TradeRail';

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

export function TransactionsPreview() {
  return (
    <VStack gap={0} minWidth={0} width="100%">
      <Text font="title3" paddingBottom={1}>
        Manage
      </Text>
      <RecurringBuysRow />

      <DashboardSectionDivider />

      <Text font="title3" paddingBottom={1} paddingTop={1.5}>
        Activity
      </Text>
      <Box paddingBottom={1} width="100%">
        <FilterGroup />
      </Box>
      <LpTransactionsList transactions={DEMO_LP_TRANSACTIONS.slice(0, 2)} />
    </VStack>
  );
}
