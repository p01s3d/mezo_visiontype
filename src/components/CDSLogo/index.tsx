import Lottie from 'lottie-react';
import { useTheme } from '@coinbase/cds-web';
import { Box, HStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import mirrorAnimation from '../../assets/icons/025 Random Misc/01 Stroke (Regular)/mirror.json';

type CDSLogoProps = {
  compact?: boolean;
};

function PortfolioMark({ size = 24 }: { size?: number }) {
  const { activeColorScheme } = useTheme();
  const isDark = activeColorScheme === 'dark';

  return (
    <Box
      flexShrink={0}
      height={size}
      style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined}
      width={size}
    >
      <Lottie
        animationData={mirrorAnimation}
        autoplay
        loop
        style={{ height: size, width: size }}
      />
    </Box>
  );
}

export const CDSLogo = ({ compact = false }: CDSLogoProps) => {
  if (compact) {
    return (
      <Box paddingX={0.5}>
        <PortfolioMark size={32} />
      </Box>
    );
  }

  return (
    <Box paddingX={1}>
      <HStack alignItems="center" gap={1}>
        <PortfolioMark size={28} />
        <Text
          aria-label="Portfolio"
          font="headline"
          role="img"
          style={{ letterSpacing: '-0.01em' }}
        >
          Get Ahead
        </Text>
      </HStack>
    </Box>
  );
};
