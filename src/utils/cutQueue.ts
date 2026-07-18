import type { GroupedPoolPosition, LpTransaction, WalletToken } from '../api/walletTypes';
import type { HealthCandidate, PositionVerdict, VerdictType } from '../types/positionHealth';
import { inferVerdictFromSignals } from './healthSignals';
import {
  categorizeToken,
  categoryTotals,
  portfolioTotalUsd,
  type TokenCategory,
} from './tokenCategories';
import type { HealthGrade } from './portfolioHealthScore';
import { healthGradeLabel } from './portfolioHealthScore';

export const SLEEVE_CUT_SIZE = 3;
export const TAKE_PROFIT_SHARE_PCT = 8;
export const TAKE_PROFIT_GAIN_PCT = 25;

/** @deprecated use SLEEVE_CUT_SIZE — kept for any leftover imports */
export const CUT_QUEUE_SIZE = 5;

export type AllocationSleeveId = 'stablecoins' | 'layer1' | 'defi' | 'lp';

export type CutAction = 'exit' | 'reduce' | 'take_profit' | 'watch';

export type CutQueueItem = {
  id: string;
  label: string;
  valueUsd: number;
  sharePct: number;
  action: CutAction;
  why: string;
  tradeSymbol: string;
  priority: number;
  sleeve: AllocationSleeveId;
};

export type AllocationShares = {
  stablecoins: number;
  layer1: number;
  defi: number;
  lp: number;
};

export type HealthSleeve = {
  id: AllocationSleeveId;
  label: string;
  sharePct: number;
  valueUsd: number;
  score: number;
  grade: HealthGrade;
  summary: string;
  cuts: CutQueueItem[];
  /** True when grade is healthy — render muted when collapsed */
  muted: boolean;
};

export type HealthCockpit = {
  sleeves: HealthSleeve[];
  /** Sleeve with lowest score (auto-expand) */
  defaultExpandedId: AllocationSleeveId | null;
  allocation: AllocationShares;
};

type BuildCutQueueInput = {
  walletTokens: WalletToken[];
  poolPositions: GroupedPoolPosition[];
  candidates: HealthCandidate[];
  verdictsByPositionId: Record<string, PositionVerdict>;
  lpTransactions?: LpTransaction[];
  rawPortfolioValues?: number[];
};

const SLEEVE_ORDER: AllocationSleeveId[] = ['stablecoins', 'layer1', 'defi', 'lp'];

const SLEEVE_LABELS: Record<AllocationSleeveId, string> = {
  stablecoins: 'Stable',
  layer1: 'L1',
  defi: 'DeFi',
  lp: 'LP',
};

function severityWeight(action: CutAction): number {
  if (action === 'exit') return 3;
  if (action === 'reduce') return 2;
  if (action === 'take_profit') return 1.5;
  return 1;
}

function actionPenalty(action: CutAction): number {
  if (action === 'exit') return 18;
  if (action === 'reduce') return 10;
  if (action === 'take_profit') return 5;
  return 3;
}

function actionFromVerdict(verdict: VerdictType): CutAction | null {
  if (verdict === 'exit') return 'exit';
  if (verdict === 'reduce') return 'reduce';
  return null;
}

function gradeFromScore(score: number): HealthGrade {
  if (score >= 70) return 'healthy';
  if (score >= 45) return 'watch';
  return 'at_risk';
}

function tradeSymbolFromCandidate(candidate: HealthCandidate): string {
  const head = candidate.label.split(' · ')[0]?.trim() || candidate.label;
  if (candidate.positionKind === 'token') {
    const sym = head.split(' ')[0];
    return sym || head;
  }
  const pair = head.includes('/') ? head.split('/')[0]?.trim() : head;
  return (pair || head).slice(0, 12);
}

