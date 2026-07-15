import { Box } from '@coinbase/cds-web/layout';
import { TradePanel } from '../../Home/TradePanel';

export function TradePreview() {
  return (
    <Box width="100%">
      <TradePanel bleedX={0} />
    </Box>
  );
}
