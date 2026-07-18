import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { Icon } from '@coinbase/cds-web/icons';
import { HomePressableRow } from './HomePressableRow';
import { TokenIcon } from './TokenIcon';

const ICON_COLUMN_WIDTH = 40;

type AssetSelectorListProps = {
  payWithLabel: string;
  payWithSubtitle: string;
  assetActionLabel: string;
  assetSubtitle: string;
  assetSymbol?: string;
  bleedX?: 0 | 3;
};

type AssetSelectorRowProps = {
  title: string;
  subtitle: string;
  onPress?: () => void;
  bleedX: 0 | 3;
};

const AssetSelectorRow = ({ title, subtitle, onPress, bleedX }: AssetSelectorRowProps) => (
  <HomePressableRow accessibilityLabel={`${title}, ${subtitle}`} bleedX={bleedX} onPress={onPress} paddingY={2}>
    <HStack alignItems="center" gap={2} justifyContent="space-between" width="100%">
      <VStack flexGrow={1} gap={0} minWidth={0}>
        <Text font="headline">{title}</Text>
        <Text color="fgMuted" font="body">
          {subtitle}
        </Text>
      </VStack>
      <Icon color="fgMuted" name="caretRight" size="s" />
    </HStack>
  </HomePressableRow>
);

export const AssetSelectorList = ({
  payWithLabel,
  payWithSubtitle,
  assetActionLabel,
  assetSubtitle,
  assetSymbol = 'BTC',
  bleedX = 3,
}: AssetSelectorListProps) => (
  <HStack alignItems="stretch" gap={2} width="100%">
    <VStack flexShrink={0} width={ICON_COLUMN_WIDTH}>
      <VStack alignItems="center" flexGrow={1} justifyContent="center" minHeight={0} width="100%">
        <TokenIcon
          size="xl"
          source="https://assets.coincap.io/assets/icons/usdc@2x.png"
          symbol="USD"
        />
        <Box background="bgLine" flexGrow={1} minHeight={4} width={2} />
      </VStack>
      <VStack alignItems="center" flexGrow={1} justifyContent="center" minHeight={0} width="100%">
        <Box background="bgLine" flexGrow={1} minHeight={4} width={2} />
        <TokenIcon size="xl" symbol={assetSymbol} />
      </VStack>
    </VStack>
    <VStack flexGrow={1} gap={0} minWidth={0}>
      <AssetSelectorRow bleedX={bleedX} subtitle={payWithSubtitle} title={payWithLabel} />
      <AssetSelectorRow bleedX={bleedX} subtitle={assetSubtitle} title={assetActionLabel} />
    </VStack>
  </HStack>
);
