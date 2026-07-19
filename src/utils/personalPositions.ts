import type { PersonalPosition } from '../api/walletTypes';
import type { DataView } from './defiViews';

const CHAIN_LABELS: Record<string, string> = {
  ethereum: 'Ethereum',
  arbitrum: 'Arbitrum',
  base: 'Base',
  optimism: 'Optimism',
  polygon: 'Polygon',
  'binance-smart-chain': 'BNB Chain',
  eth: 'Ethereum',
  arb: 'Arbitrum',
  op: 'Optimism',
  matic: 'Polygon',
  bsc: 'BNB Chain',
};

export function formatChain(chain: string): string {
  return CHAIN_LABELS[chain] ?? chain.replace(/-/g, ' ');
}

const LENDING_INCLUDE_PATTERN = /lend|supply|deposit|borrow/i;
const LP_EXCLUDE_PATTERN = /liquidity|farming|pool|lp|amm|farm/i;
const BORROW_SIDE_PATTERN = /borrow|loan|debt|variable|stable/i;

function matchesSearch(...values: string[]): (search: string) => boolean {
  return (search) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return values.some((value) => value.toLowerCase().includes(query));
  };
}

function isLpOrFarmPosition(position: PersonalPosition): boolean {
  return (
    LP_EXCLUDE_PATTERN.test(position.positionType) || LP_EXCLUDE_PATTERN.test(position.name)
  );
}

export function isLendingMarketPosition(position: PersonalPosition): boolean {
  if (isLpOrFarmPosition(position)) {
    return false;
  }

  return (
    LENDING_INCLUDE_PATTERN.test(position.positionType) ||
    LENDING_INCLUDE_PATTERN.test(position.name)
  );
}

export function isBorrowSidePosition(position: PersonalPosition): boolean {
  return (
    BORROW_SIDE_PATTERN.test(position.positionType) ||
    BORROW_SIDE_PATTERN.test(position.name)
  );
}

export function borrowPositionSuppliedUsd(position: PersonalPosition): number | null {
  if (isBorrowSidePosition(position)) {
    return null;
  }

  return position.valueUsd;
}

export function borrowPositionBorrowedUsd(position: PersonalPosition): number | null {
  if (!isBorrowSidePosition(position)) {
    return null;
  }

  return position.valueUsd;
}

export function filterPersonalPositions(
  positions: PersonalPosition[],
  view: DataView,
  search: string,
): PersonalPosition[] {
  let filtered = positions;

  switch (view) {
    case 'staking':
      filtered = positions.filter(
        (position) =>
          /stak|vest|lock/i.test(position.positionType) || /stak|vest|lock/i.test(position.name),
      );
      break;
    case 'liquidity':
      filtered = positions.filter(
        (position) =>
          /liquidity|farming|pool|lp|amm/i.test(position.positionType) ||
          /liquidity|farming|pool|lp|amm/i.test(position.name),
      );
      break;
    case 'yield':
      filtered = positions.filter(
        (position) =>
          /lend|supply|deposit|earn|vault|farming/i.test(position.positionType) ||
          /lend|supply|deposit|earn|vault/i.test(position.name),
      );
      break;
    case 'borrow':
      filtered = positions.filter(isLendingMarketPosition);
      break;
    case 'swap':
      filtered = positions.filter(
        (position) =>
          /swap|dex|trading/i.test(position.positionType) ||
          /swap|dex|trading/i.test(position.name),
      );
      break;
    default:
      break;
  }

  if (!search.trim()) {
    return filtered;
  }

  const match = matchesSearch;
  return filtered.filter((position) =>
    match(position.name, position.protocol, position.chain, position.positionType)(search),
  );
}

export function borrowTotalDebt(positions: PersonalPosition[]): number {
  return filterPersonalPositions(positions, 'borrow', '').reduce(
    (sum, position) => sum + (borrowPositionBorrowedUsd(position) ?? 0),
    0,
  );
}

export function personalPositionsTotalValue(positions: PersonalPosition[]): number {
  return positions.reduce((sum, position) => sum + position.valueUsd, 0);
}
