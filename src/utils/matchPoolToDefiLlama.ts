import type { Protocol, YieldPool } from '../api/defillama';
import type { GroupedPoolPosition, PersonalPosition, WalletToken } from '../api/walletTypes';
import type { MatchedMarket } from '../types/positionHealth';

const CHAIN_ALIASES: Record<string, string> = {
  eth: 'ethereum',
  ethereum: 'ethereum',
  arb: 'arbitrum',
  arbitrum: 'arbitrum',
  op: 'optimism',
  optimism: 'optimism',
  matic: 'polygon',
  polygon: 'polygon',
  avax: 'avalanche',
  avalanche: 'avalanche',
  bsc: 'bsc',
  base: 'base',
};

function normalizeChain(chain: string): string {
  const key = chain.toLowerCase().trim();
  return CHAIN_ALIASES[key] ?? key;
}

function normalizeProtocol(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+v?\d+(\.\d+)?$/i, '')
    .replace(/[^a-z0-9]/g, '');
}

function normalizeSymbol(text: string): string {
  return text
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9/\-]/g, '');
}

function symbolOverlap(a: string, b: string): number {
  const partsA = new Set(normalizeSymbol(a).split(/[/\-]/).filter(Boolean));
  const partsB = new Set(normalizeSymbol(b).split(/[/\-]/).filter(Boolean));
  if (partsA.size === 0 || partsB.size === 0) return 0;
  let overlap = 0;
  for (const part of partsA) {
    if (partsB.has(part)) overlap += 1;
  }
  return overlap / Math.max(partsA.size, partsB.size);
}

function scorePoolMatch(
  pool: GroupedPoolPosition,
  yieldPool: YieldPool,
): number {
  const chainMatch = normalizeChain(pool.chain) === normalizeChain(yieldPool.chain) ? 1 : 0;
  const protocolMatch =
    normalizeProtocol(pool.protocol) === normalizeProtocol(yieldPool.project) ||
    normalizeProtocol(pool.protocol).includes(normalizeProtocol(yieldPool.project)) ||
    normalizeProtocol(yieldPool.project).includes(normalizeProtocol(pool.protocol))
      ? 1
      : 0;
  const symbolScore = symbolOverlap(pool.pairLabel || pool.poolName, yieldPool.symbol);
  return chainMatch * 3 + protocolMatch * 2 + symbolScore;
}

export function matchPoolToYieldPool(
  pool: GroupedPoolPosition,
  yieldPools: YieldPool[],
): MatchedMarket | null {
  const chain = normalizeChain(pool.chain);
  const protocolNorm = normalizeProtocol(pool.protocol);

  let best: { pool: YieldPool; score: number } | null = null;
  for (const yieldPool of yieldPools) {
    if (normalizeChain(yieldPool.chain) !== chain) continue;
    const score = scorePoolMatch(pool, yieldPool);
    if (score < 2) continue;
    if (!best || score > best.score) {
      best = { pool: yieldPool, score };
    }
  }

  if (best && best.score >= 4) {
    return { yieldPool: best.pool, matchQuality: 'fuzzy' };
  }

  if (best && best.score >= 2) {
    return { yieldPool: best.pool, matchQuality: 'protocol' };
  }

  const protocolPool = yieldPools.find(
    (yp) =>
      normalizeChain(yp.chain) === chain &&
      (normalizeProtocol(yp.project) === protocolNorm ||
        normalizeProtocol(yp.project).includes(protocolNorm)),
  );

  if (protocolPool) {
    return { yieldPool: protocolPool, matchQuality: 'protocol' };
  }

  return null;
}

export function matchTokenToYieldPool(
  token: WalletToken,
  yieldPools: YieldPool[],
): MatchedMarket | null {
  const chain = normalizeChain(token.chain);
  const symbol = token.symbol.toUpperCase();

  const onChain = yieldPools.filter((p) => normalizeChain(p.chain) === chain);
  const containing = onChain.filter((p) =>
    normalizeSymbol(p.symbol).includes(symbol),
  );

  if (containing.length === 0) return null;

  const best = [...containing].sort((a, b) => b.tvlUsd - a.tvlUsd)[0];
  return { yieldPool: best, matchQuality: 'fuzzy' };
}

export function matchPersonalToProtocol(
  position: PersonalPosition,
  protocols: Protocol[],
): MatchedMarket | null {
  const protocolNorm = normalizeProtocol(position.protocol);

  const match = protocols.find(
    (p) =>
      normalizeProtocol(p.name) === protocolNorm ||
      p.slug === protocolNorm ||
      normalizeProtocol(p.name).includes(protocolNorm),
  );

  if (!match) return null;

  return {
    yieldPool: null,
    matchQuality: 'protocol',
    protocolSlug: match.slug,
    protocolTvlUsd: match.tvl,
  };
}

export function findOpportunityPool(
  pool: GroupedPoolPosition,
  matched: MatchedMarket | null,
  yieldPools: YieldPool[],
): YieldPool | null {
  if (!matched?.yieldPool) return null;

  const chain = normalizeChain(pool.chain);
  const currentApy = matched.yieldPool.apy;
  const pairParts = normalizeSymbol(pool.pairLabel || pool.poolName).split(/[/\-]/);

  let best: YieldPool | null = null;
  let bestDelta = 0;

  for (const candidate of yieldPools) {
    if (normalizeChain(candidate.chain) !== chain) continue;
    if (candidate.project === matched.yieldPool.project && candidate.pool === matched.yieldPool.pool) {
      continue;
    }
    const delta = candidate.apy - currentApy;
    if (delta < 2) continue;

    const overlap = pairParts.some((part) => normalizeSymbol(candidate.symbol).includes(part));
    if (!overlap && !candidate.stablecoin) continue;

    if (delta > bestDelta) {
      bestDelta = delta;
      best = candidate;
    }
  }

  return best;
}
