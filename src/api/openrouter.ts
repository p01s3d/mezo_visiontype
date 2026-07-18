import type { HealthCandidate, PositionVerdict, VerdictType, ConfidenceLevel } from '../types/positionHealth';
import type { PortfolioHealthScore } from '../utils/portfolioHealthScore';
import { clampReasoning } from '../prompts/positionVerdictPrompt';
import {
  PORTFOLIO_SYSTEM_PROMPT,
  buildPortfolioUserPrompt,
  parsePortfolioSynthesis,
  parseBentoInsights,
  parseInsightCards,
  type BentoInsights,
} from '../prompts/portfolioHealthPrompt';
import { resolveDexUrl } from '../utils/protocolLinks';
import {
  inferVerdictFromSignals,
  ruleOnlyHeadline,
  ruleOnlyReasoning,
} from '../utils/healthSignals';
import type { ArcScores } from '../utils/bentoHealthMetrics';
import type { CoachCopy } from '../utils/coachInsight';
import type { Protocol } from './defillama';
import { buildRuleCryptoInsight } from '../utils/trendingProtocols';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function getApiKey(): string | null {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  return key && key.trim().length > 0 ? key.trim() : null;
}

function getModel(): string {
  return import.meta.env.VITE_OPENROUTER_MODEL ?? 'google/gemma-4-26b-a4b-it';
}

function batchCacheKey(address: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `portfolio-synthesis:${address.toLowerCase()}:${date}`;
}

export type PortfolioSynthesis = {
  narrative: string;
  positionChips: PositionVerdict[];
  alertCopy?: Array<{ factorId: string; title: string; body: string }>;
  bento: BentoInsights;
  insightCards: Partial<CoachCopy> | null;
};

type CachedSynthesis = PortfolioSynthesis & { inputKey: string };

function readSynthesisCache(address: string): CachedSynthesis | null {
  try {
    const raw = sessionStorage.getItem(batchCacheKey(address));
    if (!raw) return null;
    return JSON.parse(raw) as CachedSynthesis;
  } catch {
    return null;
  }
}

function writeSynthesisCache(address: string, payload: CachedSynthesis): void {
  try {
    sessionStorage.setItem(batchCacheKey(address), JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function clearSynthesisCache(address: string): void {
  try {
    sessionStorage.removeItem(batchCacheKey(address));
  } catch {
    // ignore
  }
}

function attachLink(verdict: PositionVerdict, candidate: HealthCandidate): PositionVerdict {
  if (verdict.verdict === 'hold') return verdict;
  const link = resolveDexUrl({
    protocol: candidate.protocol,
    chain: candidate.chain,
    protocolSlug: undefined,
  });
  if (!link) return verdict;
  return { ...verdict, actionUrl: link.url, actionLabel: link.label };
}

export function buildRuleOnlyVerdict(candidate: HealthCandidate): PositionVerdict {
  const verdict: PositionVerdict = {
    candidateId: candidate.id,
    label: candidate.label,
    verdict: inferVerdictFromSignals(candidate),
    confidence: candidate.signals.some((s) => s.severity === 'high') ? 'medium' : 'low',
    headline: ruleOnlyHeadline(candidate),
    reasoning: clampReasoning(ruleOnlyReasoning(candidate)),
    opportunity: candidate.opportunity
      ? `Alternative: ${candidate.opportunity.altProtocol} at ~${candidate.opportunity.altApy?.toFixed(1)}% APY.`
      : undefined,
    ruleOnly: true,
  };
  return attachLink(verdict, candidate);
}

export function buildRuleOnlySynthesis(
  health: PortfolioHealthScore,
  candidates: HealthCandidate[],
  ruleArcs?: ArcScores,
  trendingProtocols: Protocol[] = [],
): PortfolioSynthesis {
  const chips = candidates.slice(0, 4).map(buildRuleOnlyVerdict);
  const vs = health.vsBtcPct ?? 0;
  const abs = Math.abs(vs);
  const deviationNarrative =
    vs < 0
      ? `Portfolio underperformed its benchmark by ${abs.toFixed(2)}% during this window.`
      : vs > 0
        ? `Portfolio outperformed its benchmark by ${abs.toFixed(2)}% over this window.`
        : 'Portfolio tracked its benchmark closely over this window.';
  const change = health.portfolioChangePct ?? 0;
  const dailyInsight =
    change > 0
      ? 'Your portfolio saw the strongest gains during mid-month sessions, offsetting early-month volatility.'
      : 'Daily moves were choppy this period — risk and concentration are dragging consistency.';
  const crypto = buildRuleCryptoInsight(trendingProtocols);

  return {
    narrative: health.ruleNarrative,
    positionChips: chips,
    alertCopy: health.factors
      .filter((f) => f.severity !== 'low')
      .slice(0, 3)
      .map((f) => ({ factorId: f.id, title: f.label, body: f.why })),
    bento: {
      risk: ruleArcs?.risk ?? 0.55,
      consistency: ruleArcs?.consistency ?? 0.5,
      diversification: ruleArcs?.diversification ?? 0.45,
      deviationNarrative,
      dailyInsight,
      dailyHighlight: change > 0 ? 'offsetting early-month volatility' : undefined,
      cryptoInsight: crypto.cryptoInsight,
      cryptoHighlight: crypto.cryptoHighlight,
    },
    insightCards: null,
  };
}

async function callOpenRouter(messages: Array<{ role: string; content: string }>): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
      'X-Title': 'defi-system',
    },
    body: JSON.stringify({
      model: getModel(),
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.35,
    }),
  });

  if (!response.ok) {
    console.error('[openrouter] request failed', response.status);
    return null;
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? null;
}

