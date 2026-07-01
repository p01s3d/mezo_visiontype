import { Card, CardBody } from '@coinbase/cds-web/cards';
import { HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { Icon } from '@coinbase/cds-web/icons';
import { formatEther } from 'viem';
import { useBalance, useConnection } from 'wagmi';
import type { WalletToken } from '../../api/walletTypes';
import { truncateAddress } from '../../utils/wallet';
import { formatUsd } from '../../utils/format';
import { formatTokenAmount } from '../../utils/tokenHoldings';

type WalletSummaryProps = {
  totalBalanceUsd: number | null;
  positionCount: number;
  tokenCount: number;
  topToken: WalletToken | null;
  personalLoading: boolean;
};

export const WalletSummary = ({
  totalBalanceUsd,
  positionCount,
  tokenCount,
  topToken,
  personalLoading,
}: WalletSummaryProps) => {
  const { address, isConnected, chain } = useConnection();
  const { data: balance, isLoading } = useBalance({ address });

  if (!isConnected || !address) {
    return (
      <Card>
        <CardBody
          paddingX={2}
          paddingY={2}
          title="Your wallet"
          description="Connect a wallet to view your balance and track personal positions."
          media={<Icon name="wallet" size="l" />}
        />
      </Card>
    );
  }

  const formattedBalance =
    balance && !isLoading ? `${Number(formatEther(balance.value)).toFixed(4)} ${balance.symbol}` : '…';

  return (
    <Card>
      <CardBody
        paddingX={2}
        paddingY={2}
        title={truncateAddress(address)}
        description={chain?.name ?? 'Connected'}
        media={<Icon name="wallet" size="l" />}
      />
      <VStack gap={1} paddingX={2} paddingBottom={2}>
        <HStack alignItems="center" justifyContent="space-between">
          <Text font="label2" color="fgMuted">
            Native balance
          </Text>
          <Text font="title3">{formattedBalance}</Text>
        </HStack>
        <HStack alignItems="center" justifyContent="space-between">
          <Text font="label2" color="fgMuted">
            Total net worth
          </Text>
          <Text font="title3">
            {personalLoading || totalBalanceUsd === null ? '…' : formatUsd(totalBalanceUsd)}
          </Text>
        </HStack>
        <HStack alignItems="center" justifyContent="space-between">
          <Text font="label2" color="fgMuted">
            Tokens
          </Text>
          <Text font="title3">{personalLoading ? '…' : tokenCount}</Text>
        </HStack>
        <HStack alignItems="center" justifyContent="space-between">
          <Text font="label2" color="fgMuted">
            DeFi positions
          </Text>
          <Text font="title3">{personalLoading ? '…' : positionCount}</Text>
        </HStack>
        {topToken ? (
          <HStack alignItems="center" justifyContent="space-between">
            <Text font="label2" color="fgMuted">
              Top holding
            </Text>
            <Text font="title3">
              {formatTokenAmount(topToken.amount)} {topToken.symbol}
            </Text>
          </HStack>
        ) : null}
      </VStack>
    </Card>
  );
};
