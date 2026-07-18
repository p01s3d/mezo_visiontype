import type { GroupedPoolPosition, PoolPositionLeg } from '../api/walletTypes';

export type FungiblePnlStats = {
  unrealizedGainUsd: number;
  netInvestedUsd: number | null;
  relativeUnrealizedGainPercent: number | null;
};

export function applyLegUnrealizedPnl(
  legs: PoolPositionLeg[],
  pnlByFungibleId: Record<string, FungiblePnlStats>,
): PoolPositionLeg[] {
  return legs.map((leg) => {
    if (!leg.fungibleId) {
      return { ...leg, unrealizedPnlUsd: null };
    }

    const stats = pnlByFungibleId[leg.fungibleId];
    if (!stats) {
      return { ...leg, unrealizedPnlUsd: null };
    }

    return { ...leg, unrealizedPnlUsd: stats.unrealizedGainUsd };
  });
}

function aggregatePoolPnl(legs: PoolPositionLeg[], valueUsd: number): {
  unrealizedPnlUsd: number | null;
  unrealizedPnlPercent: number | null;
} {
  const legsWithPnl = legs.filter((leg) => leg.unrealizedPnlUsd !== null);
  if (legsWithPnl.length === 0) {
    return { unrealizedPnlUsd: null, unrealizedPnlPercent: null };
  }

  const unrealizedPnlUsd = legsWithPnl.reduce((sum, leg) => sum + (leg.unrealizedPnlUsd ?? 0), 0);
  const costBasis = valueUsd - unrealizedPnlUsd;

  const unrealizedPnlPercent =
    costBasis > 0 ? (unrealizedPnlUsd / costBasis) * 100 : null;

  return { unrealizedPnlUsd, unrealizedPnlPercent };
}

export function withPoolUnrealizedPnl(
  pools: GroupedPoolPosition[],
  pnlByFungibleId: Record<string, FungiblePnlStats>,
): GroupedPoolPosition[] {
  return pools.map((pool) => {
    const legs = applyLegUnrealizedPnl(pool.legs, pnlByFungibleId);
    const { unrealizedPnlUsd, unrealizedPnlPercent } = aggregatePoolPnl(legs, pool.valueUsd);

    return {
      ...pool,
      legs,
      unrealizedPnlUsd,
      unrealizedPnlPercent,
    };
  });
}

export function collectFungibleIds(legs: PoolPositionLeg[]): string[] {
  return [...new Set(legs.map((leg) => leg.fungibleId).filter((id): id is string => Boolean(id)))];
}
