import type { GroupedPoolPosition, PersonalPosition, WalletToken } from '../api/walletTypes';
import type { HealthCandidate, PositionVerdict, VerdictType } from '../types/positionHealth';
import { computeAllocationShares } from './cutQueue';

export type OutlookStance = 'accumulate' | 'hold' | 'de_risk';

export type StanceMix = {
  add: number;
  hold: number;
  trim: number;
  exit: number;
};

export type CoachNextMove = {
  candidateId: string;
  label: string;
  verdict: VerdictType;
  headline: string;
  confidence: PositionVerdict['confidence'];
};

export type CoachCopy = {
  outlook: { stance: OutlookStance; detail: string };
  risk: { headline: string };
  stance: { attribution: string };
  yield: { headline: string };
  liquidity: { headline: string };
  concentration: { headline: string; ctaLabel: string };
  nextMoves: { items: Array<{ candidateId: string; headline: string }> };
};

export type CoachInsight = {
  /** Past series (rebased) for outlook chart */
  outlookPast: number[];
  /** Forward projection mid path */
  outlookForward: number[];
  /** Optional low/high band for forward path */
  outlookBandLow: number[];
  outlookBandHigh: number[];
  outlookStance: OutlookStance;
  periodReturnPct: number | null;
  volRatio: number | null;
  betaProxy: number | null;
  stanceMix: StanceMix;
  /** Value-weighted APY on DefiLlama-matched positions only (null if none matched). */
  matchedApy: number | null;
  /** Share of book in matched-yield positions (not “earning,” just matched). */
  matchedDeFiPct: number;
  /** Stablecoin sleeve % of book. */
  stablesPct: number;
  /** Non-stable share of book (100 − stables). */
  restPct: number;
  liquidPct: number;
  lockedPct: number;
  topTokenSymbol: string | null;
  topTokenSharePct: number;
  topProtocolName: string | null;
  topProtocolSharePct: number;
  nextMoves: CoachNextMove[];
  copy: CoachCopy;
};

export type CoachInsightInput = {
  walletTokens: WalletToken[];
  poolPositions: GroupedPoolPosition[];
  personalPositions?: PersonalPosition[];
  candidates: HealthCandidate[];
  verdictsByPositionId: Record<string, PositionVerdict>;
  portfolioSeries: number[];
  btcSeries?: number[] | null;
  portfolioChangePct?: number | null;
};

