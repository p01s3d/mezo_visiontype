import type { ReactNode } from 'react';
import { GuidePreviewFill } from '../GuidePreviewFill';
import { ExpandedNavPreview } from './ExpandedNavPreview';
import { HoldingsPreview } from './HoldingsPreview';
import { HomePreview } from './HomePreview';
import { IconsPreview } from './IconsPreview';
import { PoolsPreview } from './PoolsPreview';
import { PricesTablePreview } from './PricesTablePreview';
import { ThemePreview } from './ThemePreview';
import { TradePreview } from './TradePreview';
import { TransactionsPreview } from './TransactionsPreview';
import {
  VerdictsAllocationPreview,
  VerdictsCryptoPreview,
  VerdictsDailyPreview,
  VerdictsDeviationPreview,
  VerdictsHealthArcPreview,
  VerdictsYieldPreview,
} from './VerdictsGuidePreviews';

export type PreviewKey =
  | 'shell'
  | 'home'
  | 'holdings'
  | 'transactions'
  | 'pools'
  | 'trade'
  | 'data'
  | 'verdicts-health-arc'
  | 'verdicts-deviation'
  | 'verdicts-daily'
  | 'verdicts-allocation'
  | 'verdicts-crypto'
  | 'verdicts-yield'
  | 'theme'
  | 'polish';

const PREVIEWS: Record<PreviewKey, () => ReactNode> = {
  shell: () => <ExpandedNavPreview />,
  home: () => <HomePreview />,
  holdings: () => <HoldingsPreview />,
  transactions: () => <TransactionsPreview />,
  pools: () => <PoolsPreview />,
  trade: () => <TradePreview />,
  data: () => <PricesTablePreview />,
  'verdicts-health-arc': () => <VerdictsHealthArcPreview />,
  'verdicts-deviation': () => <VerdictsDeviationPreview />,
  'verdicts-daily': () => <VerdictsDailyPreview />,
  'verdicts-allocation': () => <VerdictsAllocationPreview />,
  'verdicts-crypto': () => <VerdictsCryptoPreview />,
  'verdicts-yield': () => <VerdictsYieldPreview />,
  theme: () => <ThemePreview />,
  polish: () => <IconsPreview />,
};

export function GuidePreview({ previewKey }: { previewKey: PreviewKey }) {
  const Preview = PREVIEWS[previewKey];
  return (
    <GuidePreviewFill>
      <Preview />
    </GuidePreviewFill>
  );
}
