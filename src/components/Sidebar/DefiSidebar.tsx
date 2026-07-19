import { useState } from 'react';
import { IconButton } from '@coinbase/cds-web/buttons';
import { Sidebar } from '@coinbase/cds-web/navigation';
import { CDSLogo } from '../CDSLogo';
import { EARN_NAV, MAIN_NAV } from '../../data/navConfig';
import { DefiNavItem } from './DefiNavItem';

type DefiSidebarProps = {
  activeIndex: number;
  onSelect: (index: number) => void;
};

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
