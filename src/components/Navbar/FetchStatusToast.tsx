import { Box, HStack } from '@coinbase/cds-web/layout';
import { Spinner } from '@coinbase/cds-web/loaders/Spinner';
import { Portal } from '@coinbase/cds-web/overlays/Portal';
import { toastContainerId } from '@coinbase/cds-web/overlays/PortalProvider';
import { Text } from '@coinbase/cds-web/typography';

/** Toast-shaped status while Refresh is fetching — spinner sits where an icon would. */
export function FetchStatusToast({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <Portal containerId={toastContainerId}>
      <Box
        bottom="var(--space-4)"
        justifyContent="center"
        padding={2}
        position="fixed"
        role="status"
        style={{ left: 0, right: 0, zIndex: 1000, pointerEvents: 'none' }}
        width="100%"
      >
        <HStack
          alignItems="center"
          background="bgAlternate"
          borderRadius={200}
          elevation={2}
          gap={2}
          paddingEnd={3}
          paddingStart={2.5}
          paddingY={1.5}
          style={{ pointerEvents: 'auto' }}
        >
          <Spinner accessibilityLabel="Loading" color="fgPrimary" size={1.6} />
          <Text as="p" display="block" font="headline">
            Fetching latest data…
          </Text>
        </HStack>
      </Box>
    </Portal>
  );
}
