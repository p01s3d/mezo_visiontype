import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { Icon } from '@coinbase/cds-web/icons';
import type { GroupedPoolPosition } from '../../api/walletTypes';
import type { PositionVerdict } from '../../types/positionHealth';
import { formatUsd } from '../../utils/format';
import { formatChain } from '../../utils/personalPositions';
import {
  DashboardTableList,
  dashboardTableGridStyle,
} from './DashboardTableList';
import { HealthIndicator, verdictTooltip } from './HealthIndicator';
import { HomePressableRow } from './HomePressableRow';
import { PoolPnlValue } from './PoolPnlValue';
import { TokenIcon } from './TokenIcon';

const POOLS_COLUMNS = [
  { id: 'pool', label: 'Pool', align: 'left' as const },
  { id: 'health', label: 'Health', align: 'left' as const },
  { id: 'value', label: 'Value', align: 'right' as const },
  { id: 'pnl', label: 'Unrealized PnL', align: 'right' as const },
];

/**
 * Pool fills leftover space. Other cols hug content but never shrink below
 * their heading width (header + rows are separate grids).
 */
const POOLS_GRID = [
  'minmax(0, 1fr)',
  'minmax(5rem, max-content)', // Health
  'minmax(4.5rem, max-content)', // Value
  'minmax(8.5rem, max-content)', // Unrealized PnL
].join(' ');
const rowGridStyle = dashboardTableGridStyle(POOLS_GRID);

type PoolsListProps = {
  pools: GroupedPoolPosition[];
  loading?: boolean;
  isConnected?: boolean;
  emptyMessage?: string;
  verdictsByPositionId?: Record<string, PositionVerdict>;
};

function PoolDetails({ pool }: { pool: GroupedPoolPosition }) {
  return (
    <HStack alignItems="center" gap={1.5} minWidth={0}>
      {pool.protocolIconUrl ? (
        <TokenIcon alt={pool.protocol} source={pool.protocolIconUrl} symbol={pool.protocol} />
      ) : (
        <Box
          alignItems="center"
          background="bgAlternate"
          borderRadius={1000}
          display="flex"
          height={32}
          justifyContent="center"
          width={32}
        >
          <Icon color="fgMuted" name="defi" size="s" />
        </Box>
      )}
      <VStack gap={0.5} minWidth={0}>
        <Text font="headline" numberOfLines={1}>
          {pool.poolName}
        </Text>
        <Text color="fgMuted" font="label2" numberOfLines={1}>
          {pool.protocol} · {formatChain(pool.chain)}
        </Text>
      </VStack>
    </HStack>
  );
}

function PoolHealthCell({ verdict }: { verdict?: PositionVerdict }) {
  if (!verdict) {
    return (
      <Text color="fgMuted" font="label2">
        —
      </Text>
    );
  }

  return <HealthIndicator tooltip={verdictTooltip(verdict)} verdict={verdict.verdict} />;
}

function PoolsListRow({
  pool,
  loading,
  isConnected,
  verdict,
}: {
  pool: GroupedPoolPosition;
  loading: boolean;
  isConnected: boolean;
  verdict?: PositionVerdict;
}) {
  return (
    <HomePressableRow
      accessibilityLabel={`${pool.poolName}, ${formatUsd(pool.valueUsd)}`}
      bleedX={0}
      paddingY={2}
    >
      <Box alignItems="center" display="grid" gap={2} style={rowGridStyle} width="100%">
        <PoolDetails pool={pool} />
        <PoolHealthCell verdict={verdict} />
        <Text
          font="headline"
          numberOfLines={1}
          style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
        >
          {loading && isConnected ? '…' : formatUsd(pool.valueUsd)}
        </Text>
        <PoolPnlValue isConnected={isConnected} loading={loading} pool={pool} />
      </Box>
    </HomePressableRow>
  );
}

export const PoolsList = ({
  pools,
  loading = false,
  isConnected = false,
  emptyMessage = 'No liquidity positions yet.',
  verdictsByPositionId = {},
}: PoolsListProps) => {
  const isEmpty = pools.length === 0;

  return (
    <DashboardTableList
      columns={POOLS_COLUMNS}
      emptyMessage={emptyMessage}
      gridTemplateColumns={POOLS_GRID}
      loading={loading}
      showEmpty={isEmpty}
    >
      {pools.map((pool) => (
        <Box key={pool.groupId} width="100%">
          <PoolsListRow
            isConnected={isConnected}
            loading={loading}
            pool={pool}
            verdict={verdictsByPositionId[pool.groupId]}
          />
        </Box>
      ))}
    </DashboardTableList>
  );
};
