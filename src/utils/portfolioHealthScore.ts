import type { HealthCandidate, SignalSeverity } from '../types/positionHealth';
import { categorizeToken, categoryTotals, portfolioTotalUsd } from './tokenCategories';
import { drawdownPct } from './chartSeries';
import type { GroupedPoolPosition, PersonalPosition, WalletToken } from '../api/walletTypes';

export type HealthGrade = 'healthy' | 'watch' | 'at_risk';

export type HealthFactor = {
  id: string;
  label: string;
  severity: SignalSeverity;
  why: string;
};

export type PortfolioHealthScore = {
  score: number;
  grade: HealthGrade;
  factors: HealthFactor[];
  ruleNarrative: string;
  vsBtcPct: number | null;
  portfolioChangePct: number | null;
  drawdownPct: number | null;
};

export type PortfolioHealthInputs = {
  walletTokens: WalletToken[];
  poolPositions: GroupedPoolPosition[];
  personalPositions: PersonalPosition[];
  candidates: HealthCandidate[];
  vsBtcPct: number | null;
  portfolioChangePct: number | null;
  rawPortfolioValues: number[];
};

const VS_BTC_LAG_THRESHOLD = -8;
const DRAWDOWN_THRESHOLD = -12;
const CONCENTRATION_SHARE = 55;
const DEFI_HEAVY_SHARE = 25;

function gradeFromScore(score: number): HealthGrade {
  if (score >= 70) return 'healthy';
  if (score >= 45) return 'watch';
  return 'at_risk';
}

function severityPenalty(severity: SignalSeverity): number {
  return severity === 'high' ? 18 : severity === 'medium' ? 10 : 5;
}

