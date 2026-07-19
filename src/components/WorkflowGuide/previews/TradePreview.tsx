import { Box } from '@coinbase/cds-web/layout';
import { TradePanel } from '../../Home/TradePanel';

export function TradePreview() {
  return (
    <Box minWidth={0} width="100%">
      <TradePanel bleedX={0} />
    </Box>
  );
}
