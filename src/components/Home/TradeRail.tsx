import { Box, Divider, HStack, VStack } from '@coinbase/cds-web/layout';
import type { ReactNode } from 'react';
import { QuickActions } from './QuickActions';
import { TradePanel } from './TradePanel';

export function TradeRail() {
  return (
    <VStack alignSelf="stretch" flexShrink={0} gap={0} minWidth={320} paddingX={3} paddingY={3} width={360}>
      <TradePanel />
      <Box paddingY={3} width="100%">
        <Divider />
      </Box>
      <QuickActions />
    </VStack>
  );
}

type DashboardWithTradeRailProps = {
  children: ReactNode;
};

export function DashboardWithTradeRail({ children }: DashboardWithTradeRailProps) {
  return (
    <HStack alignItems="stretch" gap={0} minHeight="100%" width="100%">
      <VStack flexGrow={1} gap={0} maxWidth={720} width="100%">
        {children}
      </VStack>
      <Box alignSelf="stretch" display="flex" flexShrink={0}>
        <Divider direction="vertical" />
      </Box>
      <TradeRail />
    </HStack>
  );
}
