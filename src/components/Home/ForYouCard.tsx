import { IconButton, Button } from '@coinbase/cds-web/buttons';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Pressable } from '@coinbase/cds-web/system';
import { Text } from '@coinbase/cds-web/typography';
import { Pictogram } from '@coinbase/cds-web/illustrations';
import type { ConfidenceLevel, VerdictType } from '../../types/positionHealth';
import { HealthIndicator, verdictTooltip } from './HealthIndicator';
import { stopRowPress } from './HomePressableRow';

type ForYouCardProps = {
  /** Token name or LP position name */
  title: string;
  /** Verdict reasoning — shown up to 3 lines */
  description: string;
  pictogram: 'recurringPurchases' | 'ethStaking';
  verdict?: VerdictType;
  confidence?: ConfidenceLevel;
  /** AI headline used for tooltip context */
  headline?: string;
  actionUrl?: string;
  actionLabel?: string;
  onDismiss?: () => void;
  onPress?: () => void;
};

export const ForYouCard = ({
  title,
  description,
  pictogram,
  verdict,
  confidence,
  headline,
  actionUrl,
  actionLabel,
  onDismiss,
  onPress,
}: ForYouCardProps) => {
  const tooltip =
    verdict && confidence
      ? verdictTooltip({
          headline: headline ?? title,
          reasoning: description,
          confidence,
        })
      : description;

  return (
    <Pressable
      accessibilityLabel={`${title}. ${description}`}
      background="bgPrimaryWash"
      borderRadius={500}
      minWidth={0}
      onClick={onPress}
      position="relative"
      width="100%"
    >
      <VStack gap={1.5} padding={2} paddingEnd={onDismiss ? 5 : 2} width="100%">
        <HStack alignItems="flex-start" gap={2} width="100%">
          <Box flexShrink={0} paddingTop={0.25}>
            <Pictogram dimension="48x48" name={pictogram} />
          </Box>
          <VStack flexGrow={1} gap={0.5} minWidth={0} paddingTop={0.25}>
            {verdict ? <HealthIndicator tooltip={tooltip} verdict={verdict} /> : null}
            <Text font="headline" numberOfLines={1}>
              {title}
            </Text>
            <Text color="fgMuted" font="label2" numberOfLines={3}>
              {description}
            </Text>
          </VStack>
        </HStack>
        {actionUrl ? (
          <Box alignSelf="flex-end">
            <Button
              compact
              endIcon="externalLink"
              onClick={(event) => {
                stopRowPress(event);
                window.open(actionUrl, '_blank', 'noopener,noreferrer');
              }}
              variant="secondary"
            >
              {actionLabel ?? 'Open in DEX'}
            </Button>
          </Box>
        ) : null}
      </VStack>
      {onDismiss ? (
        <Box position="absolute" right={8} top={8} zIndex={1}>
          <IconButton
            accessibilityLabel={`Dismiss ${title}`}
            compact
            iconSize="xs"
            name="close"
            onClick={(event) => {
              stopRowPress(event);
              onDismiss();
            }}
            transparent
            variant="secondary"
          />
        </Box>
      ) : null}
    </Pressable>
  );
};

export const ForYouCardSkeleton = () => (
  <Box background="bgPrimaryWash" borderRadius={500} minWidth={0} padding={2} width="100%">
    <HStack alignItems="flex-start" gap={2} width="100%">
      <Box
        background="bgAlternate"
        borderRadius={1000}
        flexShrink={0}
        height={48}
        width={48}
      />
      <VStack flexGrow={1} gap={1} minWidth={0}>
        <Box background="bgAlternate" borderRadius={200} height={20} width="28%" />
        <Box background="bgAlternate" borderRadius={200} height={16} width="88%" />
        <Box background="bgAlternate" borderRadius={200} height={14} width="100%" />
        <Box background="bgAlternate" borderRadius={200} height={14} width="72%" />
      </VStack>
    </HStack>
  </Box>
);

export const FOR_YOU_GRID_STYLE = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16,
  width: '100%',
} as const;

export const FOR_YOU_CARD_COUNT = 4;
