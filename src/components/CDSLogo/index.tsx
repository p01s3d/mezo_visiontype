import { HStack } from '@coinbase/cds-web/layout';
import { Icon } from '@coinbase/cds-web/icons';
import { Text } from '@coinbase/cds-web/typography';

export const CDSLogo = () => {
  return (
    <HStack alignItems="center" gap={1} paddingX={1}>
      <Icon name="defi" size="m" color="fgPrimary" />
      <Text font="label1" color="fgPrimary">
        DeFi
      </Text>
    </HStack>
  );
};
