import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { NavigationBar, NavigationTitle, Sidebar } from '@coinbase/cds-web/navigation';
import { CDSLogo } from '../../CDSLogo';
import { DefiNavItem } from '../../Sidebar/DefiNavItem';
import { ALL_NAV } from '../../../data/navConfig';
import { GUIDE_SECTION_HEIGHT } from '../previewConstants';

export function ExpandedNavPreview() {
  return (
    <HStack alignItems="stretch" height={GUIDE_SECTION_HEIGHT} overflow="hidden" width="100%">
      <Box flexShrink={0} zIndex={0}>
        <Sidebar collapsed={false} height={GUIDE_SECTION_HEIGHT} logo={<CDSLogo />}>
          {ALL_NAV.map((entry, index) => (
            <DefiNavItem
              key={entry.id}
              active={index === 0}
              collapsed={false}
              entry={entry}
              onSelect={() => undefined}
            />
          ))}
        </Sidebar>
      </Box>

      <VStack background="bgAlternate" flexGrow={1} minWidth={0} position="relative" width="100%" zIndex={1}>
        <NavigationBar>
          <NavigationTitle>Home</NavigationTitle>
        </NavigationBar>
        <Box background="bgAlternate" flexGrow={1} minHeight={0} width="100%" />
      </VStack>
    </HStack>
  );
}
