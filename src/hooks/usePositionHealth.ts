import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Address } from 'viem';
import type { Protocol, YieldPool } from '../api/defillama';
import type { GroupedPoolPosition, PersonalPosition, WalletToken } from '../api/walletTypes';
import {
  buildRuleOnlySynthesis,
  buildRuleOnlyVerdict,
  clearSynthesisCache,
  fetchPortfolioSynthesis,
  hasOpenRouterKey,
} from '../api/openrouter';
import type { HealthCandidate, PositionVerdict } from '../types/positionHealth';
import { computeHealthCandidates } from '../utils/healthSignals';
import {
  computePortfolioHealthScore,
  type PortfolioHealthScore,
} from '../utils/portfolioHealthScore';
import {
  buildHealthCockpit,
  type HealthCockpit,
} from '../utils/cutQueue';
import { computeArcScores } from '../utils/bentoHealthMetrics';
import { getTrendingProtocols } from '../utils/trendingProtocols';
import type { BentoInsights } from '../prompts/portfolioHealthPrompt';
import {
  buildAlertsFromHealth,
  firstHighUnseenForToast,
  markAllSeen,
  markAlertSeen,
  markToasted,
  mergeAlerts,
  readAlerts,
  readCachedScore,
  type AppAlert,
  unreadCount,
  writeAlerts,
  writeCachedScore,
} from '../utils/healthAlerts';
import { clearVerdictBatch, readDismissedVerdictIds } from '../utils/verdictSessionCache';
import type { LpTransaction } from '../api/walletTypes';
import {
  clearWalletInsightsCache,
  isCacheUsable,
  readJsonCache,
  walletInsightsCacheKey,
  writeJsonCache,
} from '../utils/walletDataCache';
import {
  buildCoachInsight,
  coachPriorsForPrompt,
  mergeCoachCopy,
  type CoachCopy,
  type CoachInsight,
} from '../utils/coachInsight';

type UsePositionHealthParams = {
  address?: Address;
  walletTokens: WalletToken[];
  poolPositions: GroupedPoolPosition[];
  personalPositions: PersonalPosition[];
  yieldPools: YieldPool[];
  protocols: Protocol[];
  enabled: boolean;
  dataLoading: boolean;
  vsBtcPct?: number | null;
  portfolioChangePct?: number | null;
  rawPortfolioValues?: number[];
  portfolioSeries?: number[];
  btcSeries?: number[] | null;
  lpTransactions?: LpTransaction[];
};

type PositionHealthState = {
  candidates: HealthCandidate[];
  verdicts: PositionVerdict[];
  verdictsByPositionId: Record<string, PositionVerdict>;
  health: PortfolioHealthScore | null;
  cockpit: HealthCockpit | null;
  narrative: string | null;
  bentoInsights: BentoInsights | null;
  coachInsight: CoachInsight | null;
  alerts: AppAlert[];
  unreadAlertCount: number;
  toastAlert: AppAlert | null;
  dismissedVerdictIds: Set<string>;
  loading: boolean;
  aiLoading: boolean;
  missingOpenRouterKey: boolean;
  dismissVerdict: (cardId: string) => void;
  markAlertsRead: () => void;
  markAlertRead: (alertId: string) => void;
  clearToast: () => void;
  refresh: () => void;
};

type MemoryCache = {
  address: Address;
  inputKey: string;
  candidates: HealthCandidate[];
  verdicts: PositionVerdict[];
  verdictsByPositionId: Record<string, PositionVerdict>;
  health: PortfolioHealthScore;
  narrative: string;
  bento: BentoInsights;
  insightCards?: Partial<CoachCopy> | null;
  aiFetched: boolean;
  savedAt: number;
};

let memoryCache: MemoryCache | null = null;

function resolveInsightsCache(address: Address): MemoryCache | null {
  if (memoryCache?.address.toLowerCase() === address.toLowerCase() && memoryCache.aiFetched) {
    return memoryCache;
  }
  const stored = readJsonCache<MemoryCache>(walletInsightsCacheKey(address));
  if (
    !stored ||
    stored.address.toLowerCase() !== address.toLowerCase() ||
    !stored.aiFetched ||
    !isCacheUsable(stored.savedAt)
  ) {
    return null;
  }
  memoryCache = stored;
  return stored;
}

