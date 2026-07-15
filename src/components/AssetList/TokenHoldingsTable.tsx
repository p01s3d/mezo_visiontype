import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from '@coinbase/cds-web/tables';
import { Pagination } from '@coinbase/cds-web/pagination/Pagination';
import { TokenIcon } from '../Home/TokenIcon';
import type { WalletToken } from '../../api/walletTypes';
import { formatUsd } from '../../utils/format';
import { filterWalletTokens, formatTokenAmount } from '../../utils/tokenHoldings';
import { formatChain } from '../../utils/personalPositions';

type TokenHoldingsTableProps = {
  tokens: WalletToken[];
  search: string;
  pageSize: number;
  activePage: number;
  onPageChange: (page: number) => void;
};

export function TokenHoldingsTable({
  tokens,
  search,
  pageSize,
  activePage,
  onPageChange,
}: TokenHoldingsTableProps) {
  const rows = filterWalletTokens(tokens, search);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(activePage, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(startIndex, startIndex + pageSize);

  return (
    <Table tableLayout="auto" variant="ruled">
      <TableHeader>
        <TableRow>
          <TableCell title="Token" width="30%" />
          <TableCell title="Chain" width="15%" />
          <TableCell alignItems="flex-end" title="Balance" width="20%" />
          <TableCell alignItems="flex-end" title="Price" width="15%" />
          <TableCell alignItems="flex-end" title="Value" width="20%" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {pageRows.map((token) => (
          <TableRow key={token.id}>
            <TableCell
              start={<TokenIcon size="m" source={token.logoUrl} symbol={token.symbol} />}
              subtitle={token.symbol}
              title={token.name}
              width="30%"
            />
            <TableCell title={formatChain(token.chain)} width="15%" />
            <TableCell
              alignItems="flex-end"
              direction="horizontal"
              justifyContent="flex-end"
              title={formatTokenAmount(token.amount)}
              width="20%"
            />
            <TableCell
              alignItems="flex-end"
              direction="horizontal"
              justifyContent="flex-end"
              subtitle="USD"
              title={token.price > 0 ? formatUsd(token.price) : '—'}
              width="15%"
            />
            <TableCell
              alignItems="flex-end"
              direction="horizontal"
              justifyContent="flex-end"
              title={token.valueUsd > 0 ? formatUsd(token.valueUsd) : '—'}
              width="20%"
            />
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={5} direction="horizontal">
            <Pagination activePage={currentPage} onChange={onPageChange} totalPages={totalPages} />
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export function getTokenRowCount(tokens: WalletToken[], search: string): number {
  return filterWalletTokens(tokens, search).length;
}