function whyFromCandidate(candidate: HealthCandidate, action: CutAction): string {
  const top = [...candidate.signals].sort((a, b) => {
    const rank = (s: string) => (s === 'high' ? 3 : s === 'medium' ? 2 : 1);
    return rank(b.severity) - rank(a.severity);
  })[0];

  if (action === 'take_profit') {
    const gain = candidate.pnl?.unrealizedPct;
    return gain != null
      ? `${gain.toFixed(0)}% unrealized · ${candidate.shareOfPortfolioPct.toFixed(0)}% of book`
      : `${candidate.shareOfPortfolioPct.toFixed(0)}% of book and still green — bank some.`;
  }

  if (top?.id === 'pnl_bleed') return 'PnL bleeding — cut before it compounds.';
  if (top?.id === 'apy_collapse') return 'APY collapsed — yield thesis broken.';
  if (top?.id === 'concentration') {
    return `${Math.round(Number(top.facts.sharePct ?? candidate.shareOfPortfolioPct))}% concentrated — trim size.`;
  }
  if (top?.id === 'tvl_decay') return 'Pool TVL thinned out — liquidity risk.';
  if (top?.id === 'alt_bag_risk') return 'Alt bag risk — size vs thesis mismatch.';
  return candidate.signals[0]
    ? `${candidate.signals[0].id.replace(/_/g, ' ')} flagged.`
    : 'Watch this bag.';
}

function hasRecentWithdraw(txs: LpTransaction[], poolLabel: string): boolean {
  const needle = poolLabel.toLowerCase();
  return txs.some(
    (tx) =>
      tx.operationType === 'withdraw' &&
      (tx.poolLabel.toLowerCase().includes(needle) ||
        needle.includes(tx.poolLabel.toLowerCase()) ||
        tx.title.toLowerCase().includes(needle)),
  );
}

function sleeveForToken(token: WalletToken): AllocationSleeveId {
  return categorizeToken(token);
}

function sleeveForCandidate(
  candidate: HealthCandidate,
  tokensById: Map<string, WalletToken>,
): AllocationSleeveId {
  if (candidate.positionKind === 'lp_pool') return 'lp';
  if (candidate.positionKind === 'personal_defi') return 'defi';
  const token = tokensById.get(candidate.id);
  if (token) return sleeveForToken(token);
  // Label fallback: "Name (SYM)"
  const symMatch = candidate.label.match(/\(([A-Z0-9]+)\)/);
  if (symMatch) {
    const fake: WalletToken = {
      id: candidate.id,
      fungibleId: null,
      chain: candidate.chain,
      name: candidate.label,
      symbol: symMatch[1],
      amount: 0,
      price: 0,
      valueUsd: candidate.valueUsd,
      logoUrl: null,
      isCore: false,
    };
    return sleeveForToken(fake);
  }
  return 'defi';
}

export function computeAllocationShares(
  walletTokens: WalletToken[],
  poolPositions: GroupedPoolPosition[],
): AllocationShares {
  const totals = categoryTotals(walletTokens);
  const lp = poolPositions.reduce((sum, p) => sum + p.valueUsd, 0);
  const tokenTotal = portfolioTotalUsd(walletTokens);
  const total = tokenTotal + lp;
  if (total <= 0) {
    return { stablecoins: 0, layer1: 0, defi: 0, lp: 0 };
  }
  return {
    stablecoins: (totals.stablecoins / total) * 100,
    layer1: (totals.layer1 / total) * 100,
    defi: (totals.defi / total) * 100,
    lp: (lp / total) * 100,
  };
}

function sleeveValues(
  walletTokens: WalletToken[],
  poolPositions: GroupedPoolPosition[],
): Record<AllocationSleeveId, number> {
  const totals = categoryTotals(walletTokens);
  return {
    stablecoins: totals.stablecoins,
    layer1: totals.layer1,
    defi: totals.defi,
    lp: poolPositions.reduce((s, p) => s + p.valueUsd, 0),
  };
}

