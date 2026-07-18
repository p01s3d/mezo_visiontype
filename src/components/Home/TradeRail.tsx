import { Box, Divider, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import type { ReactNode, CSSProperties } from 'react';
import { QuickActions } from './QuickActions';
import { TradePanel } from './TradePanel';

const TRADE_RAIL_WIDTH = 360;
export const DASHBOARD_CONTENT_MAX_WIDTH = 950;
const NAVBAR_HEIGHT_PX = 64;

/** Match CDS Divider — theme token so dark mode isn’t stuck on light hairline. */
const DIVIDER_COLOR = 'var(--color-bgLine)';

const VIEWPORT_BODY_MIN_HEIGHT = `calc(100vh - ${NAVBAR_HEIGHT_PX}px)`;

const ROW_STYLE: CSSProperties = {
  display: 'grid',
  // Main hugs its max width; rail sits next to it (not flush to the viewport right)
  gridTemplateColumns: `minmax(0, ${DASHBOARD_CONTENT_MAX_WIDTH}px) 1px ${TRADE_RAIL_WIDTH}px`,
  alignItems: 'stretch',
  justifyContent: 'start',
  width: 'fit-content',
  maxWidth: '100%',
  flex: 1,
  minHeight: VIEWPORT_BODY_MIN_HEIGHT,
};

const MAIN_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  width: '100%',
  minHeight: '100%',
};

const DIVIDER_COLUMN_STYLE: CSSProperties = {
  width: 1,
  minHeight: '100%',
  backgroundColor: DIVIDER_COLOR,
  alignSelf: 'stretch',
};

const TRADE_RAIL_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: TRADE_RAIL_WIDTH,
  minHeight: '100%',
};

export function TradeRail() {
  return (
    <VStack flexShrink={0} gap={0} minWidth={320} paddingX={3} paddingY={3} width={360}>
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

/** Full-width rule spanning the main column (sidebar edge → trade rail divider). */
export function DashboardSectionDivider() {
  return (
    <Box width="100%">
      <VStack width="100%">
        <Divider />
      </VStack>
    </Box>
  );
}

function DashboardFooter() {
  return (
    <Box paddingX={2} paddingY={3} style={{ marginTop: 'auto' }} width="100%">
      <Divider />
      <Box paddingTop={2} width="100%">
        <Text color="fgMuted" font="legal">
          Portfolio health is informational only — not financial advice.
        </Text>
      </Box>
    </Box>
  );
}

export function DashboardWithTradeRail({ children }: DashboardWithTradeRailProps) {
  return (
    <div style={ROW_STYLE}>
      <div style={MAIN_COLUMN_STYLE}>
        <VStack alignItems="stretch" gap={0} width="100%">
          {children}
        </VStack>
        <DashboardFooter />
      </div>
      <div aria-hidden style={DIVIDER_COLUMN_STYLE} />
      <div style={TRADE_RAIL_COLUMN_STYLE}>
        <TradeRail />
      </div>
    </div>
  );
}
