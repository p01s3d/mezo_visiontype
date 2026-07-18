import type { YieldPool } from '../api/defillama';

export type VerdictType = 'hold' | 'reduce' | 'exit';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type SignalSeverity = 'low' | 'medium' | 'high';
export type PositionKind = 'lp_pool' | 'personal_defi' | 'token';

export type MatchedMarket = {
  yieldPool: YieldPool | null;
  matchQuality: 'pool' | 'fuzzy' | 'protocol';
  protocolSlug?: string;
  protocolTvlUsd?: number;
};

export type HealthSignal = {
  id: string;
  severity: SignalSeverity;
  facts: Record<string, number | string | boolean | null>;
};

export type HealthCandidate = {
  id: string;
  positionKind: PositionKind;
  label: string;
  protocol: string;
  chain: string;
  valueUsd: number;
  shareOfPortfolioPct: number;
  score: number;
  signals: HealthSignal[];
  market?: {
    matchedPoolSymbol?: string;
    apy?: number;
    apyChange1dPct?: number | null;
    tvlUsd?: number;
    ilRisk?: string;
    protocolTvlUsd?: number;
  };
  pnl?: {
    unrealizedUsd: number | null;
    unrealizedPct: number | null;
    change24hUsd: number | null;
    change24hPct: number | null;
  };
  opportunity?: {
    altProtocol?: string;
    altApy?: number;
    altSymbol?: string;
    apyDeltaPct?: number;
  };
};

export type VerdictPromptInput = {
  candidateId: string;
  positionKind: PositionKind;
  label: string;
  protocol: string;
  chain: string;
  valueUsd: number;
  shareOfPortfolioPct: number;
  signals: HealthSignal[];
  market?: HealthCandidate['market'];
  pnl?: HealthCandidate['pnl'];
  opportunity?: HealthCandidate['opportunity'];
  portfolioContext: {
    totalUsd: number;
    defiSharePct: number;
    topHoldings: string[];
  };
};

export type PositionVerdict = {
  candidateId: string;
  label: string;
  verdict: VerdictType;
  confidence: ConfidenceLevel;
  headline: string;
  reasoning: string;
  opportunity?: string;
  actionUrl?: string;
  actionLabel?: string;
  ruleOnly?: boolean;
};

export type VerdictCard = {
  id: string;
  label: string;
  verdict: VerdictType;
  confidence: ConfidenceLevel;
  headline: string;
  reasoning: string;
  opportunity?: string;
  actionUrl?: string;
  actionLabel?: string;
  pictogram: 'recurringPurchases' | 'ethStaking';
};
