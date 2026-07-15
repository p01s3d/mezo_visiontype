import { IconButton } from '@coinbase/cds-web/buttons';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Pressable } from '@coinbase/cds-web/system';
import { Text } from '@coinbase/cds-web/typography';
import { Pictogram } from '@coinbase/cds-web/illustrations';
import { stopRowPress } from './HomePressableRow';

type ForYouCardProps = {
  title: string;
  description: string;
  pictogram: 'recurringPurchases' | 'ethStaking';
  onDismiss?: () => void;
  onPress?: () => void;
};

export const ForYouCard = ({
  title,
  description,
  pictogram,
  onDismiss,
  onPress,
}: ForYouCardProps) => {
  return (
    <Pressable
      accessibilityLabel={`${title}. ${description}`}
      background="bgPrimaryWash"
      borderRadius={500}
      flexBasis={0}
      flexGrow={1}
      flexShrink={1}
      minWidth={0}
      onClick={onPress}
      position="relative"
    >
      <HStack alignItems="flex-start" gap={2} padding={2} paddingEnd={onDismiss ? 5 : 2}>
        <Box flexShrink={0} paddingTop={0.25}>
          <Pictogram dimension="48x48" name={pictogram} />
        </Box>
        <VStack flexGrow={1} gap={0.5} minWidth={0} paddingTop={0.25}>
          <Text font="headline">{title}</Text>
          <Text color="fgMuted" font="label2" numberOfLines={2}>
            {description}
          </Text>
        </VStack>
      </HStack>
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