function persistInsightsCache(cache: MemoryCache): void {
  memoryCache = cache;
  writeJsonCache(walletInsightsCacheKey(cache.address), cache);
}

function buildInputKey(
  address: Address | undefined,
  tokens: WalletToken[],
  pools: GroupedPoolPosition[],
  personal: PersonalPosition[],
  vsBtcPct: number | null,
  portfolioChangePct: number | null,
): string {
  const tokenSig = tokens.map((t) => `${t.id}:${t.valueUsd.toFixed(0)}`).join('|');
  const poolSig = pools.map((p) => `${p.groupId}:${p.valueUsd.toFixed(0)}`).join('|');
  const personalSig = personal.map((p) => `${p.id}:${p.valueUsd.toFixed(0)}`).join('|');
  return `${address ?? 'demo'}::${tokenSig}::${poolSig}::${personalSig}::${vsBtcPct ?? 'x'}::${portfolioChangePct ?? 'x'}`;
}

export function usePositionHealth({
  address,
  walletTokens,
  poolPositions,
  personalPositions,
  yieldPools,
  protocols,
  enabled,
  dataLoading,
  vsBtcPct = null,
  portfolioChangePct = null,
  rawPortfolioValues = [],
  portfolioSeries = [],
  btcSeries = null,
  lpTransactions = [],
}: UsePositionHealthParams): PositionHealthState {
  const [candidates, setCandidates] = useState<HealthCandidate[]>([]);
  const [verdicts, setVerdicts] = useState<PositionVerdict[]>([]);
  const [verdictsByPositionId, setVerdictsByPositionId] = useState<Record<string, PositionVerdict>>(
    {},
  );
  const [health, setHealth] = useState<PortfolioHealthScore | null>(null);
  const [cockpit, setCockpit] = useState<HealthCockpit | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [bentoInsights, setBentoInsights] = useState<BentoInsights | null>(null);
  const [coachAiCopy, setCoachAiCopy] = useState<Partial<CoachCopy> | null>(null);
  const [alerts, setAlerts] = useState<AppAlert[]>([]);
  const [toastAlert, setToastAlert] = useState<AppAlert | null>(null);
  const [dismissedVerdictIds, setDismissedVerdictIds] = useState<Set<string>>(() =>
    address ? readDismissedVerdictIds(address) : new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const aiRunRef = useRef<string | null>(null);

  const inputKey = useMemo(
    () =>
      buildInputKey(
        address,
        walletTokens,
        poolPositions,
        personalPositions,
        vsBtcPct,
        portfolioChangePct,
      ),
    [address, walletTokens, poolPositions, personalPositions, vsBtcPct, portfolioChangePct],
  );

  const syncAlerts = useCallback(
    (
      nextHealth: PortfolioHealthScore,
      synthesisAlertCopy?: Array<{ factorId: string; title: string; body: string }>,
    ) => {
      if (!address) return;

      const previousScore = readCachedScore(address);
      let nextAlerts = buildAlertsFromHealth(nextHealth, previousScore);

      if (synthesisAlertCopy?.length) {
        nextAlerts = nextAlerts.map((alert) => {
          const rewrite = synthesisAlertCopy.find(
            (c) => c.factorId === alert.sourceFactorId || alert.id.startsWith(c.factorId),
          );
          return rewrite ? { ...alert, title: rewrite.title, body: rewrite.body } : alert;
        });
      }

      const merged = mergeAlerts(readAlerts(address), nextAlerts);
      writeAlerts(address, merged);
      writeCachedScore(address, nextHealth.score);
      setAlerts(merged);

      const toast = firstHighUnseenForToast(merged, address);
      if (toast) {
        markToasted(address, toast.id);
        setToastAlert(toast);
      }
    },
    [address],
  );

  const runHealth = useCallback(
    async (forceAi = false) => {
      // Sticky insights: serve cache even while wallet data is still loading.
      if (!forceAi && address) {
        const cached = resolveInsightsCache(address);
        if (cached) {
          setCandidates(cached.candidates);
          setVerdicts(cached.verdicts);
          setVerdictsByPositionId(cached.verdictsByPositionId);
          setHealth(cached.health);
          setCockpit(
            buildHealthCockpit({
              walletTokens,
              poolPositions,
              candidates: cached.candidates,
              verdictsByPositionId: cached.verdictsByPositionId,
              lpTransactions,
              rawPortfolioValues,
            }),
          );
          setNarrative(cached.narrative);
          setBentoInsights(cached.bento);
          setCoachAiCopy(cached.insightCards ?? null);
          setAlerts(readAlerts(address));
          setAiLoading(false);
          setLoading(false);
          return;
        }
      }

      if (dataLoading && address) return;

      const nextCandidates = computeHealthCandidates({
        walletTokens,
        poolPositions,
        personalPositions,
        yieldPools,
        protocols,
      });

      setCandidates(nextCandidates);

      const nextHealth = computePortfolioHealthScore({
        walletTokens,
        poolPositions,
        personalPositions,
        candidates: nextCandidates,
        vsBtcPct,
        portfolioChangePct,
        rawPortfolioValues,
      });
      setHealth(nextHealth);

      const ruleVerdicts = nextCandidates.map(buildRuleOnlyVerdict);
      const allVerdictsMap = Object.fromEntries(ruleVerdicts.map((v) => [v.candidateId, v]));

      setCockpit(
        buildHealthCockpit({
          walletTokens,
          poolPositions,
          candidates: nextCandidates,
          verdictsByPositionId: allVerdictsMap,
          lpTransactions,
          rawPortfolioValues,
        }),
      );

      const ruleArcs = computeArcScores({
        health: nextHealth,
        rawPortfolioValues,
        walletTokens,
        poolPositions,
      });
      const trending = getTrendingProtocols(protocols, 5);
      const ruleBento = buildRuleOnlySynthesis(
        nextHealth,
        nextCandidates,
        ruleArcs,
        trending,
      ).bento;

      const seriesForCoach =
        portfolioSeries.length >= 2
          ? portfolioSeries
          : rawPortfolioValues.length >= 2
            ? rawPortfolioValues
            : [];
      const coachBase = buildCoachInsight({
        walletTokens,
        poolPositions,
        personalPositions,
        candidates: nextCandidates,
        verdictsByPositionId: allVerdictsMap,
        portfolioSeries: seriesForCoach,
        btcSeries,
        portfolioChangePct,
      });

      setVerdictsByPositionId(allVerdictsMap);
      setNarrative(nextHealth.ruleNarrative);
      setBentoInsights(ruleBento);
      setCoachAiCopy(null);

      if (!enabled || !address) {
        setVerdicts(ruleVerdicts.slice(0, 4));
        if (address) {
          syncAlerts(nextHealth);
        }
        return;
      }

      const runKey = `${inputKey}:${forceAi}`;
      if (aiRunRef.current === runKey && !forceAi) return;
      aiRunRef.current = runKey;

      setLoading(true);
      setAiLoading(true);

      try {
        const synthesis = await fetchPortfolioSynthesis({
          address,
          inputKey,
          health: nextHealth,
          candidates: nextCandidates.filter((c) => !dismissedVerdictIds.has(c.id)),
          ruleArcs,
          trendingProtocols: trending,
          coachPriors: coachPriorsForPrompt(coachBase),
          force: forceAi,
        });

        for (const chip of synthesis.positionChips) {
          allVerdictsMap[chip.candidateId] = chip;
        }

        setVerdicts(synthesis.positionChips);
        setVerdictsByPositionId({ ...allVerdictsMap });
        setCockpit(
          buildHealthCockpit({
            walletTokens,
            poolPositions,
            candidates: nextCandidates,
            verdictsByPositionId: { ...allVerdictsMap },
            lpTransactions,
            rawPortfolioValues,
          }),
        );
        setNarrative(synthesis.narrative);
        setBentoInsights(synthesis.bento);
        setCoachAiCopy(synthesis.insightCards);
        syncAlerts(nextHealth, synthesis.alertCopy);

        persistInsightsCache({
          address,
          inputKey,
          candidates: nextCandidates,
          verdicts: synthesis.positionChips,
          verdictsByPositionId: { ...allVerdictsMap },
          health: nextHealth,
          narrative: synthesis.narrative,
          bento: synthesis.bento,
          insightCards: synthesis.insightCards,
          aiFetched: hasOpenRouterKey(),
          savedAt: Date.now(),
        });
      } catch (err) {
        console.error('[usePositionHealth]', err);
        setVerdicts(ruleVerdicts.slice(0, 4));
        setNarrative(nextHealth.ruleNarrative);
        setBentoInsights(ruleBento);
        setCoachAiCopy(null);
        syncAlerts(nextHealth);
      } finally {
        setAiLoading(false);
        setLoading(false);
      }
    },
    [
      address,
      dataLoading,
      enabled,
      inputKey,
      personalPositions,
      poolPositions,
      protocols,
      walletTokens,
      yieldPools,
      dismissedVerdictIds,
      vsBtcPct,
      portfolioChangePct,
      rawPortfolioValues,
      portfolioSeries,
      btcSeries,
      lpTransactions,
      syncAlerts,
    ],
  );

  const coachInsight = useMemo(() => {
    const hasBook = walletTokens.length > 0 || poolPositions.length > 0;
    if (!hasBook && candidates.length === 0) return null;
    const seriesForCoach =
      portfolioSeries.length >= 2
        ? portfolioSeries
        : rawPortfolioValues.length >= 2
          ? rawPortfolioValues
          : [];
    if (seriesForCoach.length < 2 && candidates.length === 0) return null;
    const base = buildCoachInsight({
      walletTokens,
      poolPositions,
      personalPositions,
      candidates,
      verdictsByPositionId,
      portfolioSeries: seriesForCoach.length >= 2 ? seriesForCoach : [100, 100],
      btcSeries,
      portfolioChangePct,
    });
    return mergeCoachCopy(base, coachAiCopy);
  }, [
    walletTokens,
    poolPositions,
    personalPositions,
    candidates,
    verdictsByPositionId,
    portfolioSeries,
    rawPortfolioValues,
    btcSeries,
    portfolioChangePct,
    coachAiCopy,
  ]);

  useEffect(() => {
    if (address) {
      setDismissedVerdictIds(readDismissedVerdictIds(address));
      setAlerts(readAlerts(address));
    }
  }, [address]);

  useEffect(() => {
    void runHealth();
  }, [runHealth]);

  const dismissVerdict = useCallback(
    (cardId: string) => {
      if (!address) return;
      // Chips are no longer dismissible cards; keep API for compatibility.
      void cardId;
      memoryCache = null;
      aiRunRef.current = null;
      void runHealth(true);
    },
    [address, runHealth],
  );

  const markAlertsRead = useCallback(() => {
    if (!address) return;
    const next = markAllSeen(alerts);
    writeAlerts(address, next);
    setAlerts(next);
  }, [address, alerts]);

  const markAlertRead = useCallback(
    (alertId: string) => {
      if (!address) return;
      const next = markAlertSeen(alerts, alertId);
      writeAlerts(address, next);
      setAlerts(next);
    },
    [address, alerts],
  );

  const refresh = useCallback(() => {
    if (address) {
      clearVerdictBatch(address);
      clearSynthesisCache(address);
      clearWalletInsightsCache(address);
    }
    memoryCache = null;
    aiRunRef.current = null;
    void runHealth(true);
  }, [address, runHealth]);

  return {
    candidates,
    verdicts,
    verdictsByPositionId,
    health,
    cockpit,
    narrative,
    bentoInsights,
    coachInsight,
    alerts,
    unreadAlertCount: unreadCount(alerts),
    toastAlert,
    dismissedVerdictIds,
    loading,
    aiLoading,
    missingOpenRouterKey: !hasOpenRouterKey(),
    dismissVerdict,
    markAlertsRead,
    markAlertRead,
    clearToast: () => setToastAlert(null),
    refresh,
  };
}

export function getCachedVerdictForPosition(positionId: string): PositionVerdict | undefined {
  return memoryCache?.verdictsByPositionId[positionId];
}

export function getAllCachedCandidates(): HealthCandidate[] {
  return memoryCache?.candidates ?? [];
}
