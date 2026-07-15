import type { ReactNode } from 'react';
import { Box, Divider, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';

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
          style={column.align === 'right' ? { textAlign: 'right' } : undefined}
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
