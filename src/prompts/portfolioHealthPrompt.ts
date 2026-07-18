import type { HealthCandidate } from '../types/positionHealth';
import type { PortfolioHealthScore } from '../utils/portfolioHealthScore';
import type { CoachCopy, OutlookStance } from '../utils/coachInsight';
import { clampReasoning } from './positionVerdictPrompt';
import type { ArcScores } from '../utils/bentoHealthMetrics';

export type BentoInsights = {
  risk: number;
  consistency: number;
  diversification: number;
  deviationNarrative: string;
  dailyInsight: string;
  dailyHighlight?: string;
  cryptoInsight: string;
  cryptoHighlight?: string;
};

export type InsightCardsCopy = CoachCopy;

export const PORTFOLIO_JSON_SCHEMA = {
  narrative: 'string (1–2 punchy sentences, ≤180 chars)',
  bento: {
    risk: 'number 0–1 (higher = more risk)',
    consistency: 'number 0–1 (higher = smoother returns)',
    diversification: 'number 0–1 (higher = more diversified)',
    deviationNarrative:
      'string (1 sentence on vs-benchmark performance; mention underperformed/outperformed and approximate %)',
    dailyInsight: 'string (1 sentence on daily/monthly performance pattern)',
    dailyHighlight: 'string optional short phrase to bold inside dailyInsight',
    cryptoInsight:
      'string (1 sentence on trending DeFi protocols from provided DefiLlama movers; name real protocols only)',
    cryptoHighlight: 'string optional short phrase to bold inside cryptoInsight',
  },
  insightCards: {
    outlook: {
      stance: 'accumulate | hold | de_risk',
      detail: 'string (one short forward-looking line; use provided APY/% priors only)',
    },
    risk: { headline: 'string (volatility vs BTC — not return outperformance)' },
    stance: { attribution: 'string (book Hold/Trim/Exit/Add mix attribution)' },
    yield: {
      headline:
        'string (matched DefiLlama APY + stables share; use matchedApy, matchedDeFiPct, stablesPct — do not claim unmatched bags are earning)',
    },
    liquidity: { headline: 'string (liquid vs locked unwind)' },
    concentration: {
      headline: 'string (top bag / protocol trim story)',
      ctaLabel: 'string (max 6 words)',
    },
    nextMoves: {
      items: [{ candidateId: 'string (must match nextMoveIds)', headline: 'string (max 8 words)' }],
    },
  },
  positionChips: [
    {
      candidateId: 'string (must match an input candidate id)',
      verdict: 'hold | reduce | exit',
      confidence: 'low | medium | high',
      headline: 'string (max 8 words)',
      reasoning: 'string (1–2 sentences, ≤160 chars)',
    },
  ],
  alertCopy: [
    {
      factorId: 'string (must match a factor id)',
      title: 'string (max 6 words)',
      body: 'string (one sentence)',
    },
  ],
} as const;

export const PORTFOLIO_SYSTEM_PROMPT = `You are an experimental personal DeFi health coach for one wallet.
You receive a deterministic portfolio health score, factors (including vs-BTC), chart-derived arc hints, trending DefiLlama protocols, coach metric priors, and top risk/opportunity candidates.
Output ONE JSON object: narrative, bento insights, insightCards (coach copy), chips for up to 4 positions, and optional alert copy.

Rules:
- Base everything only on provided facts. Do not invent APYs, prices, TVL, or protocol names.
- Tone: sharp, experimental — not corporate. No emojis.
- narrative: 1–2 sentences, ≤180 characters.
- bento.risk / consistency / diversification: floats 0–1. Use the provided ruleHints as a prior; adjust mildly (±0.15) if factors justify it.
- bento.deviationNarrative: one sentence about portfolio vs BTC benchmark using vsBtcPct.
- bento.dailyInsight: one sentence about the period return / daily pattern using portfolioChangePct and drawdown.
- bento.dailyHighlight: optional short substring of dailyInsight to emphasize.
- bento.cryptoInsight: one sentence about DefiLlama trending movers (use only names/% from trendingProtocols).
- bento.cryptoHighlight: optional short substring of cryptoInsight to emphasize.
- insightCards: action-oriented coach copy. Do NOT restate deviationNarrative, dailyInsight, or arc labels.
  - outlook.stance: prefer coachPriors.outlookStancePrior unless facts clearly disagree.
  - risk.headline: volatility/beta only (not return gap vs BTC).
  - nextMoves.items: only candidateIds from coachPriors.nextMoveIds (max 3).
- positionChips: only for given candidateIds.
- Output valid JSON only.`;

