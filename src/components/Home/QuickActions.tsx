import { useState } from 'react';
import { HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { getQuickActionAnimation, QUICK_ACTIONS } from '../../data/quickActionIcons';
import { AnimatedQuickActionIcon } from './AnimatedQuickActionIcon';
import { HomePressableRow } from './HomePressableRow';

export const QuickActions = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <VStack gap={0} width="100%">
      {QUICK_ACTIONS.map((action) => (
        <HomePressableRow
          key={action.id}
          accessibilityLabel={action.label}
          bleedX={3}
          onMouseEnter={() => setHoveredId(action.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <HStack alignItems="center" gap={2} width="100%">
            <AnimatedQuickActionIcon
              animationData={getQuickActionAnimation(action.id)}
              hovered={hoveredId === action.id}
            />
            <Text font="headline">{action.label}</Text>
          </HStack>
        </HomePressableRow>
      ))}
    </VStack>
  );
};
