import { useState } from 'react';
import { Box, Divider, HStack, VStack } from '@coinbase/cds-web/layout';
import { Pressable } from '@coinbase/cds-web/system';
import { Text } from '@coinbase/cds-web/typography';
import { DEMO_NET_WORTH_USD, DEMO_WALLET_TOKENS } from '../../../data/demoPortfolio';
import {
  groupTokensByCategory,
  TOKEN_CATEGORY_ORDER,
  TOKEN_CATEGORY_TAB_LABELS,
  type TokenCategory,
} from '../../../utils/tokenCategories';
import { formatUsd } from '../../../utils/format';
import { HoldingsList } from '../../Home/HoldingsList';
import { GUIDE_PREVIEW_HEIGHT } from '../previewConstants';

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
    <Pressable flexGrow={1} minWidth={0} onClick={onSelect} paddingBottom={1} paddingTop={0.5}>
      <VStack gap={0.75} width="100%">
        <Text color={active ? 'fg' : 'fgMuted'} font="headline" style={{ textAlign: 'center' }}>
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

export function HoldingsPreview() {
  const groups = groupTokensByCategory(DEMO_WALLET_TOKENS);
  const [activeCategory, setActiveCategory] = useState<TokenCategory>('layer1');
  const activeTokens = groups[activeCategory];
  const categoryTotal = activeTokens.reduce((sum, token) => sum + token.valueUsd, 0);

  return (
    <Box height={GUIDE_PREVIEW_HEIGHT} minWidth={0} overflow="hidden" width="100%">
      <VStack gap={0} height="100%" width="100%">
        <VStack flexShrink={0} gap={0.5} paddingBottom={1.5} width="100%">
          <Text font="display2">{formatUsd(DEMO_NET_WORTH_USD)}</Text>
          <Text color="fgMuted" font="label2">
            Sample portfolio
          </Text>
        </VStack>

        <HStack
          alignItems="flex-end"
          flexShrink={0}
          gap={2}
          justifyContent="space-between"
          paddingBottom={1}
          width="100%"
        >
          <HStack alignItems="flex-end" flexGrow={1} gap={2} minWidth={0} width="100%">
            {TOKEN_CATEGORY_ORDER.map((category) => (
              <CategoryTab
                key={category}
                active={activeCategory === category}
                label={TOKEN_CATEGORY_TAB_LABELS[category]}
                onSelect={() => setActiveCategory(category)}
              />
            ))}
          </HStack>
          <Box flexShrink={0} minWidth={96} style={{ textAlign: 'right' }}>
            <Text font="title3" style={{ fontVariantNumeric: 'tabular-nums', paddingBottom: 4 }}>
              {formatUsd(categoryTotal)}
            </Text>
          </Box>
        </HStack>

        <Divider />
        <Box flexGrow={1} minHeight={0} overflow="hidden" width="100%">
          <HoldingsList tokens={activeTokens} />
        </Box>
      </VStack>
    </Box>
  );
};
