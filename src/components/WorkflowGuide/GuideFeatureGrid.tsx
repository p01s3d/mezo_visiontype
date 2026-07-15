import type { ReactNode } from 'react';
import { Card, CardBody } from '@coinbase/cds-web/cards';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';

const MONO = 'var(--defaultFont-mono)';

export function GuideFeatureGrid({ children }: { children: ReactNode }) {
  return (
    <HStack alignItems="stretch" flexWrap="wrap" gap={3} width="100%">
      {children}
    </HStack>
  );
}

export function GuideFeatureGrid2x2({ children }: { children: ReactNode }) {
  return (
    <Box
      display="grid"
      gap={3}
      style={{
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'repeat(2, minmax(140px, 1fr))',
        minHeight: 320,
      }}
      width="100%"
    >
      {children}
    </Box>
  );
}

export function GuideFeatureCard({
  children,
  filePath,
  fill,
  subtitle,
  title,
}: {
  title: string;
  subtitle: string;
  filePath?: string;
  children?: ReactNode;
  fill?: boolean;
}) {
  const wrapperProps = fill
    ? { height: '100%' as const, minWidth: 0, width: '100%' as const }
    : { flexGrow: 1, minWidth: 220, style: { flexBasis: 'min(100%, 260px)' as const } };

  return (
    <Box {...wrapperProps}>
      <Card borderRadius={500} height="100%" overflow="visible">
        <CardBody padding={4}>
          <VStack gap={1.5} height="100%" justifyContent="space-between" minWidth={0} width="100%">
            <VStack gap={1.5} minWidth={0} width="100%">
              <Text font="headline">{title}</Text>
              <Text color="fgMuted" font="label2" style={{ overflowWrap: 'anywhere' }}>
                {subtitle}
              </Text>
              {children}
            </VStack>
            {filePath ? (
              <Text
                color="fgMuted"
                font="label2"
                style={{ fontFamily: MONO, overflowWrap: 'anywhere' }}
              >
                {filePath}
              </Text>
            ) : null}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
}
