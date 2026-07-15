import { useMemo } from 'react';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { Icon } from '@coinbase/cds-web/icons';
import type { IconName } from '@coinbase/cds-common/types/IconName';
import type { WalletToken } from '../../api/walletTypes';
import { DEMO_WALLET_TOKENS } from '../../data/demoPortfolio';
import {
  categoryTotals,
  portfolioTotalUsd,
  TOKEN_CATEGORY_LABELS,
  TOKEN_CATEGORY_ORDER,
  type TokenCategory,
} from '../../utils/tokenCategories';
import { formatUsd } from '../../utils/format';
import { HomePressableRow } from './HomePressableRow';

const CATEGORY_ICONS: Record<TokenCategory, IconName> = {
  stablecoins: 'cashUSD',
  layer1: 'chartLine',
  defi: 'defi',
};

type BalanceBreakdownProps = {
  walletTokens: WalletToken[];
  loading: boolean;
  isConnected: boolean;
  bleedX?: 0 | 2;
};

type BreakdownRowProps = {
  icon: IconName;
  label: string;
  balance: number;
  sharePct: number;
  loading: boolean;
  bleedX: 0 | 2;
};

const BreakdownRow = ({ icon, label, balance, sharePct, loading, bleedX }: BreakdownRowProps) => (
  <HomePressableRow accessibilityLabel={`${label}, ${formatUsd(balance)}`} bleedX={bleedX}>
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
        <VStack gap={0}>
          <Text font="headline">{label}</Text>
          <Text color="fgMuted" font="label2">
            {loading ? '…' : `${sharePct}% of portfolio`}
          </Text>
        </VStack>
      </HStack>
      <Text font="headline">{loading ? '…' : formatUsd(balance)}</Text>
    </HStack>
  </HomePressableRow>
);

export const BalanceBreakdown = ({
  walletTokens,
  loading,
  isConnected,
  bleedX = 2,
}: BalanceBreakdownProps) => {
  const tokens = isConnected ? walletTokens : DEMO_WALLET_TOKENS;

  const rows = useMemo(() => {
    const totals = categoryTotals(tokens);
    const total = portfolioTotalUsd(tokens);

    return TOKEN_CATEGORY_ORDER.map((category) => {
      const balance = totals[category];
      const sharePct = total > 0 ? Math.round((balance / total) * 100) : 0;
      return {
        category,
        icon: CATEGORY_ICONS[category],
        label: TOKEN_CATEGORY_LABELS[category],
        balance,
        sharePct,
      };
    }).filter((row) => row.balance > 0 || !isConnected);
  }, [tokens, isConnected]);

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
          key={row.category}
          balance={row.balance}
          bleedX={bleedX}
          icon={row.icon}
          label={row.label}
          loading={loading && isConnected}
          sharePct={row.sharePct}
        />
      ))}
    </VStack>
  );
};
