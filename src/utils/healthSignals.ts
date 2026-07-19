import type { Protocol, YieldPool } from '../api/defillama';
import type { GroupedPoolPosition, PersonalPosition, WalletToken } from '../api/walletTypes';
import { isBorrowSidePosition } from './personalPositions';
import type {
  HealthCandidate,
  HealthSignal,
  SignalSeverity,
  VerdictPromptInput,
} from '../types/positionHealth';
import {
  findOpportunityPool,
  matchPersonalToProtocol,
  matchPoolToYieldPool,
  matchTokenToYieldPool,
} from './matchPoolToDefiLlama';
import { categorizeToken, categoryTotals, portfolioTotalUsd } from './tokenCategories';

const CONCENTRATION_THRESHOLD = 0.55;
const APY_COLLAPSE_THRESHOLD = -15;
const OPPORTUNITY_APY_DELTA = 2;
const PNL_BLEED_USD = -100;
const ALT_BAG_MIN_SHARE = 0.05;
const ALT_BAG_MAX_USD = 5000;

const SIGNAL_WEIGHTS: Record<string, number> = {
  pnl_bleed: 3,
  apy_collapse: 3,
  tvl_decay: 2,
  concentration: 2,
  opportunity: 2,
  alt_bag_risk: 2,
  defi_heavy: 1,
};

function severityWeight(severity: SignalSeverity): number {
  return severity === 'high' ? 3 : severity === 'medium' ? 2 : 1;
}

function computeScore(signals: HealthSignal[]): number {
  return signals.reduce(
    (sum, signal) => sum + (SIGNAL_WEIGHTS[signal.id] ?? 1) * severityWeight(signal.severity),
    0,
  );
}

function formatChainLabel(chain: string): string {
  const labels: Record<string, string> = {
    ethereum: 'Ethereum',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
    polygon: 'Polygon',
    avalanche: 'Avalanche',
    bsc: 'BNB Chain',
    base: 'Base',
  };
  return labels[chain.toLowerCase()] ?? chain;
}

function buildPortfolioContext(tokens: WalletToken[], totalUsd: number) {
  const totals = categoryTotals(tokens);
  const defiSharePct = totalUsd > 0 ? (totals.defi / totalUsd) * 100 : 0;
  const topHoldings = [...tokens]
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .slice(0, 3)
    .map((t) => t.symbol);
  return { totalUsd, defiSharePct, topHoldings };
}

function candidateFromPool(
  pool: GroupedPoolPosition,
  totalUsd: number,
  yieldPools: YieldPool[],
  protocols: Protocol[],
): HealthCandidate | null {
  const matched = matchPoolToYieldPool(pool, yieldPools);
  const signals: HealthSignal[] = [];
  const shareOfPortfolioPct = totalUsd > 0 ? (pool.valueUsd / totalUsd) * 100 : 0;

  if (
    pool.unrealizedPnlUsd !== null &&
    pool.unrealizedPnlUsd < PNL_BLEED_USD &&
    (pool.change24hUsd ?? 0) < 0
  ) {
    signals.push({
      id: 'pnl_bleed',
      severity: pool.unrealizedPnlUsd < PNL_BLEED_USD * 3 ? 'high' : 'medium',
      facts: {
        unrealizedPnlUsd: pool.unrealizedPnlUsd,
        change24hUsd: pool.change24hUsd,
        change24hPct: pool.change24hPercent,
      },
    });
  }

  const apyChange1d = matched?.yieldPool?.apyPct1D;
  if (apyChange1d !== null && apyChange1d !== undefined && apyChange1d <= APY_COLLAPSE_THRESHOLD) {
    signals.push({
      id: 'apy_collapse',
      severity: apyChange1d <= APY_COLLAPSE_THRESHOLD * 1.5 ? 'high' : 'medium',
      facts: {
        apy: matched?.yieldPool?.apy ?? null,
        apyChange1dPct: apyChange1d,
        tvlUsd: matched?.yieldPool?.tvlUsd ?? null,
      },
    });
  }

  if (matched?.yieldPool && matched.yieldPool.tvlUsd < 1_000_000) {
    signals.push({
      id: 'tvl_decay',
      severity: matched.yieldPool.tvlUsd < 250_000 ? 'high' : 'medium',
      facts: { tvlUsd: matched.yieldPool.tvlUsd },
    });
  }

  const altPool = findOpportunityPool(pool, matched, yieldPools);
  if (altPool) {
    const delta = altPool.apy - (matched?.yieldPool?.apy ?? 0);
    if (delta >= OPPORTUNITY_APY_DELTA) {
      signals.push({
        id: 'opportunity',
        severity: delta >= 5 ? 'high' : 'medium',
        facts: {
          currentApy: matched?.yieldPool?.apy ?? null,
          altApy: altPool.apy,
          altProtocol: altPool.project,
          altSymbol: altPool.symbol,
          apyDeltaPct: delta,
        },
      });
    }
  }

  if (signals.length === 0) return null;

  const protocolMatch = protocols.find(
    (p) => p.name.toLowerCase().includes(pool.protocol.toLowerCase().split(' ')[0]),
  );

  return {
    id: pool.groupId,
    positionKind: 'lp_pool',
    label: `${pool.poolName} · ${formatChainLabel(pool.chain)}`,
    protocol: pool.protocol,
    chain: pool.chain,
    valueUsd: pool.valueUsd,
    shareOfPortfolioPct,
    score: computeScore(signals),
    signals,
    market: matched?.yieldPool
      ? {
          matchedPoolSymbol: matched.yieldPool.symbol,
          apy: matched.yieldPool.apy,
          apyChange1dPct: matched.yieldPool.apyPct1D,
          tvlUsd: matched.yieldPool.tvlUsd,
          ilRisk: matched.yieldPool.ilRisk,
          protocolTvlUsd: protocolMatch?.tvl,
        }
      : protocolMatch
        ? { protocolTvlUsd: protocolMatch.tvl }
        : undefined,
    pnl: {
      unrealizedUsd: pool.unrealizedPnlUsd,
      unrealizedPct: pool.unrealizedPnlPercent,
      change24hUsd: pool.change24hUsd,
      change24hPct: pool.change24hPercent,
    },
    opportunity: altPool
      ? {
          altProtocol: altPool.project,
          altApy: altPool.apy,
          altSymbol: altPool.symbol,
          apyDeltaPct: altPool.apy - (matched?.yieldPool?.apy ?? 0),
        }
      : undefined,
  };
}