export function buildPortfolioUserPrompt(input: {
  health: PortfolioHealthScore;
  candidates: HealthCandidate[];
  ruleArcs?: ArcScores;
  trendingProtocols?: Array<{ name: string; change1d: number | null; tvl: number }>;
  coachPriors?: unknown;
}): string {
  const slimCandidates = input.candidates.map((c) => ({
    id: c.id,
    label: c.label,
    positionKind: c.positionKind,
    protocol: c.protocol,
    chain: c.chain,
    valueUsd: c.valueUsd,
    shareOfPortfolioPct: c.shareOfPortfolioPct,
    signals: c.signals,
    market: c.market,
    pnl: c.pnl,
    opportunity: c.opportunity,
  }));

  return `Synthesize portfolio health JSON including bento insights and coach insightCards.

Schema:
${JSON.stringify(PORTFOLIO_JSON_SCHEMA, null, 2)}

Health score:
${JSON.stringify(
  {
    score: input.health.score,
    grade: input.health.grade,
    vsBtcPct: input.health.vsBtcPct,
    portfolioChangePct: input.health.portfolioChangePct,
    drawdownPct: input.health.drawdownPct,
    factors: input.health.factors,
    ruleNarrative: input.health.ruleNarrative,
  },
  null,
  2,
)}

Rule arc hints (0–1 prior):
${JSON.stringify(input.ruleArcs ?? null, null, 2)}

Coach metric priors (numbers are source of truth; write copy only):
${JSON.stringify(input.coachPriors ?? null, null, 2)}

Trending DefiLlama protocols (1d TVL change):
${JSON.stringify(input.trendingProtocols ?? [], null, 2)}

Candidates:
${JSON.stringify(slimCandidates, null, 2)}`;
}

export type RawPortfolioSynthesis = {
  narrative: string;
  bento?: {
    risk?: number;
    consistency?: number;
    diversification?: number;
    deviationNarrative?: string;
    dailyInsight?: string;
    dailyHighlight?: string;
    cryptoInsight?: string;
    cryptoHighlight?: string;
  };
  insightCards?: Partial<CoachCopy>;
  positionChips: Array<{
    candidateId: string;
    verdict: 'hold' | 'reduce' | 'exit';
    confidence: 'low' | 'medium' | 'high';
    headline: string;
    reasoning: string;
  }>;
  alertCopy?: Array<{ factorId: string; title: string; body: string }>;
};

function parseStance(raw: unknown): OutlookStance | undefined {
  if (raw === 'accumulate' || raw === 'hold' || raw === 'de_risk') return raw;
  return undefined;
}

