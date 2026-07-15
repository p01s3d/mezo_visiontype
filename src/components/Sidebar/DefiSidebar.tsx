import { useState } from 'react';
import { IconButton } from '@coinbase/cds-web/buttons';
import { Box } from '@coinbase/cds-web/layout';
import { Sidebar } from '@coinbase/cds-web/navigation';
import { Text } from '@coinbase/cds-web/typography';
import { CDSLogo } from '../CDSLogo';
import { EARN_NAV, MAIN_NAV } from '../../data/navConfig';
import { DefiNavItem } from './DefiNavItem';

type DefiSidebarProps = {
  activeIndex: number;
  onSelect: (index: number) => void;
};

function EarnSectionLabel({ collapsed }: { collapsed: boolean }) {
  if (collapsed) return null;

  return (
    <Box paddingBottom={0.5} paddingTop={2} paddingX={2} width="100%">
      <Text
        color="fgMuted"
        font="label2"
        style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
      >
        Earn
      </Text>
    </Box>
  );
}

export const DefiSidebar = ({ activeIndex, onSelect }: DefiSidebarProps) => {
  const [collapsed, setCollapsed] = useState(true);
  const mainEnd = MAIN_NAV.length;

  return (
    <Sidebar
      autoCollapse
      collapsed={collapsed}
      flexShrink={0}
      height="100%"
      logo={(isCollapsed) => <CDSLogo compact={isCollapsed} />}
      renderEnd={(isCollapsed) => (
        <IconButton
          accessibilityLabel={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          name={isCollapsed ? 'caretExpand' : 'caretCollapse'}
          onClick={() => setCollapsed((value) => !value)}
        />
      )}
    >
      {MAIN_NAV.map((entry, index) => (
        <DefiNavItem
          key={entry.id}
          active={activeIndex === index}
          collapsed={collapsed}
          entry={entry}
          onSelect={() => onSelect(index)}
        />
      ))}
      <EarnSectionLabel collapsed={collapsed} />
      {EARN_NAV.map((entry, index) => {
        const navIndex = mainEnd + index;
        return (
          <DefiNavItem
            key={entry.id}
            active={activeIndex === navIndex}
            collapsed={collapsed}
            entry={entry}
            onSelect={() => onSelect(navIndex)}
          />
        );
      })}
    </Sidebar>
  );
};
