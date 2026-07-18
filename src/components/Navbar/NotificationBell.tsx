import { useMemo, useState } from 'react';
import { IconButton } from '@coinbase/cds-web/buttons';
import { Icon } from '@coinbase/cds-web/icons';
import { Box, Divider, HStack, VStack } from '@coinbase/cds-web/layout';
import { PopoverPanel } from '@coinbase/cds-web/overlays';
import { Pressable } from '@coinbase/cds-web/system';
import { Text } from '@coinbase/cds-web/typography';
import type { AppAlert, AppAlertCategory } from '../../utils/healthAlerts';

type NotificationFilter = 'all' | AppAlertCategory;

/** Leave room for navbar + popover gap; extend panel to near the viewport bottom. */
const NOTIFICATIONS_PANEL_HEIGHT = 'calc(100vh - 80px)';

const FILTERS: Array<{ id: NotificationFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'price', label: 'Price alerts' },
  { id: 'custom', label: 'Custom alerts' },
];

const CATEGORY_LABEL: Record<AppAlertCategory, string> = {
  price: 'PRICE ALERT',
  custom: 'PORTFOLIO HEALTH',
  activity: 'ACCOUNT ACTIVITY',
};

type NotificationBellProps = {
  alerts: AppAlert[];
  unreadCount: number;
  onOpen: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (alertId: string) => void;
};

function formatAlertTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase();
}

function alertIconName(category: AppAlertCategory): 'priceAlerts' | 'profile' | 'sparkle' {
  if (category === 'price') return 'priceAlerts';
  if (category === 'activity') return 'profile';
  return 'sparkle';
}

function FilterPill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      background={active ? 'bgInverse' : 'bgSecondary'}
      borderRadius={1000}
      onClick={onPress}
      paddingX={2}
      paddingY={0.75}
    >
      <Text color={active ? 'fgInverse' : 'fg'} font="label1" noWrap>
        {label}
      </Text>
    </Pressable>
  );
}

function NotificationRow({
  alert,
  onPress,
}: {
  alert: AppAlert;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`${alert.title}. ${alert.body}`}
      background={alert.seen ? 'bg' : 'bgPrimaryWash'}
      onClick={onPress}
      width="100%"
    >
      <HStack alignItems="flex-start" gap={2} paddingX={2} paddingY={2} width="100%">
        <Box
          alignItems="center"
          background="bg"
          borderColor="bgLineHeavy"
          borderRadius={1000}
          borderWidth={100}
          display="flex"
          flexShrink={0}
          height={40}
          justifyContent="center"
          overflow="hidden"
          width={40}
        >
          <Icon color="fgMuted" name={alertIconName(alert.category)} size="s" />
        </Box>

        <VStack flexGrow={1} gap={0.5} minWidth={0}>
          <HStack alignItems="center" justifyContent="space-between" width="100%">
            <Text color="fgMuted" font="caption" style={{ letterSpacing: '0.04em' }}>
              {CATEGORY_LABEL[alert.category]}
            </Text>
            <Text color="fgMuted" font="caption">
              {formatAlertTime(alert.createdAt)}
            </Text>
          </HStack>
          <Text font="label1">{alert.title}</Text>
          <Text color="fgMuted" font="label2" numberOfLines={2}>
            {alert.body}
          </Text>
        </VStack>
      </HStack>
    </Pressable>
  );
}

function NotificationsPanel({
  alerts,
  filter,
  onFilterChange,
  onMarkRead,
}: {
  alerts: AppAlert[];
  filter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  onMarkRead: (alertId: string) => void;
}) {
  const visible = useMemo(() => {
    if (filter === 'all') return alerts;
    return alerts.filter((alert) => alert.category === filter);
  }, [alerts, filter]);

  return (
    <VStack gap={0} height="100%" width="100%">
      <HStack alignItems="center" justifyContent="space-between" paddingBottom={1.5} paddingTop={2} paddingX={2}>
        <Text font="title3">Notifications</Text>
        <IconButton
          accessibilityLabel="Notification settings"
          compact
          name="gear"
          transparent
          variant="secondary"
        />
      </HStack>

      <HStack alignItems="center" gap={1} paddingBottom={1.5} paddingX={2} width="100%">
        <HStack
          alignItems="center"
          flexGrow={1}
          gap={1}
          minWidth={0}
          overflow="auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {FILTERS.map((item) => (
            <FilterPill
              key={item.id}
              active={filter === item.id}
              label={item.label}
              onPress={() => onFilterChange(item.id)}
            />
          ))}
        </HStack>
        <Box
          alignItems="center"
          background="bgSecondary"
          borderRadius={1000}
          display="flex"
          flexShrink={0}
          height={32}
          justifyContent="center"
          width={32}
        >
          <Icon color="fgMuted" name="caretRight" size="s" />
        </Box>
      </HStack>

      <VStack flexGrow={1} minHeight={0} overflow="auto" width="100%">
        {visible.length === 0 ? (
          <Box padding={3} width="100%">
            <Text color="fgMuted" font="label2">
              No notifications yet. Portfolio health and BTC lag alerts show up here.
            </Text>
          </Box>
        ) : (
          visible.map((alert, index) => (
            <VStack key={alert.id} width="100%">
              {index > 0 ? <Divider /> : null}
              <NotificationRow alert={alert} onPress={() => onMarkRead(alert.id)} />
            </VStack>
          ))
        )}
      </VStack>
    </VStack>
  );
}

export function NotificationBell({
  alerts,
  unreadCount,
  onOpen,
  onMarkAllRead,
  onMarkRead,
}: NotificationBellProps) {
  const [filter, setFilter] = useState<NotificationFilter>('all');

  // Keep prop referenced for API compatibility (mark-all still available to parent).
  void onMarkAllRead;

  const trigger = (
    <Box position="relative">
      <IconButton
        accessibilityLabel={
          unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
        }
        name="bell"
      />
      {unreadCount > 0 ? (
        <Box
          alignItems="center"
          background="bgNegative"
          borderRadius={1000}
          display="flex"
          height={18}
          justifyContent="center"
          minWidth={18}
          paddingX={0.5}
          position="absolute"
          right={0}
          style={{ top: 0 }}
        >
          <Text color="fgInverse" font="caption" style={{ fontSize: 11, lineHeight: '14px' }}>
            {unreadCount}
          </Text>
        </Box>
      ) : null}
    </Box>
  );

  return (
    <PopoverPanel
      accessibilityLabel="Notifications"
      content={
        <NotificationsPanel
          alerts={alerts}
          filter={filter}
          onFilterChange={setFilter}
          onMarkRead={onMarkRead}
        />
      }
      contentPosition={{ placement: 'bottom-end', gap: 1.5 }}
      maxPanelHeight={NOTIFICATIONS_PANEL_HEIGHT}
      onOpen={onOpen}
      panelHeight={NOTIFICATIONS_PANEL_HEIGHT}
      panelWidth={380}
    >
      {trigger}
    </PopoverPanel>
  );
}