export async function fetchPortfolioSynthesis(params: {
  address: string;
  inputKey: string;
  health: PortfolioHealthScore;
  candidates: HealthCandidate[];
  ruleArcs?: ArcScores;
  trendingProtocols?: Protocol[];
  coachPriors?: unknown;
  force?: boolean;
}): Promise<PortfolioSynthesis> {
  const {
    address,
    inputKey,
    health,
    candidates,
    ruleArcs,
    trendingProtocols = [],
    coachPriors,
    force = false,
  } = params;
  const ruleFallback = buildRuleOnlySynthesis(health, candidates, ruleArcs, trendingProtocols);

  if (!force) {
    const cached = readSynthesisCache(address);
    if (cached && cached.inputKey === inputKey) {
      return {
        narrative: cached.narrative,
        positionChips: cached.positionChips,
        alertCopy: cached.alertCopy,
        bento: cached.bento ?? ruleFallback.bento,
        insightCards: cached.insightCards ?? null,
      };
    }
  }

  if (!hasOpenRouterKey()) {
    return ruleFallback;
  }

  const top = candidates.slice(0, 5);
  const trendingSlim = trendingProtocols.slice(0, 5).map((p) => ({
    name: p.name,
    change1d: p.change1d,
    tvl: p.tvl,
  }));
  const userPrompt = buildPortfolioUserPrompt({
    health,
    candidates: top,
    ruleArcs,
    trendingProtocols: trendingSlim,
    coachPriors,
  });
  const content = await callOpenRouter([
    { role: 'system', content: PORTFOLIO_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]);

  if (!content) return ruleFallback;

  let parsed = parsePortfolioSynthesis(content);
  if (!parsed) {
    const retry = await callOpenRouter([
      { role: 'system', content: PORTFOLIO_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${userPrompt}\n\nFix JSON to match schema exactly.`,
      },
    ]);
    parsed = retry ? parsePortfolioSynthesis(retry) : null;
  }

  if (!parsed) return ruleFallback;

  const byId = Object.fromEntries(top.map((c) => [c.id, c]));
  const chips: PositionVerdict[] = parsed.positionChips
    .map((chip) => {
      const candidate = byId[chip.candidateId];
      if (!candidate) return null;
      const verdict: PositionVerdict = {
        candidateId: chip.candidateId,
        label: candidate.label,
        verdict: chip.verdict as VerdictType,
        confidence: chip.confidence as ConfidenceLevel,
        headline: chip.headline,
        reasoning: clampReasoning(chip.reasoning),
      };
      return attachLink(verdict, candidate);
    })
    .filter((v): v is PositionVerdict => v !== null);

  const chipIds = new Set(chips.map((c) => c.candidateId));
  for (const candidate of top) {
    if (!chipIds.has(candidate.id)) {
      chips.push(buildRuleOnlyVerdict(candidate));
    }
  }

  const synthesis: PortfolioSynthesis = {
    narrative: parsed.narrative.trim() || health.ruleNarrative,
    positionChips: chips,
    alertCopy: parsed.alertCopy,
    bento: parseBentoInsights(parsed.bento, ruleFallback.bento),
    insightCards: parseInsightCards(parsed.insightCards),
  };

  writeSynthesisCache(address, { ...synthesis, inputKey });
  return synthesis;
}

/** @deprecated Prefer fetchPortfolioSynthesis — kept for any leftover imports. */
export async function fetchVerdictsForCandidates(
  candidates: HealthCandidate[],
): Promise<PositionVerdict[]> {
  return candidates.slice(0, 4).map(buildRuleOnlyVerdict);
}

export function hasOpenRouterKey(): boolean {
  return getApiKey() !== null;
}