function buildTakeProfitCuts(
  pools: GroupedPoolPosition[],
  totalUsd: number,
  lpTransactions: LpTransaction[],
  seenIds: Set<string>,
): CutQueueItem[] {
  const cuts: CutQueueItem[] = [];

  for (const pool of pools) {
    if (seenIds.has(pool.groupId)) continue;
    const sharePct = totalUsd > 0 ? (pool.valueUsd / totalUsd) * 100 : 0;
    const gain = pool.unrealizedPnlPercent;
    const greenProxy = pool.change24hPercent ?? null;
    const qualifiesGain =
      (gain != null && gain >= TAKE_PROFIT_GAIN_PCT) ||
      (gain == null && greenProxy != null && greenProxy >= 5 && sharePct >= TAKE_PROFIT_SHARE_PCT);

    if (sharePct < TAKE_PROFIT_SHARE_PCT || !qualifiesGain) continue;
    if (hasRecentWithdraw(lpTransactions, pool.pairLabel || pool.poolName)) continue;

    const action: CutAction = 'take_profit';
    cuts.push({
      id: pool.groupId,
      label: `${pool.protocol} · ${pool.pairLabel}`,
      valueUsd: pool.valueUsd,
      sharePct,
      action,
      why:
        gain != null
          ? `+${gain.toFixed(0)}% unrealized · ${sharePct.toFixed(0)}% of book — take some off.`
          : `Green and ${sharePct.toFixed(0)}% of book — bank a trim.`,
      tradeSymbol: (pool.pairLabel.split('/')[0] || pool.pairLabel).trim().slice(0, 12) || 'ETH',
      priority: pool.valueUsd * severityWeight(action),
      sleeve: 'lp',
    });
  }

  return cuts;
}

function softFillForSleeve(
  sleeve: AllocationSleeveId,
  tokens: WalletToken[],
  pools: GroupedPoolPosition[],
  totalUsd: number,
  seenIds: Set<string>,
  needed: number,
): CutQueueItem[] {
  if (needed <= 0) return [];

  const bags =
    sleeve === 'lp'
      ? pools.map((p) => ({
          id: p.groupId,
          label: `${p.protocol} · ${p.pairLabel}`,
          valueUsd: p.valueUsd,
          sharePct: totalUsd > 0 ? (p.valueUsd / totalUsd) * 100 : 0,
          tradeSymbol: (p.pairLabel.split('/')[0] || p.pairLabel).trim().slice(0, 12) || 'ETH',
        }))
      : tokens
          .filter((t) => categorizeToken(t) === (sleeve as TokenCategory))
          .map((t) => ({
            id: t.id,
            label: t.symbol,
            valueUsd: t.valueUsd,
            sharePct: totalUsd > 0 ? (t.valueUsd / totalUsd) * 100 : 0,
            tradeSymbol: t.symbol,
          }));

  return bags
    .filter((b) => !seenIds.has(b.id) && b.valueUsd > 0)
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .slice(0, needed)
    .map((bag) => {
      const action: CutAction = bag.sharePct >= 40 ? 'reduce' : 'watch';
      return {
        id: bag.id,
        label: bag.label,
        valueUsd: bag.valueUsd,
        sharePct: bag.sharePct,
        action,
        why:
          bag.sharePct >= 40
            ? `${bag.sharePct.toFixed(0)}% of book — size risk even without a hard signal.`
            : `Largest in ${SLEEVE_LABELS[sleeve]} · ${bag.sharePct.toFixed(0)}% — keep on radar.`,
        tradeSymbol: bag.tradeSymbol,
        priority: bag.valueUsd * severityWeight(action),
        sleeve,
      };
    });
}

function buildAllCuts(input: BuildCutQueueInput): CutQueueItem[] {
  const {
    walletTokens,
    poolPositions,
    candidates,
    verdictsByPositionId,
    lpTransactions = [],
  } = input;

  const tokenTotal = portfolioTotalUsd(walletTokens);
  const poolTotal = poolPositions.reduce((s, p) => s + p.valueUsd, 0);
  const totalUsd = tokenTotal + poolTotal;
  const tokensById = new Map(walletTokens.map((t) => [t.id, t]));

  const byId = new Map<string, CutQueueItem>();

  for (const candidate of candidates) {
    const verdict =
      verdictsByPositionId[candidate.id]?.verdict ?? inferVerdictFromSignals(candidate);
    const action = actionFromVerdict(verdict);
    if (!action) continue;

    let finalAction = action;
    if (
      candidate.signals.some(
        (s) =>
          s.severity === 'high' && (s.id === 'pnl_bleed' || s.id === 'apy_collapse'),
      )
    ) {
      finalAction = 'exit';
    }

    const sleeve = sleeveForCandidate(candidate, tokensById);
    byId.set(candidate.id, {
      id: candidate.id,
      label: candidate.label,
      valueUsd: candidate.valueUsd,
      sharePct: candidate.shareOfPortfolioPct,
      action: finalAction,
      why: whyFromCandidate(candidate, finalAction),
      tradeSymbol: tradeSymbolFromCandidate(candidate),
      priority: candidate.valueUsd * severityWeight(finalAction),
      sleeve,
    });
  }

  for (const cut of buildTakeProfitCuts(
    poolPositions,
    totalUsd,
    lpTransactions,
    new Set(byId.keys()),
  )) {
    if (!byId.has(cut.id)) byId.set(cut.id, cut);
  }

  return [...byId.values()];
}

