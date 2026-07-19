import { useEffect, useMemo, useState } from 'react';
import { Banner } from '@coinbase/cds-web/banner';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Pressable } from '@coinbase/cds-web/system';
import { Text } from '@coinbase/cds-web/typography';
import type { WalletToken } from '../../api/walletTypes';
import {
  emptyReasonMessage,
  emptyReasonTitle,
  type EmptyReason,
  type WalletDataMode,
} from '../../data/portfolioSnapshot';
import {
  groupTokensByCategory,
  portfolioTotalUsd,
  TOKEN_CATEGORY_ORDER,
  TOKEN_CATEGORY_TAB_LABELS,
  type TokenCategory,
} from '../../utils/tokenCategories';
import type { PositionVerdict } from '../../types/positionHealth';
import { DASHBOARD_LIST_PAGE_SIZE } from './DashboardTableList';
import { RollingUsdBalance } from './RollingUsdBalance';
import { HoldingsList } from './HoldingsList';
import { DashboardSectionDivider, DashboardWithTradeRail } from './TradeRail';

const CONTENT_PADDING_X = 2;

type HoldingsViewProps = {
  walletTokens: WalletToken[];
  totalBalanceUsd: number | null;
  loading: boolean;
  dataMode: WalletDataMode;
  emptyReason?: EmptyReason;
  verdictsByPositionId?: Record<string, PositionVerdict>;
  /** When set (e.g. from Home allocation), select this tab. */
  initialCategory?: TokenCategory | null;
};

function defaultCategory(groups: Record<TokenCategory, WalletToken[]>): TokenCategory {
  return TOKEN_CATEGORY_ORDER.find((category) => groups[category].length > 0) ?? 'layer1';
}

function CategoryTab({
  active,
  label,
  onSelect,
}: {
  active: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Pressable onClick={onSelect} paddingTop={0.5}>
      <VStack gap={0.75} width="100%">
        <Text color={active ? 'fg' : 'fgMuted'} font="headline">
          {label}
        </Text>
        {active ? (
          <Box background="fgPrimary" borderRadius={1000} height={2} width="100%" />
        ) : (
          <Box height={2} width="100%" />
        )}
      </VStack>
    </Pressable>
  );
}

export const HoldingsView = ({
  walletTokens,
  totalBalanceUsd,
  loading,
  dataMode,
  emptyReason,
  verdictsByPositionId = {},
  initialCategory = null,
}: HoldingsViewProps) => {
  const isDemo = dataMode === 'demo';
  const isLive = dataMode === 'live';
  const groups = groupTokensByCategory(walletTokens);
  const [activeCategory, setActiveCategory] = useState<TokenCategory>(
    () => initialCategory ?? defaultCategory(groups),
  );

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  const displayTotal = totalBalanceUsd ?? portfolioTotalUsd(walletTokens);
  const activeTokens = groups[activeCategory];
  const categoryTotal = activeTokens.reduce((sum, token) => sum + token.valueUsd, 0);

  const visibleTabs = useMemo(
    () => TOKEN_CATEGORY_ORDER.filter((category) => groups[category].length > 0 || isDemo),
    [groups, isDemo],
  );

  const content =
    !isDemo && walletTokens.length === 0 && (!loading || emptyReason === 'refreshing') ? (
      <VStack gap={0} paddingX={CONTENT_PADDING_X} paddingY={3} width="100%">
        {dataMode === 'empty' ? (
          <Box paddingBottom={2} width="100%">
            <Banner startIcon="info" title={emptyReasonTitle(emptyReason)} variant="informational">
              {emptyReasonMessage(emptyReason)}
            </Banner>
          </Box>
        ) : null}
        <RollingUsdBalance font="display2" loading={loading} value={totalBalanceUsd ?? 0} />
        {emptyReason === 'refreshing' ? null : (
          <Text color="fgMuted" font="label2" paddingTop={2}>
            No token holdings found for this wallet.
          </Text>
        )}
      </VStack>
    ) : (
      <VStack gap={0} width="100%">
        <Box paddingBottom={2} paddingTop={2} paddingX={CONTENT_PADDING_X} width="100%">
          <VStack gap={0.5} width="100%">
            <RollingUsdBalance
              font="display2"
              loading={loading && !isDemo}
              value={displayTotal}
            />
            {isDemo ? (
              <Text color="fgMuted" font="label2">
                Sample portfolio — connect wallet to see yours
              </Text>
            ) : null}
          </VStack>
        </Box>

        <Box paddingX={CONTENT_PADDING_X} width="100%">
          <HStack alignItems="flex-end" gap={3} width="100%">
            {visibleTabs.map((category) => (
              <CategoryTab
                key={category}
                active={activeCategory === category}
                label={TOKEN_CATEGORY_TAB_LABELS[category]}
                onSelect={() => setActiveCategory(category)}
              />
            ))}
          </HStack>
        </Box>

        <Box style={{ marginTop: -1 }} width="100%">
          <DashboardSectionDivider />
        </Box>

        <VStack gap={0} paddingX={CONTENT_PADDING_X} width="100%">
          <Box paddingBottom={1} paddingTop={2} width="100%">
            <RollingUsdBalance
              font="title2"
              loading={loading && !isDemo}
              style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 300 }}
              value={categoryTotal}
            />
          </Box>
          <HoldingsList
            emptyMessage="No assets in this category."
            isConnected={isLive}
            loading={loading}
            pageSize={activeCategory === 'defi' ? DASHBOARD_LIST_PAGE_SIZE : undefined}
            tokens={activeTokens}
            verdictsByPositionId={verdictsByPositionId}
          />
        </VStack>
      </VStack>
    );

  return <DashboardWithTradeRail>{content}</DashboardWithTradeRail>;
};
