import { Chip } from '@coinbase/cds-web/chips';
import { Box } from '@coinbase/cds-web/layout';
import { Tooltip } from '@coinbase/cds-web/overlays';
import { Text } from '@coinbase/cds-web/typography';
import type { VerdictType } from '../../types/positionHealth';

const VERDICT_LABELS: Record<VerdictType, string> = {
  hold: 'Hold',
  reduce: 'Reduce',
  exit: 'Exit',
};

type HealthIndicatorProps = {
  verdict: VerdictType;
  tooltip?: string;
};

export const HealthIndicator = ({ verdict, tooltip }: HealthIndicatorProps) => {
  const chip = (
    <Chip background="bgNegativeWash" borderRadius={1000} compact>
      <Text color="fgNegative" font="caption">
        {VERDICT_LABELS[verdict]}
      </Text>
    </Chip>
  );

  if (!tooltip) {
    return chip;
  }

  return (
    <Tooltip content={tooltip} maxWidth={400}>
      <Box display="inline-flex">{chip}</Box>
    </Tooltip>
  );
};

export function verdictTooltip(verdict: {
  headline: string;
  reasoning: string;
  confidence?: string;
}): string {
  const confidence = verdict.confidence ? ` (${verdict.confidence} confidence)` : '';
  return `${verdict.headline}${confidence}. ${verdict.reasoning}`;
}
