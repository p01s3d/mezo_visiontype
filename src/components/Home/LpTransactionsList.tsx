import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { Icon } from '@coinbase/cds-web/icons';
import type { LpTransaction } from '../../api/walletTypes';
import { formatSignedUsd, formatTransactionDate, formatUsd } from '../../utils/format';
import { formatChain } from '../../utils/personalPositions';
import {
  DashboardTableList,
  DashboardTablePagination,
  DASHBOARD_LIST_PAGE_SIZE,
  dashboardTableGridStyle,
  useDashboardListPagination,
} from './DashboardTableList';
import { HealthIndicator } from './HealthIndicator';
import { HomePressableRow } from './HomePressableRow';

const LP_TRANSACTION_COLUMNS = [
  { id: 'details', label: 'Details', align: 'left' as const },
  { id: 'amount', label: 'Amount', align: 'right' as const },
  { id: 'date', label: 'Date', align: 'right' as const },
];

const LP_TRANSACTION_GRID = 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 0.85fr)';
const rowGridStyle = dashboardTableGridStyle(LP_TRANSACTION_GRID);

type LpTransactionsListProps = {
  transactions: LpTransaction[];
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  flaggedTransactionIds?: Set<string>;
};

function LpTransactionDetails({
  transaction,
  flagged,
}: {
  transaction: LpTransaction;
  flagged?: boolean;
}) {
  return (
    <HStack alignItems="center" gap={1.5} minWidth={0}>
      <Box
        alignItems="center"
        background="bgPrimaryWash"
        borderRadius={1000}
        display="flex"
        height={32}
        justifyContent="center"
        width={32}
      >
        <Icon color="fgPrimary" name="defi" size="s" />
      </Box>
      <VStack gap={0.5} minWidth={0}>
        <HStack alignItems="center" flexWrap="wrap" gap={1}>
          <Text font="headline" numberOfLines={1}>
            {transaction.title}
          </Text>
          {flagged ? (
            <HealthIndicator
              tooltip="Recent LP deposit into a position flagged reduce or exit."
              verdict="reduce"
            />
          ) : null}
        </HStack>
        <Text color="fgMuted" font="label2" numberOfLines={1}>
          {transaction.protocol} · {transaction.poolLabel} · {formatChain(transaction.chain)}
        </Text>
      </VStack>
    </HStack>
  );
}

function LpTransactionsListRow({
  transaction,
  flagged,
}: {
  transaction: LpTransaction;
  flagged?: boolean;
}) {
  const amountColor = transaction.direction === 'in' ? 'fgPositive' : 'fgNegative';

  return (
    <HomePressableRow
      accessibilityLabel={`${transaction.title}, ${formatUsd(transaction.amountUsd)}`}
      bleedX={0}
      paddingY={2}
    >
      <Box alignItems="center" display="grid" gap={2} style={rowGridStyle} width="100%">
        <LpTransactionDetails flagged={flagged} transaction={transaction} />
        <Text
          color={amountColor}
          font="headline"
          numberOfLines={1}
          style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
        >
          {formatSignedUsd(transaction.amountUsd, transaction.direction)}
        </Text>
        <Text font="headline" numberOfLines={1} style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
          {formatTransactionDate(transaction.date)}
        </Text>
      </Box>
    </HomePressableRow>
  );
}

export const LpTransactionsList = ({
  transactions,
  loading = false,
  emptyMessage,
  pageSize = DASHBOARD_LIST_PAGE_SIZE,
  flaggedTransactionIds = new Set(),
}: LpTransactionsListProps) => {
  const isEmpty = transactions.length === 0;
  const { pageItems, activePage, totalPages, setActivePage } = useDashboardListPagination(
    transactions,
    pageSize,
  );

  return (
    <VStack gap={0} width="100%">
      <DashboardTableList
        columns={LP_TRANSACTION_COLUMNS}
        emptyMessage={emptyMessage}
        gridTemplateColumns={LP_TRANSACTION_GRID}
        loading={loading}
        showEmpty={isEmpty}
      >
        {pageItems.map((transaction) => (
          <Box key={transaction.id} width="100%">
            <LpTransactionsListRow
              flagged={flaggedTransactionIds.has(transaction.id)}
              transaction={transaction}
            />
          </Box>
        ))}
      </DashboardTableList>
      <DashboardTablePagination
        activePage={activePage}
        onChange={setActivePage}
        totalPages={totalPages}
      />
    </VStack>
  );
};