export function parseInsightCards(
  raw: RawPortfolioSynthesis['insightCards'] | undefined,
): Partial<CoachCopy> | null {
  if (!raw || typeof raw !== 'object') return null;
  const out: Partial<CoachCopy> = {};
  if (raw.outlook && typeof raw.outlook === 'object') {
    const stance = parseStance(raw.outlook.stance);
    out.outlook = {
      stance: stance ?? 'hold',
      detail: typeof raw.outlook.detail === 'string' ? raw.outlook.detail : '',
    };
  }
  if (raw.risk && typeof raw.risk.headline === 'string') {
    out.risk = { headline: raw.risk.headline };
  }
  if (raw.stance && typeof raw.stance.attribution === 'string') {
    out.stance = { attribution: raw.stance.attribution };
  }
  if (raw.yield && typeof raw.yield.headline === 'string') {
    out.yield = { headline: raw.yield.headline };
  }
  if (raw.liquidity && typeof raw.liquidity.headline === 'string') {
    out.liquidity = { headline: raw.liquidity.headline };
  }
  if (raw.concentration && typeof raw.concentration === 'object') {
    out.concentration = {
      headline:
        typeof raw.concentration.headline === 'string' ? raw.concentration.headline : '',
      ctaLabel:
        typeof raw.concentration.ctaLabel === 'string' ? raw.concentration.ctaLabel : '',
    };
  }
  if (raw.nextMoves && Array.isArray(raw.nextMoves.items)) {
    out.nextMoves = {
      items: raw.nextMoves.items
        .filter(
          (i): i is { candidateId: string; headline: string } =>
            !!i && typeof i.candidateId === 'string' && typeof i.headline === 'string',
        )
        .slice(0, 3),
    };
  }
  return out;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

export function parseBentoInsights(
  raw: RawPortfolioSynthesis['bento'] | undefined,
  fallback: BentoInsights,
): BentoInsights {
  if (!raw) return fallback;
  return {
    risk: typeof raw.risk === 'number' ? clamp01(raw.risk) : fallback.risk,
    consistency:
      typeof raw.consistency === 'number' ? clamp01(raw.consistency) : fallback.consistency,
    diversification:
      typeof raw.diversification === 'number'
        ? clamp01(raw.diversification)
        : fallback.diversification,
    deviationNarrative:
      typeof raw.deviationNarrative === 'string' && raw.deviationNarrative.trim()
        ? raw.deviationNarrative.trim().slice(0, 220)
        : fallback.deviationNarrative,
    dailyInsight:
      typeof raw.dailyInsight === 'string' && raw.dailyInsight.trim()
        ? raw.dailyInsight.trim().slice(0, 220)
        : fallback.dailyInsight,
    dailyHighlight:
      typeof raw.dailyHighlight === 'string' && raw.dailyHighlight.trim()
        ? raw.dailyHighlight.trim().slice(0, 80)
        : fallback.dailyHighlight,
    cryptoInsight:
      typeof raw.cryptoInsight === 'string' && raw.cryptoInsight.trim()
        ? raw.cryptoInsight.trim().slice(0, 220)
        : fallback.cryptoInsight,
    cryptoHighlight:
      typeof raw.cryptoHighlight === 'string' && raw.cryptoHighlight.trim()
        ? raw.cryptoHighlight.trim().slice(0, 80)
        : fallback.cryptoHighlight,
  };
}

export function parsePortfolioSynthesis(content: string): RawPortfolioSynthesis | null {
  const tryParse = (raw: string): RawPortfolioSynthesis | null => {
    try {
      const parsed = JSON.parse(raw) as RawPortfolioSynthesis;
      if (typeof parsed.narrative !== 'string' || !Array.isArray(parsed.positionChips)) {
        return null;
      }
      const chips = parsed.positionChips.filter(
        (chip) =>
          chip &&
          typeof chip.candidateId === 'string' &&
          ['hold', 'reduce', 'exit'].includes(chip.verdict) &&
          ['low', 'medium', 'high'].includes(chip.confidence) &&
          typeof chip.headline === 'string' &&
          typeof chip.reasoning === 'string',
      );
      return {
        narrative: parsed.narrative.slice(0, 200),
        bento: parsed.bento,
        insightCards: parsed.insightCards,
        positionChips: chips.slice(0, 4).map((chip) => ({
          ...chip,
          reasoning: clampReasoning(chip.reasoning),
        })),
        alertCopy: Array.isArray(parsed.alertCopy)
          ? parsed.alertCopy
              .filter(
                (a) =>
                  a &&
                  typeof a.factorId === 'string' &&
                  typeof a.title === 'string' &&
                  typeof a.body === 'string',
              )
              .slice(0, 3)
          : undefined,
      };
    } catch {
      return null;
    }
  };

  const direct = tryParse(content);
  if (direct) return direct;
  const match = content.match(/\{[\s\S]*\}/);
  return match ? tryParse(match[0]) : null;
}
