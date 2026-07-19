import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { Icon } from '@coinbase/cds-web/icons';
import type { PersonalPosition, WalletToken } from '../../api/walletTypes';
import { formatUsd } from '../../utils/format';
import { buildVoteRows, formatChain, type VoteRow } from '../../utils/votePositions';
import {
  DASHBOARD_LIST_PAGE_SIZE,
  DashboardTableList,
  DashboardTablePagination,
  dashboardTableGridStyle,
  useDashboardListPagination,
} from './DashboardTableList';
import { HomePressableRow } from './HomePressableRow';

const VOTE_COLUMNS = [
  { id: 'protocol', label: 'Protocol', align: 'left' as const },
  { id: 'position', label: 'Position', align: 'left' as const },
  { id: 'value', label: 'Value', align: 'right' as const },
];

const VOTE_GRID = [
  'minmax(0, 2fr)',
  'minmax(0, 3fr)',
  'minmax(5rem, 1fr)',
].join(' ');
const rowGridStyle = dashboardTableGridStyle(VOTE_GRID);

type VoteListProps = {
  positions: PersonalPosition[];
  walletTokens: WalletToken[];
  loading?: boolean;
  isConnected?: boolean;
  emptyMessage?: string;
};

function ProtocolDetails({ row }: { row: VoteRow }) {
  return (
    <HStack alignItems="center" gap={1.5} minWidth={0}>
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
      <VStack gap={0.5} minWidth={0}>
        <Text font="headline" numberOfLines={1}>
          {row.protocol}
        </Text>
        <Text color="fgMuted" font="label2" numberOfLines={1}>
          {formatChain(row.chain)}
        </Text>
      </VStack>
    </HStack>
  );
}

function VoteListRow({
  row,
  loading,
  isConnected,
}: {
  row: VoteRow;
  loading: boolean;
  isConnected: boolean;
}) {
  return (
    <HomePressableRow
      accessibilityLabel={`${row.protocol}, ${row.positionLabel}, ${formatUsd(row.valueUsd)}`}
      bleedX={0}
      paddingY={2}
    >
      <Box alignItems="center" display="grid" gap={2} style={rowGridStyle} width="100%">
        <ProtocolDetails row={row} />
        <Text font="headline" numberOfLines={1}>
          {row.positionLabel}
        </Text>
        <Text
          font="headline"
          numberOfLines={1}
          style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
        >
          {loading && isConnected ? '…' : formatUsd(row.valueUsd)}
        </Text>
      </Box>
    </HomePressableRow>
  );
}

export const VoteList = ({
  positions,
  walletTokens,
  loading = false,
  isConnected = false,
  emptyMessage = 'No governance positions or tokens yet.',
}: VoteListProps) => {
  const rows = buildVoteRows(positions, walletTokens);
  const { pageItems, activePage, totalPages, setActivePage, paginated } = useDashboardListPagination(
    rows,
    DASHBOARD_LIST_PAGE_SIZE,
  );

  return (
    <>
      <DashboardTableList
        columns={VOTE_COLUMNS}
        emptyMessage={emptyMessage}
        gridTemplateColumns={VOTE_GRID}
        loading={loading}
        showEmpty={rows.length === 0}
      >
        {pageItems.map((row) => (
          <Box key={row.id} width="100%">
            <VoteListRow isConnected={isConnected} loading={loading} row={row} />
          </Box>
        ))}
      </DashboardTableList>
      {paginated ? (
        <DashboardTablePagination
          activePage={activePage}
          onChange={setActivePage}
          totalPages={totalPages}
        />
      ) : null}
    </>
  );
};