export function computePortfolioHealthScore(inputs: PortfolioHealthInputs): PortfolioHealthScore {
  const {
    walletTokens,
    poolPositions,
    personalPositions,
    candidates,
    vsBtcPct,
    portfolioChangePct,
    rawPortfolioValues,
  } = inputs;

  const tokenTotal = portfolioTotalUsd(walletTokens);
  const poolTotal = poolPositions.reduce((s, p) => s + p.valueUsd, 0);
  const personalTotal = personalPositions.reduce((s, p) => s + p.valueUsd, 0);
  const totalUsd = tokenTotal + poolTotal + personalTotal;
  const totals = categoryTotals(walletTokens);
  const defiSharePct = totalUsd > 0 ? ((totals.defi + poolTotal) / totalUsd) * 100 : 0;

  const factors: HealthFactor[] = [];
  let score = 88;

  const dd = rawPortfolioValues.length >= 2 ? drawdownPct(rawPortfolioValues) : null;
  if (dd !== null && dd <= DRAWDOWN_THRESHOLD) {
    const severity: SignalSeverity = dd <= DRAWDOWN_THRESHOLD * 1.5 ? 'high' : 'medium';
    factors.push({
      id: 'drawdown',
      label: 'Portfolio drawdown',
      severity,
      why: `Peak-to-trough dipped ${dd.toFixed(1)}% over the chart window.`,
    });
    score -= severityPenalty(severity);
  }

  if (vsBtcPct !== null && vsBtcPct <= VS_BTC_LAG_THRESHOLD) {
    const severity: SignalSeverity = vsBtcPct <= VS_BTC_LAG_THRESHOLD * 1.5 ? 'high' : 'medium';
    factors.push({
      id: 'vs_btc_lag',
      label: 'Lagging Bitcoin',
      severity,
      why: `You're ${Math.abs(vsBtcPct).toFixed(1)}pp behind holding BTC over this window.`,
    });
    score -= severityPenalty(severity);
  } else if (vsBtcPct !== null && vsBtcPct >= 5) {
    factors.push({
      id: 'vs_btc_lead',
      label: 'Beating Bitcoin',
      severity: 'low',
      why: `Outperforming BTC by ${vsBtcPct.toFixed(1)}pp — keep an eye on concentration.`,
    });
  }

  const topToken = [...walletTokens].sort((a, b) => b.valueUsd - a.valueUsd)[0];
  if (topToken && totalUsd > 0) {
    const share = (topToken.valueUsd / totalUsd) * 100;
    if (share >= CONCENTRATION_SHARE) {
      const severity: SignalSeverity = share >= 70 ? 'high' : 'medium';
      factors.push({
        id: 'concentration',
        label: `${topToken.symbol} concentration`,
        severity,
        why: `${topToken.symbol} is ${share.toFixed(0)}% of net worth.`,
      });
      score -= severityPenalty(severity);
    }
  }

  if (defiSharePct >= DEFI_HEAVY_SHARE) {
    const severity: SignalSeverity = defiSharePct >= 50 ? 'medium' : 'low';
    factors.push({
      id: 'defi_heavy',
      label: 'DeFi-heavy book',
      severity,
      why: `DeFi + LP is ~${defiSharePct.toFixed(0)}% of the portfolio.`,
    });
    score -= severityPenalty(severity);
  }

  const seenSignalKeys = new Set(factors.map((f) => f.id));
  for (const candidate of candidates.slice(0, 6)) {
    for (const signal of candidate.signals) {
      if (signal.id === 'concentration' || signal.id === 'defi_heavy') continue;
      const key = `${signal.id}:${candidate.id}`;
      if (seenSignalKeys.has(signal.id) && factors.length >= 6) continue;
      if (seenSignalKeys.has(key)) continue;
      seenSignalKeys.add(key);

      const label =
        signal.id === 'apy_collapse'
          ? 'APY collapse'
          : signal.id === 'pnl_bleed'
            ? 'PnL bleeding'
            : signal.id === 'tvl_decay'
              ? 'Thin TVL'
              : signal.id === 'opportunity'
                ? 'Yield opportunity'
                : signal.id === 'alt_bag_risk'
                  ? 'Alt bag risk'
                  : signal.id;

      factors.push({
        id: key,
        label: `${label} · ${candidate.label.split(' · ')[0]}`,
        severity: signal.severity,
        why: `${candidate.label} triggered ${signal.id.replace(/_/g, ' ')}.`,
      });
      score -= severityPenalty(signal.severity);
    }
  }

  score = Math.max(5, Math.min(100, Math.round(score)));
  const grade = gradeFromScore(score);

  const topFactor = factors.find((f) => f.severity === 'high') ?? factors[0];
  const ruleNarrative =
    grade === 'healthy'
      ? topFactor
        ? `Looking solid — watch ${topFactor.label.toLowerCase()}.`
        : 'Portfolio looks healthy. No urgent fires.'
      : grade === 'watch'
        ? topFactor
          ? `Worth a look: ${topFactor.why}`
          : 'A few yellow flags — review factors below.'
        : topFactor
          ? `At risk: ${topFactor.why}`
          : 'Multiple stress signals — trim risk before next week.';

  // Prefer high/medium factors first for UI
  factors.sort((a, b) => severityPenalty(b.severity) - severityPenalty(a.severity));

  return {
    score,
    grade,
    factors: factors.slice(0, 6),
    ruleNarrative,
    vsBtcPct,
    portfolioChangePct,
    drawdownPct: dd,
  };
}

export function healthGradeLabel(grade: HealthGrade): string {
  if (grade === 'healthy') return 'Healthy';
  if (grade === 'watch') return 'Watch';
  return 'At risk';
}

/** Map token category helper kept for potential callers. */
export function topCategoryShare(tokens: WalletToken[]): { category: string; pct: number } | null {
  const totals = categoryTotals(tokens);
  const total = portfolioTotalUsd(tokens);
  if (total <= 0) return null;
  const entries = (Object.entries(totals) as Array<[keyof typeof totals, number]>).sort(
    (a, b) => b[1] - a[1],
  );
  const [category, value] = entries[0];
  return { category, pct: (value / total) * 100 };
}

export function categorizeForHealth(token: WalletToken) {
  return categorizeToken(token);
}
