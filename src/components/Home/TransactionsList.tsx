import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Avatar } from '@coinbase/cds-web/media';
import { Text } from '@coinbase/cds-web/typography';
import type { Transaction } from '../../data/demoTransactions';
import { formatSignedUsd, formatTransactionDate, formatUsd } from '../../utils/format';
import { formatTokenAmount } from '../../utils/tokenHoldings';
import {
  DashboardTableList,
  DashboardTableRowDivider,
  dashboardTableGridStyle,
} from './DashboardTableList';
import { HomePressableRow } from './HomePressableRow';
import { TokenIcon } from './TokenIcon';

const TRANSACTION_COLUMNS = [
  { id: 'details', label: 'Details', align: 'left' as const },
  { id: 'amount', label: 'Amount', align: 'right' as const },
  { id: 'date', label: 'Date', align: 'right' as const },
];

const TRANSACTION_GRID = 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 0.85fr)';
const rowGridStyle = dashboardTableGridStyle(TRANSACTION_GRID);

type TransactionsListProps = {
  transactions: Transaction[];
  loading?: boolean;
  emptyMessage?: string;
};

function TransactionDetails({ transaction }: { transaction: Transaction }) {
  if (transaction.symbol) {
    return (
      <HStack alignItems="center" gap={1.5} minWidth={0}>
        <TokenIcon
          alt={transaction.title}
          source={transaction.logoUrl}
          symbol={transaction.symbol}
        />
        <Text font="headline" numberOfLines={1}>
          {transaction.title}
        </Text>
      </HStack>
    );
  }

  return (
    <HStack alignItems="center" gap={1.5} minWidth={0}>
      <Avatar
        alt="Cash"
        background="bgPrimaryWash"
        dangerouslySetSize={32}
        name="Cash"
        shape="circle"
        size="l"
      />
      <Text font="headline" numberOfLines={1}>
        {transaction.title}
      </Text>
    </HStack>
  );
}

function TransactionAmount({ transaction }: { transaction: Transaction }) {
  const amountColor = transaction.direction === 'in' ? 'fgPositive' : 'fgNegative';

  return (
    <VStack alignItems="flex-end" gap={0.25} minWidth={0}>
      <Text color={amountColor} font="headline" numberOfLines={1} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {formatSignedUsd(transaction.amountUsd, transaction.direction)}
      </Text>
      {transaction.amountToken !== undefined && transaction.tokenSymbol ? (
        <Text color={amountColor} font="label2" numberOfLines={1} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {transaction.direction === 'in' ? '+' : '-'}
          {formatTokenAmount(transaction.amountToken)} {transaction.tokenSymbol}
        </Text>
      ) : null}
    </VStack>
  );
}

function TransactionsListRow({ transaction }: { transaction: Transaction }) {
  return (
    <HomePressableRow
      accessibilityLabel={`${transaction.title}, ${formatUsd(transaction.amountUsd)}`}
      bleedX={0}
      paddingY={2}
    >
      <Box alignItems="center" display="grid" gap={2} style={rowGridStyle} width="100%">
        <TransactionDetails transaction={transaction} />
        <TransactionAmount transaction={transaction} />
        <Text font="headline" numberOfLines={1} style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
          {formatTransactionDate(transaction.date)}
        </Text>
      </Box>
    </HomePressableRow>
  );
}

export const TransactionsList = ({
  transactions,
  loading = false,
  emptyMessage,
}: TransactionsListProps) => {
  const isEmpty = transactions.length === 0;

  return (
    <DashboardTableList
      columns={TRANSACTION_COLUMNS}
      emptyMessage={emptyMessage}
      gridTemplateColumns={TRANSACTION_GRID}
      loading={loading}
      showEmpty={isEmpty}
    >
      {transactions.map((transaction, index) => (
        <Box key={transaction.id} width="100%">
          <DashboardTableRowDivider show={index > 0} />
          <TransactionsListRow transaction={transaction} />
        </Box>
      ))}
    </DashboardTableList>
  );
};
