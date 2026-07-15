import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import type { WalletToken } from '../../api/walletTypes';
import { formatUsd } from '../../utils/format';
import { formatTokenAmount } from '../../utils/tokenHoldings';
import {
  DashboardTableList,
  DashboardTableRowDivider,
  dashboardTableGridStyle,
} from './DashboardTableList';
import { HomePressableRow } from './HomePressableRow';
import { TokenIcon } from './TokenIcon';

const HOLDINGS_COLUMNS = [
  { id: 'name', label: 'Name', align: 'left' as const },
  { id: 'balance', label: 'Balance', align: 'right' as const },
  { id: 'price', label: 'Current price', align: 'right' as const },
];

const HOLDINGS_GRID = 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)';
const rowGridStyle = dashboardTableGridStyle(HOLDINGS_GRID);

type HoldingsListProps = {
  tokens: WalletToken[];
  loading?: boolean;
  isConnected?: boolean;
  emptyMessage?: string;
};

function HoldingsListRow({
  token,
  loading,
  isConnected,
}: {
  token: WalletToken;
  loading: boolean;
  isConnected: boolean;
}) {
  return (
    <HomePressableRow
      accessibilityLabel={`${token.name}, ${formatUsd(token.valueUsd)}`}
      bleedX={0}
      paddingY={2}
    >
      <Box alignItems="center" display="grid" gap={2} style={rowGridStyle} width="100%">
        <HStack alignItems="center" gap={1.5} minWidth={0}>
          <TokenIcon alt={token.name} source={token.logoUrl} symbol={token.symbol} />
          <VStack gap={0} minWidth={0}>
            <Text font="headline" numberOfLines={1}>
              {token.name}
            </Text>
            <Text color="fgMuted" font="label2">
              {token.symbol}
            </Text>
          </VStack>
        </HStack>
        <VStack alignItems="flex-end" gap={0.25} minWidth={0}>
          <Text font="headline" numberOfLines={1} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {loading && isConnected ? '…' : formatUsd(token.valueUsd)}
          </Text>
          <Text color="fgMuted" font="label2" numberOfLines={1} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatTokenAmount(token.amount)} {token.symbol}
          </Text>
        </VStack>
        <Text
          font="headline"
          numberOfLines={1}
          style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
        >
          {token.price > 0 ? formatUsd(token.price) : '—'}
        </Text>
      </Box>
    </HomePressableRow>
  );
}

export const HoldingsList = ({
  tokens,
  loading = false,
  isConnected = false,
  emptyMessage,
}: HoldingsListProps) => {
  const isEmpty = tokens.length === 0;

  return (
    <DashboardTableList
      columns={HOLDINGS_COLUMNS}
      emptyMessage={emptyMessage ?? 'Loading holdings…'}
      gridTemplateColumns={HOLDINGS_GRID}
      loading={loading}
      showEmpty={isEmpty}
    >
      {tokens.map((token, index) => (
        <Box key={token.id} width="100%">
          <DashboardTableRowDivider show={index > 0} />
          <HoldingsListRow isConnected={isConnected} loading={loading} token={token} />
        </Box>
      ))}
    </DashboardTableList>
  );
};
