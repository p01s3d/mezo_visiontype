import { useMemo } from 'react';
import { Box, Fallback, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { Icon } from '@coinbase/cds-web/icons';
import type { IconName } from '@coinbase/cds-common/types/IconName';
import type { GroupedPoolPosition, WalletToken } from '../../api/walletTypes';
import type { WalletDataMode } from '../../data/portfolioSnapshot';
import {
  categoryTotals,
  TOKEN_CATEGORY_LABELS,
  TOKEN_CATEGORY_ORDER,
  type TokenCategory,
} from '../../utils/tokenCategories';
import { poolsTotalUsd } from '../../utils/groupPoolPositions';
import { formatUsd } from '../../utils/format';
import { HomePressableRow } from './HomePressableRow';

const ALLOCATION_SKELETON_ROWS = 4;

const AllocationRowSkeleton = ({ index }: { index: number }) => (
  <HStack
    alignItems="center"
    gap={3}
    justifyContent="space-between"
    paddingX={2}
    paddingY={1.5}
    width="100%"
  >
    <HStack alignItems="center" flexGrow={1} gap={1.5} minWidth={0}>
      <Fallback height={40} shape="circle" width={40} />
      <Fallback disableRandomRectWidth height={16} rectWidthVariant={index} width={96} />
    </HStack>
    <Fallback disableRandomRectWidth height={16} rectWidthVariant={index + 2} width={64} />
  </HStack>
);

const CATEGORY_ICONS: Record<TokenCategory, IconName> = {
  stablecoins: 'cashUSD',
  layer1: 'chartLine',
  defi: 'defi',
};

export type AllocationDestination = TokenCategory | 'liquidity-pools';

type BalanceBreakdownProps = {
  walletTokens: WalletToken[];
  poolPositions: GroupedPoolPosition[];
  loading: boolean;
  dataMode: WalletDataMode;
  bleedX?: 0 | 2;
  onNavigate?: (destination: AllocationDestination) => void;
};

type BreakdownRowProps = {
  icon: IconName;
  label: string;
  balance: number;
  bleedX: 0 | 2;
  onPress?: () => void;
};

const BreakdownRow = ({ icon, label, balance, bleedX, onPress }: BreakdownRowProps) => (
  <HomePressableRow
    accessibilityLabel={`${label}, ${formatUsd(balance)}`}
    bleedX={bleedX}
    onPress={onPress}
  >
    <HStack alignItems="center" gap={3} justifyContent="space-between" width="100%">
      <HStack alignItems="center" flexGrow={1} gap={1.5} minWidth={0}>
        <Box
          alignItems="center"
          background="bgAlternate"
          borderRadius={1000}
          display="flex"
          height={40}
          justifyContent="center"
          width={40}
        >
          <Icon color="fgMuted" name={icon} size="s" />
        </Box>
        <Text font="headline">{label}</Text>
      </HStack>
      <HStack alignItems="center" flexShrink={0} gap={1}>
        <Text font="headline">{formatUsd(balance)}</Text>
        <Icon color="fgMuted" name="caretRight" size="s" />
      </HStack>
    </HStack>
  </HomePressableRow>
);

export const BalanceBreakdown = ({
  walletTokens,
  poolPositions,
  loading,
  dataMode,
  bleedX = 2,
  onNavigate,
}: BalanceBreakdownProps) => {
  const showZeros = dataMode === 'demo' || dataMode === 'empty';

  const rows = useMemo(() => {
    const totals = categoryTotals(walletTokens);
    const poolsTotal = poolsTotalUsd(poolPositions);

    const tokenRows = TOKEN_CATEGORY_ORDER.map((category) => {
      const balance = totals[category];
      return {
        key: category as AllocationDestination,
        icon: CATEGORY_ICONS[category],
        label: TOKEN_CATEGORY_LABELS[category],
        balance,
      };
    }).filter((row) => row.balance > 0 || showZeros);

    const poolRow = {
      key: 'liquidity-pools' as const,
      icon: 'defi' as IconName,
      label: 'Liquidity pools',
      balance: poolsTotal,
    };

    return poolsTotal > 0 || showZeros ? [...tokenRows, poolRow] : tokenRows;
  }, [walletTokens, poolPositions, showZeros]);

  if (loading && dataMode !== 'demo') {
    return (
      <VStack aria-busy aria-label="Loading allocations" gap={0} role="status" width="100%">
        {Array.from({ length: ALLOCATION_SKELETON_ROWS }, (_, index) => (
          <AllocationRowSkeleton key={index} index={index} />
        ))}
      </VStack>
    );
  }

  if (rows.length === 0) {
    return (
      <Text color="fgMuted" font="label2" paddingY={1}>
        No holdings to break down yet.
      </Text>
    );
  }

  return (
    <VStack gap={0} width="100%">
      {rows.map((row) => (
        <BreakdownRow
          key={row.key}
          balance={row.balance}
          bleedX={bleedX}
          icon={row.icon}
          label={row.label}
          onPress={onNavigate ? () => onNavigate(row.key) : undefined}
        />
      ))}
    </VStack>
  );
};
