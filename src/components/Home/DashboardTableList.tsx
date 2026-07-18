import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Box, Divider, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { Pagination } from '@coinbase/cds-web/pagination/Pagination';

export const DASHBOARD_LIST_PAGE_SIZE = 10;

export type DashboardTableColumn = {
  id: string;
  label: string;
  align?: 'left' | 'right';
};

type DashboardTableListProps = {
  columns: DashboardTableColumn[];
  gridTemplateColumns: string;
  children: ReactNode;
  emptyMessage?: string;
  loading?: boolean;
  showEmpty?: boolean;
};

export function dashboardTableGridStyle(gridTemplateColumns: string) {
  return { gridTemplateColumns } as const;
}

export function DashboardTableHeader({
  columns,
  gridTemplateColumns,
}: {
  columns: DashboardTableColumn[];
  gridTemplateColumns: string;
}) {
  return (
    <Box
      alignItems="center"
      display="grid"
      gap={2}
      paddingBottom={1}
      paddingTop={2}
      style={dashboardTableGridStyle(gridTemplateColumns)}
      width="100%"
    >
      {columns.map((column) => (
        <Text
          key={column.id}
          color="fgMuted"
          font="label2"
          style={{
            whiteSpace: 'nowrap',
            ...(column.align === 'right' ? { textAlign: 'right' } : null),
          }}
        >
          {column.label}
        </Text>
      ))}
    </Box>
  );
}

export function DashboardTableList({
  columns,
  gridTemplateColumns,
  children,
  emptyMessage,
  loading = false,
  showEmpty = false,
}: DashboardTableListProps) {
  if (loading && showEmpty) {
    return (
      <Text color="fgMuted" font="label2" paddingY={3}>
        {emptyMessage ?? 'Loading…'}
      </Text>
    );
  }

  if (showEmpty && emptyMessage) {
    return (
      <Text color="fgMuted" font="label2" paddingY={3}>
        {emptyMessage}
      </Text>
    );
  }

  return (
    <VStack gap={0} width="100%">
      <DashboardTableHeader columns={columns} gridTemplateColumns={gridTemplateColumns} />
      {children}
    </VStack>
  );
}

export function DashboardTableRowDivider({ show }: { show: boolean }) {
  return show ? <Divider /> : null;
}

export function useDashboardListPagination<T>(items: T[], pageSize?: number) {
  const [activePage, setActivePage] = useState(1);

  useEffect(() => {
    setActivePage(1);
  }, [items, pageSize]);

  if (!pageSize) {
    return { pageItems: items, activePage: 1, totalPages: 1, setActivePage, paginated: false };
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(activePage, totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    pageItems: items.slice(startIndex, startIndex + pageSize),
    activePage: currentPage,
    totalPages,
    setActivePage,
    paginated: totalPages > 1,
  };
}

export function DashboardTablePagination({
  activePage,
  totalPages,
  onChange,
}: {
  activePage: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <Box paddingBottom={2} paddingTop={2} width="100%">
      <Pagination activePage={activePage} onChange={onChange} totalPages={totalPages} />
    </Box>
  );
}
