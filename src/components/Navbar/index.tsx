'use client';
import { useEffect, useRef, useState } from 'react';
import { HStack } from '@coinbase/cds-web/layout';
import { NavigationBar, NavigationTitle } from '@coinbase/cds-web/navigation';
import { useTheme } from '@coinbase/cds-web';
import { IconButton } from '@coinbase/cds-web/buttons';
import { useToast } from '@coinbase/cds-web/overlays/useToast';
import { UserMenu } from './UserMenu';
import { NotificationBell } from './NotificationBell';
import { FetchStatusToast } from './FetchStatusToast';
import type { AppAlert } from '../../utils/healthAlerts';

export const Navbar = ({
  title,
  toggleColorScheme,
  alerts = [],
  unreadAlertCount = 0,
  toastAlert = null,
  onMarkAlertsRead,
  onMarkAlertRead,
  onClearToast,
  onRefresh,
  refreshing = false,
}: {
  title?: React.ReactNode;
  toggleColorScheme?: () => void;
  alerts?: AppAlert[];
  unreadAlertCount?: number;
  toastAlert?: AppAlert | null;
  onMarkAlertsRead?: () => void;
  onMarkAlertRead?: (alertId: string) => void;
  onClearToast?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}) => {
  const theme = useTheme();
  const isDark = theme.activeColorScheme === 'dark';
  const toast = useToast();
  const [showFetchToast, setShowFetchToast] = useState(false);
  const sawRefreshing = useRef(false);

  useEffect(() => {
    if (!toastAlert) return;
    toast.show(toastAlert.title, {
      action: {
        label: 'Inbox',
        onPress: () => {
          onMarkAlertRead?.(toastAlert.id);
        },
      },
    });
    onClearToast?.();
    // Intentionally only re-fire when a new toast alert id arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toastAlert?.id]);

  useEffect(() => {
    if (!showFetchToast) return;
    if (refreshing) {
      sawRefreshing.current = true;
      return;
    }
    if (sawRefreshing.current) {
      sawRefreshing.current = false;
      setShowFetchToast(false);
    }
  }, [refreshing, showFetchToast]);

  return (
    <>
      <FetchStatusToast visible={showFetchToast} />
      <NavigationBar
        end={
          <HStack alignItems="center" gap={1}>
            <NotificationBell
              alerts={alerts}
              onMarkAllRead={() => onMarkAlertsRead?.()}
              onMarkRead={(id) => onMarkAlertRead?.(id)}
              onOpen={() => onMarkAlertsRead?.()}
              unreadCount={unreadAlertCount}
            />
            <IconButton onClick={toggleColorScheme} name={isDark ? 'moon' : 'light'} />
            {onRefresh ? (
              <IconButton
                accessibilityLabel={refreshing ? 'Refreshing' : 'Refresh'}
                disabled={refreshing}
                loading={refreshing}
                name="refresh"
                onClick={() => {
                  setShowFetchToast(true);
                  onRefresh();
                }}
              />
            ) : null}
            <UserMenu />
          </HStack>
        }
      >
        <NavigationTitle>{title}</NavigationTitle>
      </NavigationBar>
    </>
  );
};
