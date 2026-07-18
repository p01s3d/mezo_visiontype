import type { ReactNode } from 'react';
import { Box } from '@coinbase/cds-web/layout';
import { ExpandedNavPreview } from './ExpandedNavPreview';
import { HoldingsPreview } from './HoldingsPreview';
import { HomePreview } from './HomePreview';
import { IconsPreview } from './IconsPreview';
import { PoolsPreview } from './PoolsPreview';
import { PricesTablePreview } from './PricesTablePreview';
import { TradePreview } from './TradePreview';
import { TransactionsPreview } from './TransactionsPreview';
import { VerdictsPreview } from './VerdictsPreview';

export type PreviewKey =
  | 'shell'
  | 'home'
  | 'holdings'
  | 'transactions'
  | 'pools'
  | 'trade'
  | 'data'
  | 'verdicts'
  | 'polish';

const PREVIEWS: Record<PreviewKey, () => ReactNode> = {
  shell: () => <ExpandedNavPreview />,
  home: () => <HomePreview />,
  holdings: () => <HoldingsPreview />,
  transactions: () => <TransactionsPreview />,
  pools: () => <PoolsPreview />,
  trade: () => <TradePreview />,
  data: () => <PricesTablePreview />,
  verdicts: () => <VerdictsPreview />,
  polish: () => <IconsPreview />,
};

export function GuidePreview({ previewKey }: { previewKey: PreviewKey }) {
  const Preview = PREVIEWS[previewKey];
  return (
    <Box minWidth={0} width="100%">
      <Preview />
    </Box>
  );
}