function seriesReturns(values: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    const next = values[i];
    if (!Number.isFinite(prev) || !Number.isFinite(next) || prev === 0) continue;
    out.push((next - prev) / prev);
  }
  return out;
}

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance = xs.reduce((a, x) => a + (x - mean) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

function covariance(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const aa = a.slice(0, n);
  const bb = b.slice(0, n);
  const meanA = aa.reduce((s, x) => s + x, 0) / n;
  const meanB = bb.reduce((s, x) => s + x, 0) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += (aa[i] - meanA) * (bb[i] - meanB);
  return sum / (n - 1);
}

function buildOutlookPaths(past: number[]): {
  past: number[];
  forward: number[];
  low: number[];
  high: number[];
} {
  if (past.length < 2) {
    return { past: [], forward: [], low: [], high: [] };
  }
  const rets = seriesReturns(past);
  const vol = stdev(rets) || 0.004;
  const drift =
    rets.length > 0 ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
  const last = past[past.length - 1];
  const steps = Math.max(6, Math.round(past.length * 0.35));
  const forward: number[] = [];
  const low: number[] = [];
  const high: number[] = [];
  let mid = last;
  for (let i = 1; i <= steps; i++) {
    mid *= 1 + drift;
    const band = last * vol * Math.sqrt(i) * 1.65;
    forward.push(mid);
    low.push(mid - band);
    high.push(mid + band);
  }
  return { past, forward, low, high };
}

function stanceFromMetrics(
  periodReturnPct: number | null,
  volRatio: number | null,
  stablesPct: number,
  topTokenSharePct: number,
): OutlookStance {
  if (
    (periodReturnPct != null && periodReturnPct < -4) ||
    (volRatio != null && volRatio > 1.6) ||
    topTokenSharePct >= 45
  ) {
    return 'de_risk';
  }
  if (
    stablesPct >= 25 ||
    (periodReturnPct != null && periodReturnPct > 2 && (volRatio == null || volRatio < 1.25))
  ) {
    return 'accumulate';
  }
  return 'hold';
}

function computeStanceMix(
  candidates: HealthCandidate[],
  verdictsByPositionId: Record<string, PositionVerdict>,
): StanceMix {
  const mix = { add: 0, hold: 0, trim: 0, exit: 0 };
  const total = candidates.reduce((s, c) => s + Math.max(0, c.valueUsd), 0);
  if (total <= 0) {
    return { add: 0, hold: 100, trim: 0, exit: 0 };
  }
  for (const c of candidates) {
    const share = (Math.max(0, c.valueUsd) / total) * 100;
    const v = verdictsByPositionId[c.id]?.verdict;
    if (c.opportunity && (v === 'hold' || !v)) {
      mix.add += share * 0.35;
      mix.hold += share * 0.65;
      continue;
    }
    if (v === 'exit') mix.exit += share;
    else if (v === 'reduce') mix.trim += share;
    else mix.hold += share;
  }
  const sum = mix.add + mix.hold + mix.trim + mix.exit || 1;
  return {
    add: Math.round((mix.add / sum) * 100),
    hold: Math.round((mix.hold / sum) * 100),
    trim: Math.round((mix.trim / sum) * 100),
    exit: Math.round((mix.exit / sum) * 100),
  };
}

function buildRuleCopy(model: Omit<CoachInsight, 'copy'>): CoachCopy {
  const stanceLabel =
    model.outlookStance === 'accumulate'
      ? 'Accumulate'
      : model.outlookStance === 'de_risk'
        ? 'De-risk'
        : 'Hold';
  const ret =
    model.periodReturnPct != null
      ? `${model.periodReturnPct >= 0 ? '+' : ''}${model.periodReturnPct.toFixed(1)}%`
      : 'flat';
  const apy =
    model.matchedApy != null ? `~${model.matchedApy.toFixed(1)}%` : 'no matched';
  const vol =
    model.volRatio != null
      ? `${model.volRatio.toFixed(1)}× BTC vol`
      : 'similar vol to BTC';

  return {
    outlook: {
      stance: model.outlookStance,
      detail: `${stanceLabel} bias after ${ret} this window; forward band from recent vol.`,
    },
    risk: {
      headline:
        model.volRatio != null && model.volRatio > 1.15
          ? `Book runs hotter than BTC — ${vol}.`
          : model.volRatio != null && model.volRatio < 0.85
            ? `Book is quieter than BTC — ${vol}.`
            : `Volatility tracks BTC closely — ${vol}.`,
    },
    stance: {
      attribution: `Book mix: ${model.stanceMix.hold}% hold, ${model.stanceMix.trim}% trim, ${model.stanceMix.exit}% exit, ${model.stanceMix.add}% add.`,
    },
    yield: {
      headline:
        model.matchedApy != null
          ? `Matched DeFi APY ${apy} on ${model.matchedDeFiPct.toFixed(0)}% of book; stables ${model.stablesPct.toFixed(0)}%.`
          : `No DefiLlama yield match yet; stables are ${model.stablesPct.toFixed(0)}% of book.`,
    },
    liquidity: {
      headline: `${model.liquidPct.toFixed(0)}% is liquid tokens; ${model.lockedPct.toFixed(0)}% needs unwind (LP / personal DeFi).`,
    },
    concentration: {
      headline: model.topTokenSymbol
        ? `${model.topTokenSymbol} is ${model.topTokenSharePct.toFixed(0)}% of the book${
            model.topProtocolName
              ? `; ${model.topProtocolName} is ${model.topProtocolSharePct.toFixed(0)}% of DeFi`
              : ''
          }.`
        : 'No single bag dominates right now.',
      ctaLabel: model.topTokenSymbol ? `Review ${model.topTokenSymbol}` : 'Review holdings',
    },
    nextMoves: {
      items: model.nextMoves.map((m) => ({
        candidateId: m.candidateId,
        headline: m.headline,
      })),
    },
  };
}

export function buildCoachInsight(input: CoachInsightInput): CoachInsight {
  const {
    walletTokens,
    poolPositions,
    personalPositions = [],
    candidates,
    verdictsByPositionId,
    portfolioSeries,
    btcSeries = null,
    portfolioChangePct = null,
  } = input;

  const tokenTotal = walletTokens.reduce((s, t) => s + Math.max(0, t.valueUsd), 0);
  const lpTotal = poolPositions.reduce((s, p) => s + Math.max(0, p.valueUsd), 0);
  const personalTotal = personalPositions.reduce((s, p) => s + Math.max(0, p.valueUsd), 0);
  const bookTotal = tokenTotal + lpTotal + personalTotal;

  const shares = computeAllocationShares(walletTokens, poolPositions);
  const stablesPct = bookTotal > 0 ? shares.stablecoins : 0;
  const restPct = Math.max(0, 100 - stablesPct);

  let matchedValue = 0;
  let apyWeight = 0;
  for (const c of candidates) {
    const apy = c.market?.apy;
    if (apy != null && Number.isFinite(apy) && c.valueUsd > 0) {
      matchedValue += c.valueUsd;
      apyWeight += c.valueUsd * apy;
    }
  }
  const matchedApy = matchedValue > 0 ? apyWeight / matchedValue : null;
  const matchedDeFiPct = bookTotal > 0 ? (matchedValue / bookTotal) * 100 : 0;

  const lockedPct =
    bookTotal > 0 ? ((lpTotal + personalTotal) / bookTotal) * 100 : 0;
  const liquidPct = Math.max(0, 100 - lockedPct);

  let topToken: WalletToken | null = null;
  for (const t of walletTokens) {
    if (!topToken || t.valueUsd > topToken.valueUsd) topToken = t;
  }
  const topTokenSharePct =
    bookTotal > 0 && topToken ? (topToken.valueUsd / bookTotal) * 100 : 0;

  const protocolValue = new Map<string, number>();
  for (const p of poolPositions) {
    protocolValue.set(p.protocol, (protocolValue.get(p.protocol) ?? 0) + p.valueUsd);
  }
  for (const p of personalPositions) {
    protocolValue.set(p.protocol, (protocolValue.get(p.protocol) ?? 0) + p.valueUsd);
  }
  let topProtocolName: string | null = null;
  let topProtocolUsd = 0;
  for (const [name, usd] of protocolValue) {
    if (usd > topProtocolUsd) {
      topProtocolName = name;
      topProtocolUsd = usd;
    }
  }
  const defiBase = lpTotal + personalTotal;
  const topProtocolSharePct = defiBase > 0 ? (topProtocolUsd / defiBase) * 100 : 0;

  const portRets = seriesReturns(portfolioSeries);
  const btcRets = btcSeries && btcSeries.length > 1 ? seriesReturns(btcSeries) : [];
  const portVol = stdev(portRets);
  const btcVol = stdev(btcRets);
  const volRatio = btcVol > 0 ? portVol / btcVol : portVol > 0 ? 1 : null;
  const btcVar = btcVol * btcVol;
  const betaProxy =
    btcVar > 0 && portRets.length > 1 && btcRets.length > 1
      ? covariance(portRets, btcRets) / btcVar
      : null;

  const paths = buildOutlookPaths(portfolioSeries);
  const periodReturnPct =
    portfolioChangePct != null && Number.isFinite(portfolioChangePct)
      ? portfolioChangePct
      : portfolioSeries.length >= 2
        ? ((portfolioSeries[portfolioSeries.length - 1] - portfolioSeries[0]) /
            portfolioSeries[0]) *
          100
        : null;

  const stanceMix = computeStanceMix(candidates, verdictsByPositionId);
  const outlookStance = stanceFromMetrics(
    periodReturnPct,
    volRatio,
    stablesPct,
    topTokenSharePct,
  );

  const ranked = [...candidates]
    .map((c) => {
      const v = verdictsByPositionId[c.id] ?? null;
      const severityBoost = c.signals.some((s) => s.severity === 'high')
        ? 3
        : c.signals.some((s) => s.severity === 'medium')
          ? 2
          : 1;
      const verdictBoost =
        v?.verdict === 'exit' ? 3 : v?.verdict === 'reduce' ? 2 : v?.opportunity ? 1.5 : 0.5;
      return { c, v, score: c.valueUsd * severityBoost * verdictBoost };
    })
    .filter((row) => row.v && row.v.verdict !== 'hold')
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const nextMoves: CoachNextMove[] = ranked.map(({ c, v }) => ({
    candidateId: c.id,
    label: c.label,
    verdict: v!.verdict,
    headline: v!.headline,
    confidence: v!.confidence,
  }));

  // If nothing flagged, surface top opportunity holds as soft adds
  if (nextMoves.length === 0) {
    const opps = candidates
      .filter((c) => c.opportunity)
      .sort((a, b) => b.valueUsd - a.valueUsd)
      .slice(0, 2);
    for (const c of opps) {
      const v = verdictsByPositionId[c.id];
      nextMoves.push({
        candidateId: c.id,
        label: c.label,
        verdict: v?.verdict ?? 'hold',
        headline: v?.headline ?? `Review yield on ${c.label}`,
        confidence: v?.confidence ?? 'low',
      });
    }
  }

  const partial: Omit<CoachInsight, 'copy'> = {
    outlookPast: paths.past,
    outlookForward: paths.forward,
    outlookBandLow: paths.low,
    outlookBandHigh: paths.high,
    outlookStance,
    periodReturnPct,
    volRatio,
    betaProxy,
    stanceMix,
    matchedApy,
    matchedDeFiPct,
    stablesPct,
    restPct,
    liquidPct,
    lockedPct,
    topTokenSymbol: topToken?.symbol ?? null,
    topTokenSharePct,
    topProtocolName,
    topProtocolSharePct,
    nextMoves,
  };

  return { ...partial, copy: buildRuleCopy(partial) };
}

export function mergeCoachCopy(
  model: CoachInsight,
  ai: Partial<CoachCopy> | null | undefined,
): CoachInsight {
  if (!ai) return model;
  const validIds = new Set(model.nextMoves.map((m) => m.candidateId));
  const stance =
    ai.outlook?.stance === 'accumulate' ||
    ai.outlook?.stance === 'hold' ||
    ai.outlook?.stance === 'de_risk'
      ? ai.outlook.stance
      : model.copy.outlook.stance;

  const nextItems =
    Array.isArray(ai.nextMoves?.items) && ai.nextMoves.items.length > 0
      ? ai.nextMoves.items
          .filter(
            (i) =>
              i &&
              typeof i.candidateId === 'string' &&
              validIds.has(i.candidateId) &&
              typeof i.headline === 'string' &&
              i.headline.trim(),
          )
          .slice(0, 3)
          .map((i) => ({
            candidateId: i.candidateId,
            headline: i.headline.trim().slice(0, 72),
          }))
      : model.copy.nextMoves.items;

  const nextMoves = model.nextMoves.map((m) => {
    const overlay = nextItems.find((i) => i.candidateId === m.candidateId);
    return overlay ? { ...m, headline: overlay.headline } : m;
  });

  const copy: CoachCopy = {
    outlook: {
      stance,
      detail:
        typeof ai.outlook?.detail === 'string' && ai.outlook.detail.trim()
          ? ai.outlook.detail.trim().slice(0, 160)
          : model.copy.outlook.detail,
    },
    risk: {
      headline:
        typeof ai.risk?.headline === 'string' && ai.risk.headline.trim()
          ? ai.risk.headline.trim().slice(0, 160)
          : model.copy.risk.headline,
    },
    stance: {
      attribution:
        typeof ai.stance?.attribution === 'string' && ai.stance.attribution.trim()
          ? ai.stance.attribution.trim().slice(0, 180)
          : model.copy.stance.attribution,
    },
    yield: {
      headline:
        typeof ai.yield?.headline === 'string' && ai.yield.headline.trim()
          ? ai.yield.headline.trim().slice(0, 160)
          : model.copy.yield.headline,
    },
    liquidity: {
      headline:
        typeof ai.liquidity?.headline === 'string' && ai.liquidity.headline.trim()
          ? ai.liquidity.headline.trim().slice(0, 160)
          : model.copy.liquidity.headline,
    },
    concentration: {
      headline:
        typeof ai.concentration?.headline === 'string' && ai.concentration.headline.trim()
          ? ai.concentration.headline.trim().slice(0, 160)
          : model.copy.concentration.headline,
      ctaLabel:
        typeof ai.concentration?.ctaLabel === 'string' && ai.concentration.ctaLabel.trim()
          ? ai.concentration.ctaLabel.trim().slice(0, 40)
          : model.copy.concentration.ctaLabel,
    },
    nextMoves: { items: nextItems },
  };

  return {
    ...model,
    outlookStance: stance,
    nextMoves,
    copy,
  };
}

/** Compact priors for the OpenRouter user prompt. */
export function coachPriorsForPrompt(model: CoachInsight) {
  return {
    outlookStancePrior: model.outlookStance,
    periodReturnPct: model.periodReturnPct,
    volRatio: model.volRatio,
    betaProxy: model.betaProxy,
    stanceMix: model.stanceMix,
    matchedApy: model.matchedApy,
    matchedDeFiPct: model.matchedDeFiPct,
    stablesPct: model.stablesPct,
    restPct: model.restPct,
    liquidPct: model.liquidPct,
    lockedPct: model.lockedPct,
    topTokenSymbol: model.topTokenSymbol,
    topTokenSharePct: model.topTokenSharePct,
    topProtocolName: model.topProtocolName,
    topProtocolSharePct: model.topProtocolSharePct,
    nextMoveIds: model.nextMoves.map((m) => m.candidateId),
    ruleCopy: model.copy,
  };
}

export function demoCoachInsight(): CoachInsight {
  const past = Array.from({ length: 24 }, (_, i) => 100 + i * 0.35 + Math.sin(i / 3) * 2);
  return buildCoachInsight({
    walletTokens: [
      {
        id: 'demo-eth',
        fungibleId: null,
        name: 'Ethereum',
        symbol: 'ETH',
        chain: 'ethereum',
        amount: 1,
        price: 3500,
        valueUsd: 8200,
        change24hPercent: 1.2,
        logoUrl: null,
        isCore: true,
      },
      {
        id: 'demo-usdc',
        fungibleId: null,
        name: 'USD Coin',
        symbol: 'USDC',
        chain: 'ethereum',
        amount: 3200,
        price: 1,
        valueUsd: 3200,
        change24hPercent: 0,
        logoUrl: null,
        isCore: true,
      },
    ],
    poolPositions: [
      {
        groupId: 'demo-lp',
        protocol: 'Uniswap V3',
        protocolIconUrl: null,
        chain: 'ethereum',
        poolName: 'ETH/USDC',
        pairLabel: 'ETH/USDC',
        valueUsd: 2400,
        change24hUsd: -20,
        change24hPercent: -0.8,
        unrealizedPnlUsd: 80,
        unrealizedPnlPercent: 3.4,
        legs: [],
      },
    ],
    candidates: [
      {
        id: 'demo-eth',
        positionKind: 'token',
        label: 'ETH',
        protocol: 'wallet',
        chain: 'ethereum',
        valueUsd: 8200,
        shareOfPortfolioPct: 59,
        score: 70,
        signals: [{ id: 'concentration', severity: 'medium', facts: { sharePct: 59 } }],
      },
      {
        id: 'demo-lp',
        positionKind: 'lp_pool',
        label: 'ETH/USDC LP',
        protocol: 'Uniswap V3',
        chain: 'ethereum',
        valueUsd: 2400,
        shareOfPortfolioPct: 17,
        score: 55,
        signals: [{ id: 'opportunity', severity: 'low', facts: {} }],
        market: { apy: 12.4, apyChange1dPct: -2, tvlUsd: 1e8 },
        opportunity: {
          altProtocol: 'Aerodrome',
          altApy: 18.2,
          altSymbol: 'ETH/USDC',
          apyDeltaPct: 5.8,
        },
      },
    ],
    verdictsByPositionId: {
      'demo-eth': {
        candidateId: 'demo-eth',
        label: 'ETH',
        verdict: 'reduce',
        confidence: 'medium',
        headline: 'Trim ETH concentration',
        reasoning: 'ETH is a large share of net worth.',
      },
      'demo-lp': {
        candidateId: 'demo-lp',
        label: 'ETH/USDC LP',
        verdict: 'hold',
        confidence: 'low',
        headline: 'Hold LP; check alt APY',
        reasoning: 'Yield is fine; Aerodrome pays more nearby.',
      },
    },
    portfolioSeries: past,
    btcSeries: past.map((v, i) => v * 0.92 + i * 0.1),
    portfolioChangePct: 3.2,
  });
}