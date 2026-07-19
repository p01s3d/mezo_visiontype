import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { Button } from '@coinbase/cds-web/buttons';
import { SelectOption } from '@coinbase/cds-web/controls';
import { Dropdown } from '@coinbase/cds-web/dropdown';
import { Pictogram } from '@coinbase/cds-web/illustrations';
import { Pressable } from '@coinbase/cds-web/system';
import { Avatar } from '@coinbase/cds-web/media';
import { useConnect, useConnection, useConnectors, useDisconnect } from 'wagmi';
import { truncateAddress } from '../../utils/wallet';

export const UserMenu = () => {
  const { address, isConnected, chain } = useConnection();
  const { mutate: connect, isPending } = useConnect();
  const { mutate: disconnect, isPending: isDisconnecting } = useDisconnect();
  const connectors = useConnectors();

  if (!isConnected) {
    return (
    <Dropdown
      content={
        <VStack>
          <Box padding={2}>
            <Text as="label" font="caption">
              Connect a wallet
            </Text>
          </Box>
          {connectors.map((connector) => (
            <SelectOption
              key={connector.id}
              description={`Connect via ${connector.name}`}
              media={<Pictogram name="wallet" />}
              onClick={() => connect({ connector })}
              title={connector.name}
              value={connector.id}
            />
          ))}
        </VStack>
      }
      value=""
      width={300}
    >
      <Button borderRadius={200} compact loading={isPending} variant="primary">
        Connect wallet
      </Button>
    </Dropdown>
    );
  }

  const walletMenu = (
    <VStack>
      <Box padding={2}>
        <Text as="label" font="caption">
          Connected wallet
        </Text>
        <Text font="label2" color="fgMuted">
          {chain?.name ?? 'Unknown network'}
        </Text>
      </Box>
      <SelectOption
        description="Copy or view in explorer"
        media={<Pictogram name="wallet" />}
        title={truncateAddress(address!)}
        value="address"
      />
      <Box paddingX={2} paddingY={1}>
        <Button
          compact
          loading={isDisconnecting}
          onClick={() => disconnect()}
          variant="secondary"
          width="100%"
        >
          Disconnect
        </Button>
      </Box>
    </VStack>
  );

  return (
    <Dropdown content={walletMenu} value="wallet" width={300}>
      <Pressable background="transparent">
        <HStack alignItems="center" gap={1}>
          <Avatar alt="Wallet" src={`https://api.dicebear.com/7.x/identicon/svg?seed=${address}`} />
          <Text as="h2" font="headline">
            {truncateAddress(address!)}
          </Text>
        </HStack>
      </Pressable>
    </Dropdown>
  );
};
