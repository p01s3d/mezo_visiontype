'use client';
import { HStack } from '@coinbase/cds-web/layout';
import { NavigationBar, NavigationTitle } from '@coinbase/cds-web/navigation';
import { UserMenu } from './UserMenu';
import { IconButton } from '@coinbase/cds-web/buttons';
import { useTheme } from '@coinbase/cds-web';

export const Navbar = ({
  title,
  toggleColorScheme,
}: {
  title?: React.ReactNode;
  toggleColorScheme?: () => void;
}) => {
  const theme = useTheme();
  const isDark = theme.activeColorScheme === 'dark';
  return (
    <NavigationBar
      end={
        <HStack alignItems="center" gap={1}>
          <IconButton onClick={toggleColorScheme} name={isDark ? 'moon' : 'light'} />
          <UserMenu />
        </HStack>
      }
    >
      <NavigationTitle>{title}</NavigationTitle>
    </NavigationBar>
  );
};
