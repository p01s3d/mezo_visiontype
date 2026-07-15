import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { NavigationBar, NavigationTitle, Sidebar } from '@coinbase/cds-web/navigation';
import { Text } from '@coinbase/cds-web/typography';
import { CDSLogo } from '../../CDSLogo';
import { DefiNavItem } from '../../Sidebar/DefiNavItem';
import { EARN_NAV, MAIN_NAV } from '../../../data/navConfig';
import { GUIDE_PREVIEW_HEIGHT } from '../previewConstants';

function EarnSectionLabel() {
  return (
    <Box paddingBottom={0.5} paddingTop={2} paddingX={2} width="100%">
      <Text
        color="fgMuted"
        font="label2"
        style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
      >
        Earn
      </Text>
    </Box>
  );
}

export function ExpandedNavPreview() {
  return (
    <HStack alignItems="stretch" height={GUIDE_PREVIEW_HEIGHT} overflow="hidden" width="100%">
      <Box flexShrink={0} zIndex={0}>
        <Sidebar collapsed={false} height="100%" logo={<CDSLogo />}>
          {MAIN_NAV.map((entry, index) => (
            <DefiNavItem
              key={entry.id}
              active={index === 0}
              collapsed={false}
              entry={entry}
              onSelect={() => undefined}
            />
          ))}
          <EarnSectionLabel />
          {EARN_NAV.map((entry) => (
            <DefiNavItem
              key={entry.id}
              active={false}
              collapsed={false}
              entry={entry}
              onSelect={() => undefined}
            />
          ))}
        </Sidebar>
      </Box>

      <VStack flexGrow={1} minWidth={0} position="relative" width="100%" zIndex={1}>
        <NavigationBar>
          <NavigationTitle>Home</NavigationTitle>
        </NavigationBar>
        <Box background="bgAlternate" flexGrow={1} minHeight={0} width="100%" />
      </VStack>
    </HStack>
  );
}