function sleeveSummary(grade: HealthGrade, cuts: CutQueueItem[], sharePct: number): string {
  if (grade === 'healthy') {
    return `OK · ${sharePct.toFixed(0)}% of book`;
  }
  const top = cuts.find((c) => c.action === 'exit' || c.action === 'reduce') ?? cuts[0];
  if (top) {
    return top.action === 'take_profit'
      ? `Bank ${top.label.split(' · ')[0]}`
      : top.why;
  }
  return `${healthGradeLabel(grade)} · ${sharePct.toFixed(0)}%`;
}

function scoreSleeve(cuts: CutQueueItem[], sleeveValueUsd: number): number {
  let score = 88;
  const seen = new Set<string>();
  for (const cut of cuts) {
    if (seen.has(cut.id)) continue;
    seen.add(cut.id);
    score -= actionPenalty(cut.action);
  }
  if (sleeveValueUsd > 0 && cuts[0]) {
    const topShareOfSleeve = (cuts[0].valueUsd / sleeveValueUsd) * 100;
    if (topShareOfSleeve >= 70 && cuts[0].action !== 'watch') {
      score -= 8;
    }
  }
  return Math.max(5, Math.min(100, Math.round(score)));
}

export function buildHealthSleeves(input: BuildCutQueueInput): HealthSleeve[] {
  const { walletTokens, poolPositions } = input;
  const tokenTotal = portfolioTotalUsd(walletTokens);
  const poolTotal = poolPositions.reduce((s, p) => s + p.valueUsd, 0);
  const totalUsd = tokenTotal + poolTotal;
  const values = sleeveValues(walletTokens, poolPositions);
  const allCuts = buildAllCuts(input);

  const sleeves: HealthSleeve[] = [];

  for (const id of SLEEVE_ORDER) {
    const valueUsd = values[id];
    if (valueUsd <= 0) continue; // hide empty

    const sharePct = totalUsd > 0 ? (valueUsd / totalUsd) * 100 : 0;
    let cuts = allCuts
      .filter((c) => c.sleeve === id)
      .sort((a, b) => b.priority - a.priority);

    if (cuts.length < SLEEVE_CUT_SIZE) {
      const seen = new Set(cuts.map((c) => c.id));
      cuts = [
        ...cuts,
        ...softFillForSleeve(
          id,
          walletTokens,
          poolPositions,
          totalUsd,
          seen,
          SLEEVE_CUT_SIZE - cuts.length,
        ),
      ];
    }

    cuts = cuts.slice(0, SLEEVE_CUT_SIZE);
    const score = scoreSleeve(cuts, valueUsd);
    const grade = gradeFromScore(score);

    sleeves.push({
      id,
      label: SLEEVE_LABELS[id],
      sharePct,
      valueUsd,
      score,
      grade,
      summary: sleeveSummary(grade, cuts, sharePct),
      cuts,
      muted: grade === 'healthy',
    });
  }

  return sleeves;
}

export function buildHealthCockpit(input: BuildCutQueueInput): HealthCockpit {
  const { walletTokens, poolPositions } = input;
  const sleeves = buildHealthSleeves(input);
  const allocation = computeAllocationShares(walletTokens, poolPositions);

  let defaultExpandedId: AllocationSleeveId | null = null;
  if (sleeves.length > 0) {
    defaultExpandedId = [...sleeves].sort((a, b) => a.score - b.score)[0].id;
  }

  return {
    sleeves,
    defaultExpandedId,
    allocation,
  };
}

/** Flat top cuts across sleeves — useful for demos / alerts. */
export function buildCutQueue(input: BuildCutQueueInput): CutQueueItem[] {
  const sleeves = buildHealthSleeves(input);
  return sleeves
    .flatMap((s) => s.cuts)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, CUT_QUEUE_SIZE);
}
