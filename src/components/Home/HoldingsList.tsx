import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import type { WalletToken } from '../../api/walletTypes';
import type { PositionVerdict } from '../../types/positionHealth';
import { formatUsd } from '../../utils/format';
import { formatTokenAmount } from '../../utils/tokenHoldings';
import {
  DashboardTableList,
  DashboardTablePagination,
  dashboardTableGridStyle,
  useDashboardListPagination,
} from './DashboardTableList';
import { HealthIndicator, verdictTooltip } from './HealthIndicator';
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
  pageSize?: number;
  verdictsByPositionId?: Record<string, PositionVerdict>;
};

function HoldingsListRow({
  token,
  loading,
  isConnected,
  verdict,
}: {
  token: WalletToken;
  loading: boolean;
  isConnected: boolean;
  verdict?: PositionVerdict;
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
          <VStack gap={0.5} minWidth={0}>
            <HStack alignItems="center" flexWrap="wrap" gap={1}>
              <Text font="headline" numberOfLines={1}>
                {token.name}
              </Text>
              {verdict ? (
                <HealthIndicator tooltip={verdictTooltip(verdict)} verdict={verdict.verdict} />
              ) : null}
            </HStack>
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
  pageSize,
  verdictsByPositionId = {},
}: HoldingsListProps) => {
  const isEmpty = tokens.length === 0;
  const { pageItems, activePage, totalPages, setActivePage } = useDashboardListPagination(
    tokens,
    pageSize,
  );

  return (
    <VStack gap={0} width="100%">
      <DashboardTableList
        columns={HOLDINGS_COLUMNS}
        emptyMessage={emptyMessage ?? 'Loading holdings…'}
        gridTemplateColumns={HOLDINGS_GRID}
        loading={loading}
        showEmpty={isEmpty}
      >
        {pageItems.map((token) => (
          <Box key={token.id} width="100%">
            <HoldingsListRow
              isConnected={isConnected}
              loading={loading}
              token={token}
              verdict={verdictsByPositionId[token.id]}
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
