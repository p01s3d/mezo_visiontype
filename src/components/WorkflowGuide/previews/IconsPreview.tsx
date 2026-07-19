import type { ReactNode } from 'react';
import { Box, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { ALL_NAV, getNavAnimation } from '../../../data/navConfig';
import { getQuickActionAnimation, QUICK_ACTIONS } from '../../../data/quickActionIcons';
import { AnimatedQuickActionIcon } from '../../Home/AnimatedQuickActionIcon';
import { AnimatedNavIcon } from '../../Sidebar/AnimatedNavIcon';

const NAV_ICONS = ALL_NAV.map((entry) => ({
  id: entry.id,
  label: entry.title,
  animation: getNavAnimation(entry.id),
}));

function IconCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <VStack alignItems="center" gap={1} justifyContent="center" padding={1.5}>
      {children}
      <Text color="fgMuted" font="legal" style={{ textAlign: 'center' }}>
        {label}
      </Text>
    </VStack>
  );
}

export function IconsPreview() {
  return (
    <VStack gap={3} minWidth={0} width="100%">
      <Box
        display="grid"
        gap={2}
        style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
        width="100%"
      >
        {NAV_ICONS.map((icon) => (
          <IconCell key={icon.id} label={icon.label}>
            <AnimatedNavIcon active animationData={icon.animation} loop />
          </IconCell>
        ))}
      </Box>

      <Box
        display="grid"
        gap={2}
        style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
        width="100%"
      >
        {QUICK_ACTIONS.map((action) => (
          <IconCell key={action.id} label={action.label}>
            <AnimatedQuickActionIcon animationData={getQuickActionAnimation(action.id)} loop />
          </IconCell>
        ))}
      </Box>
    </VStack>
  );
}
