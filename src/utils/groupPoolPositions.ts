import type { GroupedPoolPosition, PoolPositionLeg } from '../api/walletTypes';

const LP_MODULE_PATTERN = /liquidity|farming|pool|lp|amm/i;

export function isLiquidityPoolLeg(leg: PoolPositionLeg): boolean {
  return (
    leg.protocolModule === 'liquidity_pool' ||
    LP_MODULE_PATTERN.test(leg.positionType) ||
    LP_MODULE_PATTERN.test(leg.name)
  );
}

function pairLabelFromLegs(legs: PoolPositionLeg[]): string {
  const symbols = legs
    .map((leg) => leg.symbol)
    .filter((symbol): symbol is string => Boolean(symbol));

  if (symbols.length >= 2) {
    return symbols.join(' / ');
  }

  if (symbols.length === 1) {
    return symbols[0];
  }

  return legs[0]?.name ?? 'Liquidity pool';
}

function poolNameFromLegs(legs: PoolPositionLeg[], protocol: string): string {
  const pair = pairLabelFromLegs(legs);
  if (pair !== 'Liquidity pool' && !pair.toLowerCase().includes(protocol.toLowerCase())) {
    return pair;
  }
  return legs[0]?.name ?? `${protocol} pool`;
}

function aggregateChange(legs: PoolPositionLeg[]): {
  change24hUsd: number | null;
  change24hPercent: number | null;
} {
  const legsWithChange = legs.filter((leg) => leg.change24hUsd !== null && leg.valueUsd > 0);
  if (legsWithChange.length === 0) {
    return { change24hUsd: null, change24hPercent: null };
  }

  const valueUsd = legs.reduce((sum, leg) => sum + leg.valueUsd, 0);
  const change24hUsd = legsWithChange.reduce((sum, leg) => sum + (leg.change24hUsd ?? 0), 0);
  const change24hPercent = valueUsd > 0 ? (change24hUsd / valueUsd) * 100 : null;

  return { change24hUsd, change24hPercent };
}

export function groupPoolPositions(legs: PoolPositionLeg[]): GroupedPoolPosition[] {
  const liquidityLegs = legs.filter(isLiquidityPoolLeg).filter((leg) => leg.valueUsd > 0);
  const grouped = new Map<string, PoolPositionLeg[]>();

  for (const leg of liquidityLegs) {
    const key = leg.groupId ?? leg.id;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(leg);
      continue;
    }
    grouped.set(key, [leg]);
  }

  return [...grouped.entries()]
    .map(([groupId, groupLegs]) => {
      const sortedLegs = [...groupLegs].sort((a, b) => b.valueUsd - a.valueUsd);
      const primary = sortedLegs[0];
      const valueUsd = sortedLegs.reduce((sum, leg) => sum + leg.valueUsd, 0);
      const { change24hUsd, change24hPercent } = aggregateChange(sortedLegs);

      return {
        groupId,
        protocol: primary.protocol,
        protocolIconUrl: primary.protocolIconUrl,
        poolName: poolNameFromLegs(sortedLegs, primary.protocol),
        pairLabel: pairLabelFromLegs(sortedLegs),
        chain: primary.chain,
        valueUsd,
        change24hUsd,
        change24hPercent,
        unrealizedPnlUsd: null,
        unrealizedPnlPercent: null,
        legs: sortedLegs,
      };
    })
    .sort((a, b) => b.valueUsd - a.valueUsd);
}

export function poolsTotalUsd(pools: GroupedPoolPosition[]): number {
  return pools.reduce((sum, pool) => sum + pool.valueUsd, 0);
}