function candidateFromToken(
  token: WalletToken,
  totalUsd: number,
  yieldPools: YieldPool[],
): HealthCandidate | null {
  const signals: HealthSignal[] = [];
  const shareOfPortfolioPct = totalUsd > 0 ? (token.valueUsd / totalUsd) * 100 : 0;

  if (shareOfPortfolioPct >= CONCENTRATION_THRESHOLD * 100) {
    signals.push({
      id: 'concentration',
      severity: shareOfPortfolioPct >= 70 ? 'high' : 'medium',
      facts: { symbol: token.symbol, sharePct: shareOfPortfolioPct },
    });
  }

  const category = categorizeToken(token);
  if (category === 'defi' && token.valueUsd >= ALT_BAG_MIN_SHARE * totalUsd && token.valueUsd < ALT_BAG_MAX_USD) {
    signals.push({
      id: 'alt_bag_risk',
      severity: shareOfPortfolioPct >= 10 ? 'medium' : 'low',
      facts: { symbol: token.symbol, valueUsd: token.valueUsd, sharePct: shareOfPortfolioPct },
    });
  }

  const matched = matchTokenToYieldPool(token, yieldPools);
  if (matched?.yieldPool && matched.yieldPool.apy >= 5) {
    signals.push({
      id: 'opportunity',
      severity: 'low',
      facts: {
        altApy: matched.yieldPool.apy,
        altProtocol: matched.yieldPool.project,
        altSymbol: matched.yieldPool.symbol,
      },
    });
  }

  if (signals.length === 0) return null;

  return {
    id: token.id,
    positionKind: 'token',
    label: `${token.name} (${token.symbol}) · ${formatChainLabel(token.chain)}`,
    protocol: token.symbol,
    chain: token.chain,
    valueUsd: token.valueUsd,
    shareOfPortfolioPct,
    score: computeScore(signals),
    signals,
    market: matched?.yieldPool
      ? {
          matchedPoolSymbol: matched.yieldPool.symbol,
          apy: matched.yieldPool.apy,
          apyChange1dPct: matched.yieldPool.apyPct1D,
          tvlUsd: matched.yieldPool.tvlUsd,
        }
      : undefined,
  };
}

function candidateFromPersonal(
  position: PersonalPosition,
  totalUsd: number,
  protocols: Protocol[],
): HealthCandidate | null {
  const matched = matchPersonalToProtocol(position, protocols);
  const shareOfPortfolioPct = totalUsd > 0 ? (position.valueUsd / totalUsd) * 100 : 0;
  const signals: HealthSignal[] = [];

  if (
    !isBorrowSidePosition(position) &&
    position.debtUsd > 0 &&
    position.valueUsd > 0
  ) {
    const ltv = position.debtUsd / position.valueUsd;
    if (ltv > 0.75) {
      signals.push({
        id: 'pnl_bleed',
        severity: ltv > 0.85 ? 'high' : 'medium',
        facts: { debtUsd: position.debtUsd, valueUsd: position.valueUsd, ltv },
      });
    }
  }

  if (shareOfPortfolioPct >= 30) {
    signals.push({
      id: 'concentration',
      severity: 'medium',
      facts: { protocol: position.protocol, sharePct: shareOfPortfolioPct },
    });
  }

  if (signals.length === 0) return null;

  return {
    id: position.id,
    positionKind: 'personal_defi',
    label: `${position.name} · ${formatChainLabel(position.chain)}`,
    protocol: position.protocol,
    chain: position.chain,
    valueUsd: position.valueUsd,
    shareOfPortfolioPct,
    score: computeScore(signals),
    signals,
    market: matched
      ? { protocolTvlUsd: matched.protocolTvlUsd }
      : undefined,
  };
}

