import { useMemo, useState } from 'react';
import { Box, Divider, HStack, VStack } from '@coinbase/cds-web/layout';
import { Pressable } from '@coinbase/cds-web/system';
import { Text } from '@coinbase/cds-web/typography';
import type { WalletToken } from '../../api/walletTypes';
import { DEMO_NET_WORTH_USD, DEMO_WALLET_TOKENS } from '../../data/demoPortfolio';
import {
  groupTokensByCategory,
  portfolioTotalUsd,
  TOKEN_CATEGORY_ORDER,
  TOKEN_CATEGORY_TAB_LABELS,
  type TokenCategory,
} from '../../utils/tokenCategories';
import { formatUsd } from '../../utils/format';
import { HoldingsList } from './HoldingsList';
import { DashboardWithTradeRail } from './TradeRail';

const CONTENT_PADDING_X = 2;

type HoldingsViewProps = {
  walletTokens: WalletToken[];
  totalBalanceUsd: number | null;
  loading: boolean;
  isConnected: boolean;
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
    <Pressable onClick={onSelect} paddingBottom={1} paddingTop={0.5}>
      <VStack gap={0.75}>
        <Text color={active ? 'fg' : 'fgMuted'} font="headline">
          {label}
        </Text>
        <Box
          background={active ? 'fgPrimary' : 'transparent'}
          borderRadius={1000}
          height={2}
          width="100%"
        />
      </VStack>
    </Pressable>
  );
}

export const HoldingsView = ({
  walletTokens,
  totalBalanceUsd,
  loading,
  isConnected,
}: HoldingsViewProps) => {
  const tokens = isConnected ? walletTokens : DEMO_WALLET_TOKENS;
  const groups = groupTokensByCategory(tokens);
  const [activeCategory, setActiveCategory] = useState<TokenCategory>(() => defaultCategory(groups));

  const displayTotal = isConnected ? (totalBalanceUsd ?? portfolioTotalUsd(tokens)) : DEMO_NET_WORTH_USD;
  const activeTokens = groups[activeCategory];
  const categoryTotal = activeTokens.reduce((sum, token) => sum + token.valueUsd, 0);

  const visibleTabs = useMemo(
    () => TOKEN_CATEGORY_ORDER.filter((category) => groups[category].length > 0 || !isConnected),
    [groups, isConnected],
  );
  const content = isConnected && tokens.length === 0 && !loading ? (
    <VStack gap={0} paddingX={CONTENT_PADDING_X} paddingY={3} width="100%">
      <Text font="display2">{formatUsd(0)}</Text>
      <Text color="fgMuted" font="label2" paddingTop={2}>
        No token holdings found for this wallet.
      </Text>
    </VStack>
  ) : (
    <VStack gap={0} width="100%">
      <Box paddingBottom={2} paddingTop={2} paddingX={CONTENT_PADDING_X}>
        <VStack gap={0.5} width="100%">
          <Text font="display2">{loading && isConnected ? '…' : formatUsd(displayTotal)}</Text>
          {!isConnected ? (
            <Text color="fgMuted" font="label2">
              Sample portfolio — connect wallet to see yours
            </Text>
          ) : null}
        </VStack>
      </Box>

      <HStack
        alignItems="flex-end"
        gap={2}
        justifyContent="space-between"
        paddingBottom={1.5}
        paddingX={CONTENT_PADDING_X}
        width="100%"
      >
        <HStack alignItems="flex-end" flexGrow={1} gap={3} minWidth={0}>
          {visibleTabs.map((category) => (
            <CategoryTab
              key={category}
              active={activeCategory === category}
              label={TOKEN_CATEGORY_TAB_LABELS[category]}
              onSelect={() => setActiveCategory(category)}
            />
          ))}
        </HStack>
        <Text flexShrink={0} font="title3" style={{ fontVariantNumeric: 'tabular-nums', paddingBottom: 4 }}>
          {loading && isConnected ? '…' : formatUsd(categoryTotal)}
        </Text>
      </HStack>

      <VStack gap={0} paddingX={CONTENT_PADDING_X} width="100%">
        <Divider />
        <HoldingsList
          emptyMessage="No assets in this category."
          isConnected={isConnected}
          loading={loading}
          tokens={activeTokens}
        />
      </VStack>
    </VStack>
  );

  return <DashboardWithTradeRail>{content}</DashboardWithTradeRail>;
};
