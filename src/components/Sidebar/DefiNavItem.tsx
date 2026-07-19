import { useState } from 'react';
import { Box, HStack } from '@coinbase/cds-web/layout';
import { Tooltip } from '@coinbase/cds-web/overlays';
import { Pressable } from '@coinbase/cds-web/system';
import { Text } from '@coinbase/cds-web/typography';
import { getNavAnimation, type NavEntry } from '../../data/navConfig';
import { AnimatedNavIcon } from './AnimatedNavIcon';

type DefiNavItemProps = {
  entry: NavEntry;
  active: boolean;
  collapsed: boolean;
  onSelect: () => void;
};

export const DefiNavItem = ({ entry, active, collapsed, onSelect }: DefiNavItemProps) => {
  const [hovered, setHovered] = useState(false);

  const item = (
    <Pressable
      accessibilityLabel={collapsed ? entry.title : undefined}
      aria-current={active ? 'page' : undefined}
      background={active ? 'bgAlternate' : 'transparent'}
      borderRadius={300}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      transparentWhileInactive={!active}
      width="100%"
    >
      <HStack
        alignItems="center"
        gap={collapsed ? 0 : 2}
        justifyContent={collapsed ? 'center' : 'flex-start'}
        paddingX={collapsed ? 1 : 2}
        paddingY={1.5}
        width="100%"
      >
        <AnimatedNavIcon
          active={active}
          animationData={getNavAnimation(entry.id)}
          hovered={hovered}
        />
        {!collapsed ? (
          <Text color="fg" font="headline" style={{ fontWeight: active ? 500 : 400 }}>
            {entry.title}
          </Text>
        ) : null}
      </HStack>
    </Pressable>
  );

  if (!collapsed) return item;

  return (
    <Tooltip content={entry.title} placement="right">
      <Box width="100%">
        {item}
      </Box>
    </Tooltip>
  );
};
