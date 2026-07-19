import { useMemo, useState } from 'react';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Pressable } from '@coinbase/cds-web/system';
import { Text } from '@coinbase/cds-web/typography';
import { DEMO_NET_WORTH_USD, DEMO_WALLET_TOKENS } from '../../../data/demoPortfolio';
import {
  groupTokensByCategory,
  TOKEN_CATEGORY_ORDER,
  TOKEN_CATEGORY_TAB_LABELS,
  type TokenCategory,
} from '../../../utils/tokenCategories';
import { DashboardSectionDivider } from '../../Home/TradeRail';
import { HoldingsList } from '../../Home/HoldingsList';
import { RollingUsdBalance } from '../../Home/RollingUsdBalance';

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

export function HoldingsPreview() {
  const groups = groupTokensByCategory(DEMO_WALLET_TOKENS);
  const [activeCategory, setActiveCategory] = useState<TokenCategory>('layer1');
  const activeTokens = groups[activeCategory];
  const categoryTotal = activeTokens.reduce((sum, token) => sum + token.valueUsd, 0);
  const visibleTabs = useMemo(
    () => TOKEN_CATEGORY_ORDER.filter((category) => groups[category].length > 0),
    [groups],
  );

  return (
    <Box minWidth={0} overflow="hidden" width="100%">
      <VStack gap={0} width="100%">
        <VStack flexShrink={0} gap={0.5} paddingBottom={1.5} width="100%">
          <RollingUsdBalance font="display2" value={DEMO_NET_WORTH_USD} />
          <Text color="fgMuted" font="label2">
            Sample portfolio — connect wallet to see yours
          </Text>
        </VStack>

        <HStack alignItems="flex-end" flexShrink={0} gap={3} paddingBottom={0} width="100%">
          {visibleTabs.map((category) => (
            <CategoryTab
              key={category}
              active={activeCategory === category}
              label={TOKEN_CATEGORY_TAB_LABELS[category]}
              onSelect={() => setActiveCategory(category)}
            />
          ))}
        </HStack>

        <Box flexShrink={0} style={{ marginTop: -1 }} width="100%">
          <DashboardSectionDivider />
        </Box>

        <Box flexShrink={0} paddingBottom={0.5} paddingTop={1} width="100%">
          <RollingUsdBalance
            font="title2"
            style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 300 }}
            value={categoryTotal}
          />
        </Box>

        <Box flexGrow={1} minHeight={0} overflow="hidden" width="100%">
          <HoldingsList isConnected={false} tokens={activeTokens} />
        </Box>
      </VStack>
    </Box>
  );
}
