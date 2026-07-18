import type { VerdictPromptInput } from '../types/positionHealth';

const REASONING_MAX_CHARS = 280;
const REASONING_MAX_SENTENCES = 3;

export const VERDICT_JSON_SCHEMA = {
  verdict: 'hold | reduce | exit',
  confidence: 'low | medium | high',
  headline: 'string (max 8 words)',
  reasoning: 'string (2–3 short sentences, ≤280 characters)',
} as const;

export const SYSTEM_PROMPT = `You are a personal DeFi portfolio health analyst for a single wallet owner.
You receive structured facts about one position that passed automated risk/opportunity rules.
Your job: output a single JSON object with a hold, reduce, or exit verdict and concise copy for a dashboard card.

Rules:
- Base verdict only on the provided facts. Do not invent prices, APYs, TVL, or protocol names.
- hold = no urgent action; reduce = trim exposure or monitor closely; exit = materially impaired or clearly better to leave.
- headline: max 8 words, specific to this position (no generic "Review your portfolio").
- reasoning: REQUIRED length limit — exactly 2 or 3 short sentences, total under 280 characters. Do not write more. Plain language; cite the strongest 1–2 signals only.
- Do not include an opportunity field.
- confidence: low if facts are sparse or join quality is weak; high if multiple high-severity signals align.
- Do not include URLs, tickers to buy, or execution instructions.
- Output valid JSON only, matching the schema exactly.`;

export function buildUserPrompt(input: VerdictPromptInput): string {
  return `Analyze this position and return one verdict JSON object.

Schema:
${JSON.stringify(VERDICT_JSON_SCHEMA, null, 2)}

Hard limits:
- reasoning must be 2–3 sentences and ≤280 characters
- do not include opportunity

Position facts:
${JSON.stringify(input, null, 2)}`;
}

export type RawVerdictResponse = {
  verdict: 'hold' | 'reduce' | 'exit';
  confidence: 'low' | 'medium' | 'high';
  headline: string;
  reasoning: string;
  opportunity?: string;
};

/** Clamp AI reasoning to at most 3 sentences / 280 characters for card UI. */
export function clampReasoning(reasoning: string): string {
  const sentences = reasoning
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, REASONING_MAX_SENTENCES);

  let text = sentences.join(' ').trim();
  if (text.length <= REASONING_MAX_CHARS) {
    return text;
  }

  text = text.slice(0, REASONING_MAX_CHARS).trim();
  const lastSpace = text.lastIndexOf(' ');
  if (lastSpace > 40) {
    text = text.slice(0, lastSpace).trim();
  }
  return text.endsWith('.') || text.endsWith('!') || text.endsWith('?') ? text : `${text}…`;
}

export function parseVerdictResponse(content: string): RawVerdictResponse | null {
  try {
    const parsed = JSON.parse(content) as RawVerdictResponse;
    if (
      !parsed.verdict ||
      !['hold', 'reduce', 'exit'].includes(parsed.verdict) ||
      !parsed.confidence ||
      !['low', 'medium', 'high'].includes(parsed.confidence) ||
      typeof parsed.headline !== 'string' ||
      typeof parsed.reasoning !== 'string'
    ) {
      return null;
    }
    return {
      ...parsed,
      reasoning: clampReasoning(parsed.reasoning),
    };
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return parseVerdictResponse(match[0]);
    } catch {
      return null;
    }
  }
}