export type HealthInputs = {
  walletTokens: WalletToken[];
  poolPositions: GroupedPoolPosition[];
  personalPositions: PersonalPosition[];
  yieldPools: YieldPool[];
  protocols: Protocol[];
};

export function computeHealthCandidates(inputs: HealthInputs): HealthCandidate[] {
  const { walletTokens, poolPositions, personalPositions, yieldPools, protocols } = inputs;
  const totalUsd =
    portfolioTotalUsd(walletTokens) +
    poolPositions.reduce((s, p) => s + p.valueUsd, 0) +
    personalPositions.reduce((s, p) => s + p.valueUsd, 0);

  const effectiveTotal = totalUsd > 0 ? totalUsd : 1;
  const candidates: HealthCandidate[] = [];

  for (const pool of poolPositions) {
    const c = candidateFromPool(pool, effectiveTotal, yieldPools, protocols);
    if (c) candidates.push(c);
  }

  for (const token of walletTokens) {
    const c = candidateFromToken(token, effectiveTotal, yieldPools);
    if (c) candidates.push(c);
  }

  for (const position of personalPositions) {
    const c = candidateFromPersonal(position, effectiveTotal, protocols);
    if (c) candidates.push(c);
  }

  const totals = categoryTotals(walletTokens);
  if (effectiveTotal > 0 && totals.defi / effectiveTotal >= 0.25) {
    const defiSignal: HealthSignal = {
      id: 'defi_heavy',
      severity: totals.defi / effectiveTotal >= 0.5 ? 'medium' : 'low',
      facts: { defiSharePct: (totals.defi / effectiveTotal) * 100 },
    };
    const topPool = candidates.find((c) => c.positionKind === 'lp_pool');
    if (topPool && !topPool.signals.some((s) => s.id === 'defi_heavy')) {
      topPool.signals.push(defiSignal);
      topPool.score = computeScore(topPool.signals);
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}

export function toVerdictPromptInput(
  candidate: HealthCandidate,
  tokens: WalletToken[],
  totalUsd: number,
): VerdictPromptInput {
  return {
    candidateId: candidate.id,
    positionKind: candidate.positionKind,
    label: candidate.label,
    protocol: candidate.protocol,
    chain: candidate.chain,
    valueUsd: candidate.valueUsd,
    shareOfPortfolioPct: candidate.shareOfPortfolioPct,
    signals: candidate.signals,
    market: candidate.market,
    pnl: candidate.pnl,
    opportunity: candidate.opportunity,
    portfolioContext: buildPortfolioContext(tokens, totalUsd),
  };
}

export function ruleOnlyHeadline(candidate: HealthCandidate): string {
  const primary = candidate.signals[0];
  switch (primary?.id) {
    case 'pnl_bleed':
      return `${candidate.label.split(' · ')[0]} is losing value`;
    case 'apy_collapse':
      return `Yield dropping on ${candidate.protocol}`;
    case 'tvl_decay':
      return `Low TVL on ${candidate.protocol} pool`;
    case 'concentration':
      return `Heavy exposure in ${candidate.label.split(' · ')[0]}`;
    case 'opportunity':
      return `Better yield available for ${candidate.protocol}`;
    case 'alt_bag_risk':
      return `Review ${candidate.protocol} bag risk`;
    default:
      return `Review ${candidate.label.split(' · ')[0]}`;
  }
}

export function ruleOnlyReasoning(candidate: HealthCandidate): string {
  const parts = candidate.signals.slice(0, 2).map((s) => {
    if (s.id === 'apy_collapse') return `APY moved ${s.facts.apyChange1dPct}% in 24h.`;
    if (s.id === 'pnl_bleed') return `Unrealized PnL is ${s.facts.unrealizedPnlUsd} USD with negative 24h change.`;
    if (s.id === 'opportunity') return `Alternative pool APY is ~${s.facts.altApy}% (+${s.facts.apyDeltaPct}% vs yours).`;
    if (s.id === 'concentration') return `This position is ${Math.round(Number(s.facts.sharePct))}% of portfolio.`;
    return `Signal: ${s.id}.`;
  });
  return parts.join(' ');
}

export function inferVerdictFromSignals(candidate: HealthCandidate): 'hold' | 'reduce' | 'exit' {
  const highSeverity = candidate.signals.filter((s) => s.severity === 'high');
  if (highSeverity.some((s) => s.id === 'pnl_bleed' || s.id === 'apy_collapse')) return 'exit';
  if (highSeverity.length >= 2) return 'reduce';
  if (candidate.signals.some((s) => s.id === 'opportunity' && !highSeverity.length)) return 'hold';
  if (candidate.score >= 6) return 'reduce';
  return 'hold';
}
