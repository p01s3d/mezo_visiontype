import { Box, Divider, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import type { ReactNode, CSSProperties } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { QuickActions } from './QuickActions';
import { TradePanel } from './TradePanel';
import { TRADE_SHEET_BAR_HEIGHT, TradeRailSheet } from './TradeRailSheet';

const TRADE_RAIL_WIDTH = 360;
const NAVBAR_HEIGHT_PX = 64;

/**
 * Below this the rail can no longer keep its 360px without starving the main
 * column: the health bento needs 536px for its two-column layout, and main is
 * `viewport - sidebar - rail - divider`. At 1024 that leaves main ~575px, so the
 * rail undocks here and main takes the full width back.
 */
const RAIL_BREAKPOINT_PX = 1024;
export const RAIL_COMPACT_QUERY = `(max-width: ${RAIL_BREAKPOINT_PX - 1}px)`;

/** Match CDS Divider — theme token so dark mode isn’t stuck on light hairline. */
const DIVIDER_COLOR = 'var(--color-bgLine)';

const VIEWPORT_BODY_MIN_HEIGHT = `calc(100vh - ${NAVBAR_HEIGHT_PX}px)`;

const ROW_STYLE: CSSProperties = {
  display: 'grid',
  // Main absorbs all remaining space so the rail stays pinned to the container's right edge.
  gridTemplateColumns: `1fr 1px ${TRADE_RAIL_WIDTH}px`,
  alignItems: 'stretch',
  width: '100%',
  flex: 1,
  minHeight: VIEWPORT_BODY_MIN_HEIGHT,
};

/** Rail is docked to the bottom of the viewport instead of holding a column. */
const ROW_STYLE_COMPACT: CSSProperties = {
  ...ROW_STYLE,
  gridTemplateColumns: '1fr',
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
  const compact = useMediaQuery(RAIL_COMPACT_QUERY);

  return (
    <div style={compact ? ROW_STYLE_COMPACT : ROW_STYLE}>
      <div style={MAIN_COLUMN_STYLE}>
        <VStack alignItems="stretch" gap={0} width="100%">
          {children}
        </VStack>
        <DashboardFooter />
        {compact ? <div aria-hidden style={{ height: TRADE_SHEET_BAR_HEIGHT }} /> : null}
      </div>
      {compact ? (
        <TradeRailSheet>
          <TradeRail />
        </TradeRailSheet>
      ) : (
        <>
          <div aria-hidden style={DIVIDER_COLUMN_STYLE} />
          <div style={TRADE_RAIL_COLUMN_STYLE}>
            <TradeRail />
          </div>
        </>
      )}
    </div>
  );
}
