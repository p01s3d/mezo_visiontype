import { useEffect, useRef } from 'react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { useTheme } from '@coinbase/cds-web';
import { Box } from '@coinbase/cds-web/layout';
import type { QuickActionAnimation } from '../../data/quickActionIcons';

type AnimatedQuickActionIconProps = {
  animationData: QuickActionAnimation;
  hovered?: boolean;
  loop?: boolean;
};

export const AnimatedQuickActionIcon = ({
  animationData,
  hovered = false,
  loop = false,
}: AnimatedQuickActionIconProps) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const { activeColorScheme } = useTheme();
  const shouldPlay = loop || hovered;
  const isDark = activeColorScheme === 'dark';

  useEffect(() => {
    if (shouldPlay) {
      lottieRef.current?.goToAndPlay(0);
      return;
    }
    lottieRef.current?.goToAndStop(0, true);
  }, [shouldPlay]);

  return (
    <Box
      alignItems="center"
      background="bgAlternate"
      borderRadius={1000}
      display="flex"
      flexShrink={0}
      height={40}
      justifyContent="center"
      width={40}
    >
      <Box
        height={24}
        style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined}
        width={24}
      >
        <Lottie
          animationData={animationData}
          autoplay={loop}
          loop={loop || hovered}
          lottieRef={lottieRef}
          style={{ height: 24, width: 24 }}
        />
      </Box>
    </Box>
  );
};
