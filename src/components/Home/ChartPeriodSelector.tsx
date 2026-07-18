import { Box, HStack } from '@coinbase/cds-web/layout';
import { Pressable } from '@coinbase/cds-web/system';
import { Text } from '@coinbase/cds-web/typography';
import type { ChartPeriod } from '../../api/zerion';

export type ChartPeriodTab = {
  label: string;
  period: ChartPeriod;
};

export const CHART_PERIOD_TABS: ChartPeriodTab[] = [
  { label: '1H', period: 'hour' },
  { label: '1D', period: 'day' },
  { label: '1W', period: 'week' },
  { label: '1M', period: 'month' },
  { label: '1Y', period: 'year' },
  { label: 'ALL', period: 'max' },
];

export function chartPeriodShortLabel(period: ChartPeriod): string {
  return CHART_PERIOD_TABS.find((tab) => tab.period === period)?.label ?? period;
}

type ChartPeriodSelectorProps = {
  value: ChartPeriod;
  onChange: (period: ChartPeriod) => void;
};

export function ChartPeriodSelector({ value, onChange }: ChartPeriodSelectorProps) {
  return (
    <HStack alignItems="stretch" gap={0.5} width="100%">
      {CHART_PERIOD_TABS.map((tab) => {
        const active = tab.period === value;
        return (
          <Box key={tab.period} flexGrow={1} flexShrink={1} minWidth={0}>
            <Pressable
              accessibilityLabel={`Chart period ${tab.label}`}
              background={active ? 'bgPrimaryWash' : 'transparent'}
              borderRadius={1000}
              onClick={() => onChange(tab.period)}
              paddingY={0.75}
              width="100%"
            >
              <Box alignItems="center" display="flex" justifyContent="center" width="100%">
                <Text color={active ? 'fgPrimary' : 'fgMuted'} font="label1">
                  {tab.label}
                </Text>
              </Box>
            </Pressable>
          </Box>
        );
      })}
    </HStack>
  );
}
