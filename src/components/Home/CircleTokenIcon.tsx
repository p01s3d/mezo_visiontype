import { Box } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { Icon } from '@coinbase/cds-web/icons';
import type { IconName } from '@coinbase/cds-common/types/IconName';

type CircleTokenIconProps = {
  background: string;
  label?: string;
  icon?: IconName;
  iconColor?: string;
};

export const CircleTokenIcon = ({
  background,
  label,
  icon,
  iconColor = '#FFFFFF',
}: CircleTokenIconProps) => (
  <Box
    alignItems="center"
    borderRadius={1000}
    display="flex"
    flexShrink={0}
    height={40}
    justifyContent="center"
    style={{ background }}
    width={40}
  >
    {icon ? (
      <Icon name={icon} size="s" style={{ color: iconColor }} />
    ) : (
      <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 600 }}>{label}</Text>
    )}
  </Box>
);
