import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { Icon } from '@coinbase/cds-web/icons';
import type { PersonalPosition } from '../../api/walletTypes';
import { formatUsd } from '../../utils/format';
import {
  borrowPositionBorrowedUsd,
  borrowPositionSuppliedUsd,
  filterPersonalPositions,
  formatChain,
} from '../../utils/personalPositions';
import {
  DASHBOARD_LIST_PAGE_SIZE,
  DashboardTableList,
  DashboardTablePagination,
  dashboardTableGridStyle,
  useDashboardListPagination,
} from './DashboardTableList';
import { HomePressableRow } from './HomePressableRow';

const BORROW_COLUMNS = [
  { id: 'position', label: 'Position', align: 'left' as const },
  { id: 'type', label: 'Type', align: 'left' as const },
  { id: 'supplied', label: 'Supplied', align: 'right' as const },
  { id: 'borrowed', label: 'Borrowed', align: 'right' as const },
];

const BORROW_GRID = [
  'minmax(0, 1fr)',
  'minmax(5rem, max-content)',
  'minmax(4.5rem, max-content)',
  'minmax(4.5rem, max-content)',
].join(' ');
const rowGridStyle = dashboardTableGridStyle(BORROW_GRID);

type BorrowListProps = {
  positions: PersonalPosition[];
  loading?: boolean;
  isConnected?: boolean;
  emptyMessage?: string;
};

function PositionDetails({ position }: { position: PersonalPosition }) {
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
          {position.name}
        </Text>
        <Text color="fgMuted" font="label2" numberOfLines={1}>
          {position.protocol} · {formatChain(position.chain)}
        </Text>
      </VStack>
    </HStack>
  );
}

function AmountCell({
  amount,
  loading,
  isConnected,
}: {
  amount: number | null;
  loading: boolean;
  isConnected: boolean;
}) {
  if (loading && isConnected) {
    return (
      <Text font="headline" style={{ textAlign: 'right' }}>
        …
      </Text>
    );
  }

  if (amount === null) {
    return (
      <Text color="fgMuted" font="headline" style={{ textAlign: 'right' }}>
        —
      </Text>
    );
  }

  return (
    <Text
      font="headline"
      numberOfLines={1}
      style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
    >
      {formatUsd(amount)}
    </Text>
  );
}

function BorrowListRow({
  position,
  loading,
  isConnected,
}: {
  position: PersonalPosition;
  loading: boolean;
  isConnected: boolean;
}) {
  const supplied = borrowPositionSuppliedUsd(position);
  const borrowed = borrowPositionBorrowedUsd(position);

  return (
    <HomePressableRow
      accessibilityLabel={`${position.name}, ${position.positionType}`}
      bleedX={0}
      paddingY={2}
    >
      <Box alignItems="center" display="grid" gap={2} style={rowGridStyle} width="100%">
        <PositionDetails position={position} />
        <Text font="label2" numberOfLines={1}>
          {position.positionType}
        </Text>
        <AmountCell amount={supplied} isConnected={isConnected} loading={loading} />
        <AmountCell amount={borrowed} isConnected={isConnected} loading={loading} />
      </Box>
    </HomePressableRow>
  );
}

export const BorrowList = ({
  positions,
  loading = false,
  isConnected = false,
  emptyMessage = 'No borrow or lend positions yet.',
}: BorrowListProps) => {
  const rows = filterPersonalPositions(positions, 'borrow', '').sort(
    (a, b) => b.valueUsd - a.valueUsd,
  );
  const { pageItems, activePage, totalPages, setActivePage, paginated } = useDashboardListPagination(
    rows,
    DASHBOARD_LIST_PAGE_SIZE,
  );

  return (
    <>
      <DashboardTableList
        columns={BORROW_COLUMNS}
        emptyMessage={emptyMessage}
        gridTemplateColumns={BORROW_GRID}
        loading={loading}
        showEmpty={rows.length === 0}
      >
        {pageItems.map((position) => (
          <Box key={position.id} width="100%">
            <BorrowListRow
              isConnected={isConnected}
              loading={loading}
              position={position}
            />
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
