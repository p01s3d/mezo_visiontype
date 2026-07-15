import { IconButton } from '@coinbase/cds-web/buttons';
import { HStack } from '@coinbase/cds-web/layout';
import { Pressable } from '@coinbase/cds-web/system';
import { Text } from '@coinbase/cds-web/typography';
import { Icon } from '@coinbase/cds-web/icons';

type FilterChipProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
};

function FilterChip({ label, active = false, onClick }: FilterChipProps) {
  return (
    <Pressable
      background={active ? 'bgAlternate' : 'bgAlternate'}
      borderRadius={1000}
      onClick={onClick}
      paddingX={2}
      paddingY={1}
    >
      <HStack alignItems="center" gap={0.75}>
        <Text color="fg" font="headline">
          {label}
        </Text>
        <Icon active color="fgMuted" name="caretDown" size="s" />
      </HStack>
    </Pressable>
  );
}

const DEFAULT_FILTERS = ['Type', 'Status', 'Asset', 'Date'] as const;

type FilterGroupProps = {
  filters?: readonly string[];
};

export function FilterGroup({ filters = DEFAULT_FILTERS }: FilterGroupProps) {
  return (
    <HStack alignItems="center" flexWrap="wrap" gap={1} paddingBottom={1.5} paddingTop={1} width="100%">
      <IconButton
        accessibilityLabel="Filter transactions"
        compact
        name="filter"
        transparent
        variant="secondary"
      />
      {filters.map((label) => (
        <FilterChip key={label} label={label} />
      ))}
    </HStack>
  );
}
