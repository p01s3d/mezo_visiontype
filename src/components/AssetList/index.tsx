import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from '@coinbase/cds-web/tables';
import { mockPositions } from './data';
import { Tooltip } from '@coinbase/cds-web/overlays';
import { HStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { useState } from 'react';
import { Icon } from '@coinbase/cds-web/icons';
import { Pagination } from '@coinbase/cds-web/pagination/Pagination';

export const AssetList = ({ pageSize }: { pageSize: number }) => {
  const totalResults = mockPositions.length;
  const [activePage, setActivePage] = useState(1);
  const startIndex = (activePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalResults);
  const positions = mockPositions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalResults / pageSize);

  return (
    <Table tableLayout="auto" variant="ruled">
      <TableHeader>
        <TableRow>
          <TableCell title="Position" width="35%" />
          <TableCell title="Protocol" width="25%" />
          <TableCell width="20%">
            <Tooltip content="Total value in USD">
              <Text as="span" color="currentColor">
                <HStack>
                  Value <Icon name="info" size="xs" />
                </HStack>
              </Text>
            </Tooltip>
          </TableCell>
          <TableCell alignItems="flex-end" title="APY" width="10%" />
          <TableCell alignItems="flex-end" title="Status" width="10%" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map((position) => (
          <TableRow key={position.id}>
            <TableCell
              start={<Icon name="defi" size="m" paddingEnd={1} />}
              subtitle={position.asset}
              title={position.name}
              width="35%"
            />
            <TableCell title={position.protocol} width="25%" />
            <TableCell title={`$${position.valueUsd}`} width="20%" />
            <TableCell
              direction="horizontal"
              justifyContent="flex-end"
              title={position.apy}
              width="10%"
            />
            <TableCell direction="horizontal" justifyContent="flex-end" width="10%">
              <Icon
                color={position.active ? 'fgPositive' : 'fgMuted'}
                name={position.active ? 'circleCheckmark' : 'circleCross'}
                size="m"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={5} direction="horizontal">
            <Pagination activePage={activePage} onChange={setActivePage} totalPages={totalPages} />
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
};
