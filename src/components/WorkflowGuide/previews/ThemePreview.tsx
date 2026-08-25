import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { COPERNICUS_DISPLAY, RIFORMA_MONO, RIFORMA_SANS } from '../../../theme/fontTokens';

const SURFACES = [
  { label: 'Canvas', hex: '#faf9f5', border: '#e6dfd8' },
  { label: 'Card', hex: '#efe9de', border: '#e6dfd8' },
  { label: 'Coral', hex: '#cc785c', border: '#cc785c' },
] as const;

const CHART_TOKENS = [
  { label: 'Portfolio', cssVar: '--chart-portfolio', fallback: '#5db8a6' },
  { label: 'Benchmark', cssVar: '--chart-benchmark', fallback: '#e8a55a' },
  { label: 'Accent', cssVar: '--chart-accent', fallback: '#cc785c' },
] as const;

function Swatch({
  label,
  hex,
  border,
}: {
  label: string;
  hex: string;
  border: string;
}) {
  return (
    <VStack alignItems="center" flex={1} gap={1} minWidth={0}>
      <Box
        borderRadius={200}
        height={40}
        style={{ backgroundColor: hex, border: `1px solid ${border}` }}
        width="100%"
      />
      <Text color="fgMuted" font="legal">
        {label}
      </Text>
      <Text color="fgMuted" font="legal">
        {hex}
      </Text>
    </VStack>
  );
}

function ChartSwatch({ label, cssVar, fallback }: (typeof CHART_TOKENS)[number]) {
  return (
    <HStack alignItems="center" flex={1} gap={1.5} minWidth={0}>
      <Box
        borderRadius={1000}
        flexShrink={0}
        height={12}
        style={{ backgroundColor: `var(${cssVar}, ${fallback})` }}
        width={12}
      />
      <VStack gap={0} minWidth={0}>
        <Text font="label2">{label}</Text>
        <Text color="fgMuted" font="legal">
          {cssVar}
        </Text>
      </VStack>
    </HStack>
  );
}

export function ThemePreview() {
  return (
    <VStack gap={3} minWidth={0} width="100%">
      <VStack gap={1.5} width="100%">
        <Text color="fgMuted" font="label2">
          Surfaces
        </Text>
        <HStack gap={2} width="100%">
          {SURFACES.map((surface) => (
            <Swatch key={surface.label} {...surface} />
          ))}
        </HStack>
      </VStack>

      <VStack gap={1.5} width="100%">
        <Text color="fgMuted" font="label2">
          Chart semantics
        </Text>
        <HStack gap={2} width="100%">
          {CHART_TOKENS.map((token) => (
            <ChartSwatch key={token.label} {...token} />
          ))}
        </HStack>
      </VStack>

      <VStack gap={1.5} width="100%">
        <Text color="fgMuted" font="label2">
          Type
        </Text>
        <VStack
          background="bgAlternate"
          borderRadius={300}
          gap={1.5}
          padding={2}
          width="100%"
        >
          <Text font="display2" style={{ fontFamily: COPERNICUS_DISPLAY, letterSpacing: '-0.02em' }}>
            $12,847.52
          </Text>
          <Text font="headline" style={{ fontFamily: RIFORMA_SANS }}>
            My assets
          </Text>
          <Text
            color="fgMuted"
            font="label2"
            style={{ fontFamily: RIFORMA_MONO, fontVariantNumeric: 'tabular-nums' }}
          >
            +$142.30 · Riforma Mono
          </Text>
        </VStack>
      </VStack>

      <VStack gap={1.5} width="100%">
        <Text color="fgMuted" font="label2">
          Semantic color
        </Text>
        <HStack gap={3} width="100%">
          <Text color="fgPositive" font="headline">
            +4.2%
          </Text>
          <Text color="fgNegative" font="headline">
            −1.8%
          </Text>
          <Text color="fgPrimary" font="headline">
            Buy
          </Text>
        </HStack>
      </VStack>
    </VStack>
  );
}
