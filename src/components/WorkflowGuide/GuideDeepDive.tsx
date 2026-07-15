import type { ReactNode } from 'react';
import { Card } from '@coinbase/cds-web/cards';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { GUIDE_PREVIEW_WIDTH } from './previewConstants';

const MONO = 'var(--defaultFont-mono)';

type GuideDeepDiveProps = {
  body: string;
  chapterIndex: number;
  chapterTotal: number;
  preview: ReactNode;
  steps: string[];
  title: string;
};

export function GuideDeepDive({
  body,
  chapterIndex,
  chapterTotal,
  preview,
  steps,
  title,
}: GuideDeepDiveProps) {
  const chapterLabel = `${String(chapterIndex).padStart(2, '0')} / ${String(chapterTotal).padStart(2, '0')}`;

  return (
    <Box
      display="grid"
      gap={8}
      style={{ gridTemplateColumns: `minmax(0, 1fr) minmax(0, ${GUIDE_PREVIEW_WIDTH}px)` }}
      width="100%"
    >
      <VStack gap={3} minWidth={0} width="100%">
        <VStack gap={1} minWidth={0} width="100%">
          <Text color="fgMuted" font="label2">
            {chapterLabel}
          </Text>
          <Text font="title3">{title}</Text>
          <Text color="fgMuted" font="body">
            {body}
          </Text>
        </VStack>

        <VStack gap={1} minWidth={0} width="100%">
          <Text font="label2">How to</Text>
          {steps.map((step, index) => (
            <HStack key={step} alignItems="flex-start" gap={1.5} minWidth={0} width="100%">
              <Text color="fgPrimary" font="label2" style={{ fontFamily: MONO, minWidth: 20 }}>
                {index + 1}.
              </Text>
              <Text font="label2" style={{ overflowWrap: 'anywhere' }}>
                {step}
              </Text>
            </HStack>
          ))}
        </VStack>
      </VStack>

      <VStack alignItems="stretch" justifyContent="center" minWidth={0} width="100%">
        <Card borderRadius={500} overflow="hidden" width="100%">
          <Box padding={1.5} width="100%">
            {preview}
          </Box>
        </Card>
      </VStack>
    </Box>
  );
}
