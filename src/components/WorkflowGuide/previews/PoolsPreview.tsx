import { Box, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { DEMO_POOL_POSITIONS, DEMO_POOLS_TOTAL_USD } from '../../../data/demoPools';
import { PoolsList } from '../../Home/PoolsList';
import { RollingUsdBalance } from '../../Home/RollingUsdBalance';

export function PoolsPreview() {
  return (
    <Box minWidth={0} overflow="hidden" width="100%">
      <VStack gap={0} width="100%">
        <VStack flexShrink={0} gap={0.5} paddingBottom={1.5} width="100%">
          <RollingUsdBalance font="display2" value={DEMO_POOLS_TOTAL_USD} />
          <Text color="fgMuted" font="label2">
            Sample pools — connect wallet to see yours
          </Text>
        </VStack>

        <Box flexGrow={1} minHeight={0} overflow="hidden" width="100%">
          <PoolsList isConnected={false} pools={DEMO_POOL_POSITIONS} />
        </Box>
      </VStack>
    </Box>
  );
}
