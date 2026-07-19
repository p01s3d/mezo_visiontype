import type { Protocol, YieldPool } from '../api/defillama';

export type DataView =
  | 'dashboard'
  | 'protocols'
  | 'liquidity'
  | 'staking'
  | 'swap'
  | 'yield'
  | 'borrow'
  | 'analytics';

const DEX_PROJECTS = new Set([
  'uniswap',
  'curve',
  'balancer',
  'sushiswap',
  'pancakeswap',
  'quickswap',
  'trader-joe',
  'aerodrome',
]);

function matchesSearch(value: string, search: string): boolean {
  return value.toLowerCase().includes(search.trim().toLowerCase());
}

export function filterPools(pools: YieldPool[], view: DataView, search: string): YieldPool[] {
  let filtered = pools;

  switch (view) {
    case 'liquidity':
      filtered = pools.filter((pool) => pool.ilRisk !== 'no' || pool.exposure === 'multi');
      break;
    case 'staking':
      filtered = pools.filter((pool) => pool.ilRisk === 'no' && pool.exposure === 'single');
      break;
    case 'swap':
      filtered = pools.filter((pool) => DEX_PROJECTS.has(pool.project));
      break;
    case 'yield':
      filtered = [...pools].sort((a, b) => b.apy - a.apy);
      break;
    case 'analytics':
      filtered = [...pools].sort((a, b) => (b.apyPct1D ?? 0) - (a.apyPct1D ?? 0));
      break;
    case 'dashboard':
    default:
      filtered = [...pools].sort((a, b) => b.tvlUsd - a.tvlUsd);
      break;
  }

  if (view !== 'dashboard' && view !== 'yield' && view !== 'analytics') {
    filtered = [...filtered].sort((a, b) => b.tvlUsd - a.tvlUsd);
  }

  if (!search.trim()) {
    return filtered;
  }

  return filtered.filter(
    (pool) =>
      matchesSearch(pool.symbol, search) ||
      matchesSearch(pool.project, search) ||
      matchesSearch(pool.chain, search),
  );
}

export function filterProtocols(protocols: Protocol[], search: string): Protocol[] {
  const sorted = [...protocols].sort((a, b) => b.tvl - a.tvl);

  if (!search.trim()) {
    return sorted;
  }

  return sorted.filter(
    (protocol) =>
      matchesSearch(protocol.name, search) ||
      matchesSearch(protocol.category, search) ||
      matchesSearch(protocol.chain, search),
  );
}

export function getAverageApy(pools: YieldPool[], limit = 20): number {
  const topPools = [...pools].sort((a, b) => b.tvlUsd - a.tvlUsd).slice(0, limit);
  if (topPools.length === 0) return 0;
  return topPools.reduce((sum, pool) => sum + pool.apy, 0) / topPools.length;
}

export function getTopStakingPool(pools: YieldPool[]): YieldPool | null {
  return (
    pools
      .filter((pool) => pool.ilRisk === 'no' && pool.exposure === 'single')
      .sort((a, b) => b.tvlUsd - a.tvlUsd)[0] ?? null
  );
}

export function getTopLiquidityPool(pools: YieldPool[]): YieldPool | null {
  return (
    pools
      .filter((pool) => pool.ilRisk !== 'no' || pool.exposure === 'multi')
      .sort((a, b) => b.apy - a.apy)[0] ?? null
  );
}
