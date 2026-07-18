import { useMemo } from 'react';
import { Banner } from '@coinbase/cds-web/banner';
import { Box, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import type { PositionVerdict, VerdictCard } from '../../types/positionHealth';
import { CONNECT_VERDICT_CARD, DEMO_VERDICT_CARDS } from '../../data/demoVerdicts';
import {
  FOR_YOU_CARD_COUNT,
  FOR_YOU_GRID_STYLE,
  ForYouCard,
  ForYouCardSkeleton,
} from './ForYouCard';

type ForYouSectionProps = {
  isConnected: boolean;
  loading: boolean;
  aiLoading: boolean;
  missingOpenRouterKey: boolean;
  verdicts: PositionVerdict[];
  dismissedVerdictIds: Set<string>;
  onDismissVerdict: (cardId: string) => void;
};

function positionTitle(label: string): string {
  const beforeChain = label.split(' · ')[0]?.trim();
  return beforeChain || label;
}

function verdictToCard(verdict: PositionVerdict): VerdictCard {
  return {
    id: verdict.candidateId,
    label: verdict.label,
    verdict: verdict.verdict,
    confidence: verdict.confidence,
    headline: verdict.headline,
    reasoning: verdict.reasoning,
    opportunity: verdict.opportunity,
    actionUrl: verdict.actionUrl,
    actionLabel: verdict.actionLabel,
    pictogram: verdict.verdict === 'exit' || verdict.verdict === 'reduce' ? 'ethStaking' : 'recurringPurchases',
  };
}

export const ForYouSection = ({
  isConnected,
  loading,
  aiLoading,
  missingOpenRouterKey,
  verdicts,
  dismissedVerdictIds,
  onDismissVerdict,
}: ForYouSectionProps) => {
  const showSkeleton = isConnected && (loading || aiLoading) && verdicts.length === 0;

  const cards = useMemo((): VerdictCard[] => {
    if (showSkeleton) {
      return [];
    }

    if (!isConnected) {
      return [CONNECT_VERDICT_CARD, ...DEMO_VERDICT_CARDS.slice(0, FOR_YOU_CARD_COUNT - 1)];
    }

    if (verdicts.length === 0) {
      return DEMO_VERDICT_CARDS.slice(0, 1);
    }

    return verdicts.map(verdictToCard).slice(0, FOR_YOU_CARD_COUNT);
  }, [isConnected, showSkeleton, verdicts]);

  const visibleCards = cards.filter((card) => !dismissedVerdictIds.has(card.id));

  if (visibleCards.length === 0 && !showSkeleton) {
    return null;
  }

  return (
    <VStack gap={1.5} paddingX={2} paddingY={2} width="100%">
      <Text font="title3">For you</Text>
      {isConnected && missingOpenRouterKey ? (
        <Banner startIcon="info" title="AI verdicts" variant="informational">
          Add VITE_OPENROUTER_API_KEY to .env.local for AI-generated position health copy on Home.
        </Banner>
      ) : null}
      <Box style={FOR_YOU_GRID_STYLE}>
        {showSkeleton
          ? Array.from({ length: FOR_YOU_CARD_COUNT }, (_, index) => (
              <ForYouCardSkeleton key={`skeleton-${index}`} />
            ))
          : visibleCards.map((card) => (
              <ForYouCard
                key={card.id}
                actionLabel={card.actionLabel}
                actionUrl={card.actionUrl}
                confidence={card.confidence}
                description={card.reasoning}
                headline={card.headline}
                onDismiss={
                  card.id === 'connect'
                    ? undefined
                    : () => onDismissVerdict(card.id)
                }
                pictogram={card.pictogram}
                title={positionTitle(card.label)}
                verdict={card.verdict}
              />
            ))}
      </Box>
    </VStack>
  );
};
