import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from '@coinbase/cds-web/tables';
import { Banner } from '@coinbase/cds-web/banner';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { Button } from '@coinbase/cds-web/buttons';
import { Tooltip } from '@coinbase/cds-web/overlays';
import { ProgressCircle } from '@coinbase/cds-web/visualizations';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@coinbase/cds-web/icons';
import { Pagination } from '@coinbase/cds-web/pagination/Pagination';
import type { Protocol, YieldPool } from '../../api/defillama';
import { formatApy, formatPercentChange, formatUsd } from '../../utils/format';
import { filterPools, filterProtocols, type DataView } from '../../utils/defiViews';

type AssetListProps = {
  view: DataView;
  search: string;
  pools: YieldPool[];
  protocols: Protocol[];
  loading: boolean;
  error: string | null;
  updatedAt: Date | null;
  onRefresh: () => void;
  pageSize: number;
};

export const AssetList = ({
  view,
  search,
  pools,
  protocols,
  loading,
  error,
  updatedAt,
  onRefresh,
  pageSize,
}: AssetListProps) => {
  const [activePage, setActivePage] = useState(1);
  const isProtocolView = view === 'protocols';

  useEffect(() => {
    setActivePage(1);
  }, [view, search]);

  const rows = useMemo(() => {
    return isProtocolView ? filterProtocols(protocols, search) : filterPools(pools, view, search);
  }, [isProtocolView, protocols, pools, search, view]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(activePage, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(startIndex, startIndex + pageSize);

  if (loading) {
    return (
      <VStack alignItems="center" gap={2} paddingY={6}>
        <ProgressCircle indeterminate size={48} />
        <Text font="label2" color="fgMuted">
          Loading live protocol data…
        </Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <Banner
        variant="error"
        title="Unable to load live data"
        startIcon="warning"
        primaryAction={<Button onClick={onRefresh}>Retry</Button>}
      >
        {error}
      </Banner>
    );
  }

  return (
    <VStack gap={2} width="100%">
      <HStack alignItems="center" justifyContent="space-between" paddingX={1}>
        <Text font="label2" color="fgMuted">
          {rows.length} {isProtocolView ? 'protocols' : 'pools'} · DefiLlama
          {updatedAt ? ` · Updated ${updatedAt.toLocaleTimeString()}` : ''}
        </Text>
        <Button compact variant="secondary" onClick={onRefresh}>
          Refresh
        </Button>
      </HStack>

      {isProtocolView ? (
        <Table tableLayout="auto" variant="ruled">
          <TableHeader>
            <TableRow>
              <TableCell title="Protocol" width="35%" />
              <TableCell title="Category" width="25%" />
              <TableCell title="Chain" width="20%" />
              <TableCell alignItems="flex-end" title="TVL" width="20%" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((protocol) => {
              const item = protocol as Protocol;
              return (
                <TableRow key={item.id}>
                  <TableCell
                    start={<Icon name="defi" size="m" paddingEnd={1} />}
                    title={item.name}
                    width="35%"
                  />
                  <TableCell title={item.category} width="25%" />
                  <TableCell title={item.chain} width="20%" />
                  <TableCell
                    alignItems="flex-end"
                    direction="horizontal"
                    justifyContent="flex-end"
                    title={formatUsd(item.tvl)}
                    width="20%"
                  />
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} direction="horizontal">
                <Pagination
                  activePage={currentPage}
                  onChange={setActivePage}
                  totalPages={totalPages}
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      ) : (
        <Table tableLayout="auto" variant="ruled">
          <TableHeader>
            <TableRow>
              <TableCell title="Pool" width="30%" />
              <TableCell title="Protocol" width="20%" />
              <TableCell title="Chain" width="15%" />
              <TableCell width="15%">
                <Tooltip content="Total value locked in USD">
                  <Text as="span" color="currentColor">
                    <HStack>
                      TVL <Icon name="info" size="xs" />
                    </HStack>
                  </Text>
                </Tooltip>
              </TableCell>
              <TableCell alignItems="flex-end" title="APY" width="10%" />
              {view === 'analytics' ? (
                <TableCell alignItems="flex-end" title="24h Δ" width="10%" />
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => {
              const pool = row as YieldPool;
              return (
                <TableRow key={pool.pool}>
                  <TableCell
                    start={<Icon name="defi" size="m" paddingEnd={1} />}
                    subtitle={pool.stablecoin ? 'Stablecoin' : pool.exposure}
                    title={pool.symbol}
                    width="30%"
                  />
                  <TableCell title={pool.project} width="20%" />
                  <TableCell title={pool.chain} width="15%" />
                  <TableCell title={formatUsd(pool.tvlUsd)} width="15%" />
                  <TableCell
                    alignItems="flex-end"
                    direction="horizontal"
                    justifyContent="flex-end"
                    title={formatApy(pool.apy)}
                    width="10%"
                  />
                  {view === 'analytics' ? (
                    <TableCell
                      alignItems="flex-end"
                      direction="horizontal"
                      justifyContent="flex-end"
                      title={formatPercentChange(pool.apyPct1D)}
                      width="10%"
                    />
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={view === 'analytics' ? 6 : 5} direction="horizontal">
                <Pagination
                  activePage={currentPage}
                  onChange={setActivePage}
                  totalPages={totalPages}
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )}

      {pageRows.length === 0 ? (
        <Box paddingY={4}>
          <Text font="label2" color="fgMuted" textAlign="center">
            No results match your search.
          </Text>
        </Box>
      ) : null}
    </VStack>
  );
};
