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
import type { PersonalPosition } from '../../api/debank';
import type { Protocol, YieldPool } from '../../api/defillama';
import { formatApy, formatPercentChange, formatUsd } from '../../utils/format';
import { filterPools, filterProtocols, type DataView } from '../../utils/defiViews';
import {
  getPersonalRowCount,
  PersonalPositionsTable,
} from './PersonalPositionsTable';

export type DataSource = 'market' | 'personal';

type AssetListProps = {
  dataSource: DataSource;
  view: DataView;
  search: string;
  pools: YieldPool[];
  protocols: Protocol[];
  personalPositions: PersonalPosition[];
  loading: boolean;
  personalLoading: boolean;
  error: string | null;
  personalError: string | null;
  missingApiKey: boolean;
  updatedAt: Date | null;
  personalUpdatedAt: Date | null;
  onRefresh: () => void;
  onRefreshPersonal: () => void;
  pageSize: number;
};

export const AssetList = ({
  dataSource,
  view,
  search,
  pools,
  protocols,
  personalPositions,
  loading,
  personalLoading,
  error,
  personalError,
  missingApiKey,
  updatedAt,
  personalUpdatedAt,
  onRefresh,
  onRefreshPersonal,
  pageSize,
}: AssetListProps) => {
  const [activePage, setActivePage] = useState(1);
  const isPersonal = dataSource === 'personal';
  const isProtocolView = view === 'protocols';

  useEffect(() => {
    setActivePage(1);
  }, [view, search, dataSource]);

  const marketRows = useMemo(() => {
    return isProtocolView ? filterProtocols(protocols, search) : filterPools(pools, view, search);
  }, [isProtocolView, protocols, pools, search, view]);

  const rowCount = isPersonal
    ? getPersonalRowCount(view, search, personalPositions)
    : marketRows.length;

  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize));
  const currentPage = Math.min(activePage, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageRows = isPersonal ? [] : marketRows.slice(startIndex, startIndex + pageSize);

  if (isPersonal && missingApiKey) {
    return (
      <Banner variant="warning" title="DeBank API key required" startIcon="info">
        Add your access key to `.env` as `VITE_DEBANK_ACCESS_KEY`. Get a free key at
        cloud.debank.com, then restart the dev server.
      </Banner>
    );
  }

  const isLoading = isPersonal ? personalLoading : loading;
  const activeError = isPersonal ? personalError : error;
  const activeUpdatedAt = isPersonal ? personalUpdatedAt : updatedAt;
  const onActiveRefresh = isPersonal ? onRefreshPersonal : onRefresh;

  if (isLoading) {
    return (
      <VStack alignItems="center" gap={2} paddingY={6}>
        <ProgressCircle indeterminate size={48} />
        <Text font="label2" color="fgMuted">
          {isPersonal ? 'Loading your DeFi positions…' : 'Loading live protocol data…'}
        </Text>
      </VStack>
    );
  }

  if (activeError) {
    return (
      <Banner
        variant="error"
        title={isPersonal ? 'Unable to load wallet positions' : 'Unable to load live data'}
        startIcon="warning"
        primaryAction={<Button onClick={onActiveRefresh}>Retry</Button>}
      >
        {activeError}
      </Banner>
    );
  }

  return (
    <VStack gap={2} width="100%">
      <HStack alignItems="center" justifyContent="space-between" paddingX={1}>
        <Text font="label2" color="fgMuted">
          {rowCount} {isPersonal ? (isProtocolView ? 'protocols' : 'positions') : isProtocolView ? 'protocols' : 'pools'} ·{' '}
          {isPersonal ? 'DeBank' : 'DefiLlama'}
          {activeUpdatedAt ? ` · Updated ${activeUpdatedAt.toLocaleTimeString()}` : ''}
        </Text>
        <Button compact variant="secondary" onClick={onActiveRefresh}>
          Refresh
        </Button>
      </HStack>

      {isPersonal ? (
        <PersonalPositionsTable
          view={view}
          search={search}
          positions={personalPositions}
          pageSize={pageSize}
          activePage={currentPage}
          onPageChange={setActivePage}
        />
      ) : isProtocolView ? (
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

      {rowCount === 0 ? (
        <Box paddingY={4}>
          <Text font="label2" color="fgMuted" textAlign="center">
            {isPersonal
              ? 'No DeFi positions found for this wallet.'
              : 'No results match your search.'}
          </Text>
        </Box>
      ) : null}
    </VStack>
  );
};
