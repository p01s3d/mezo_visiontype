import { useMemo, useState } from 'react';
import { HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import type { WalletToken } from '../../api/walletTypes';
import { DEMO_WALLET_TOKENS } from '../../data/demoPortfolio';
import { getPortfolioNudges, CONNECT_NUDGE } from '../../utils/portfolioNudges';
import { ForYouCard } from './ForYouCard';

type ForYouSectionProps = {
  walletTokens: WalletToken[];
  isConnected: boolean;
  loading: boolean;
};

export const ForYouSection = ({ walletTokens, isConnected, loading }: ForYouSectionProps) => {
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const tokens = isConnected ? walletTokens : DEMO_WALLET_TOKENS;

  const cards = useMemo(() => {
    if (loading && isConnected) {
      return [
        {
          id: 'loading',
          title: 'Reviewing your portfolio',
          description: 'Personal nudges appear once wallet data finishes loading.',
          pictogram: 'recurringPurchases' as const,
        },
      ];
    }

    const nudges = getPortfolioNudges(tokens);
    if (!isConnected) {
      return [CONNECT_NUDGE, ...nudges.slice(0, 2)];
    }
    return nudges;
  }, [tokens, isConnected, loading]);

  const visibleCards = cards.filter((card) => !dismissed[card.id]);

  if (visibleCards.length === 0) {
    return null;
  }

  return (
    <VStack gap={1.5} paddingX={2} paddingY={2}>
      <Text font="title3">For you</Text>
      <HStack alignItems="stretch" gap={2} width="100%">
        {visibleCards.map((card) => (
          <ForYouCard
            key={card.id}
            description={card.description}
            onDismiss={card.id === 'loading' ? undefined : () => setDismissed((prev) => ({ ...prev, [card.id]: true }))}
            pictogram={card.pictogram}
            title={card.title}
          />
        ))}
      </HStack>
    </VStack>
  );
};
