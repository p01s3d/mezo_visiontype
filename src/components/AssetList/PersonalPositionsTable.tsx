import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from '@coinbase/cds-web/tables';
import { Icon } from '@coinbase/cds-web/icons';
import { Pagination } from '@coinbase/cds-web/pagination/Pagination';
import type { PersonalPosition } from '../../api/debank';
import { summarizeByProtocol } from '../../api/debank';
import { formatUsd } from '../../utils/format';
import { formatChain } from '../../utils/personalPositions';
import type { DataView } from '../../utils/defiViews';
import { filterPersonalPositions } from '../../utils/personalPositions';

type PersonalPositionsTableProps = {
  view: DataView;
  search: string;
  positions: PersonalPosition[];
  pageSize: number;
  activePage: number;
  onPageChange: (page: number) => void;
};

export function PersonalPositionsTable({
  view,
  search,
  positions,
  pageSize,
  activePage,
  onPageChange,
}: PersonalPositionsTableProps) {
  const isProtocolView = view === 'protocols';

  const rows = isProtocolView
    ? summarizeByProtocol(positions).filter((item) => {
        if (!search.trim()) return true;
        const query = search.toLowerCase();
        return (
          item.protocol.toLowerCase().includes(query) ||
          item.chain.toLowerCase().includes(query)
        );
      })
    : filterPersonalPositions(positions, view, search);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(activePage, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(startIndex, startIndex + pageSize);

  if (isProtocolView) {
    return (
      <Table tableLayout="auto" variant="ruled">
        <TableHeader>
          <TableRow>
            <TableCell title="Protocol" width="35%" />
            <TableCell title="Chain" width="25%" />
            <TableCell alignItems="flex-end" title="Positions" width="20%" />
            <TableCell alignItems="flex-end" title="Value" width="20%" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((item) => {
            const protocol = item as ReturnType<typeof summarizeByProtocol>[number];
            return (
              <TableRow key={protocol.id}>
                <TableCell
                  start={<Icon name="defi" size="m" paddingEnd={1} />}
                  title={protocol.protocol}
                  width="35%"
                />
                <TableCell title={formatChain(protocol.chain)} width="25%" />
                <TableCell
                  alignItems="flex-end"
                  direction="horizontal"
                  justifyContent="flex-end"
                  title={String(protocol.positionCount)}
                  width="20%"
                />
                <TableCell
                  alignItems="flex-end"
                  direction="horizontal"
                  justifyContent="flex-end"
                  title={formatUsd(protocol.valueUsd)}
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
                onChange={onPageChange}
                totalPages={totalPages}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
  }

  return (
    <Table tableLayout="auto" variant="ruled">
      <TableHeader>
        <TableRow>
          <TableCell title="Position" width="30%" />
          <TableCell title="Protocol" width="25%" />
          <TableCell title="Chain" width="15%" />
          <TableCell title="Type" width="15%" />
          <TableCell alignItems="flex-end" title="Value" width="15%" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {pageRows.map((row) => {
          const position = row as PersonalPosition;
          return (
            <TableRow key={position.id}>
              <TableCell
                start={<Icon name="defi" size="m" paddingEnd={1} />}
                title={position.name}
                width="30%"
              />
              <TableCell title={position.protocol} width="25%" />
              <TableCell title={formatChain(position.chain)} width="15%" />
              <TableCell title={position.positionType} width="15%" />
              <TableCell
                alignItems="flex-end"
                direction="horizontal"
                justifyContent="flex-end"
                title={formatUsd(position.valueUsd)}
                width="15%"
              />
            </TableRow>
          );
        })}
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

export function getPersonalRowCount(
  view: DataView,
  search: string,
  positions: PersonalPosition[],
): number {
  if (view === 'protocols') {
    return summarizeByProtocol(positions).filter((item) => {
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return (
        item.protocol.toLowerCase().includes(query) || item.chain.toLowerCase().includes(query)
      );
    }).length;
  }

  return filterPersonalPositions(positions, view, search).length;
}
