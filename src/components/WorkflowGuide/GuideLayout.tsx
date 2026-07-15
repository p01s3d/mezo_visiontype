import type { ReactNode } from 'react';
import { Box, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';

type BandBackground = 'bg' | 'bgSecondaryWash' | 'bgInverse';

export function GuideContainer({
  children,
  narrow,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <Box
      paddingX={2}
      style={{ margin: '0 auto', maxWidth: narrow ? 720 : 1080 }}
      width="100%"
    >
      {children}
    </Box>
  );
}

export function GuideBand({
  background = 'bg',
  children,
  paddingY = 6,
}: {
  background?: BandBackground;
  children: ReactNode;
  paddingY?: 6 | 8;
}) {
  return (
    <Box background={background} paddingY={paddingY} width="100%">
      <GuideContainer>{children}</GuideContainer>
    </Box>
  );
}

export function GuideSectionHeader({
  align = 'start',
  subtitle,
  title,
}: {
  title: string;
  subtitle?: string;
  align?: 'start' | 'center';
}) {
  return (
    <VStack alignItems={align === 'center' ? 'center' : 'flex-start'} gap={1} width="100%">
      <Text
        color={align === 'center' ? undefined : 'fg'}
        font="title1"
        style={align === 'center' ? { letterSpacing: '-0.02em', textAlign: 'center' } : { letterSpacing: '-0.02em' }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          color="fgMuted"
          font="body"
          style={align === 'center' ? { textAlign: 'center' } : undefined}
        >
          {subtitle}
        </Text>
      ) : null}
    </VStack>
  );
}

export function GuideHero({
  children,
  subtitle,
  title,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <GuideBand background="bg" paddingY={8}>
      <GuideContainer narrow>
        <VStack alignItems="center" gap={3} width="100%">
          <VStack alignItems="center" gap={2} width="100%">
            <Text font="display2" style={{ letterSpacing: '-0.02em', textAlign: 'center' }}>
              {title}
            </Text>
            <Text color="fgMuted" font="body" style={{ textAlign: 'center' }}>
              {subtitle}
            </Text>
          </VStack>
          {children}
        </VStack>
      </GuideContainer>
    </GuideBand>
  );
}
