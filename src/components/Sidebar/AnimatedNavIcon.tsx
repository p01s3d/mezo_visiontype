import { useEffect, useRef } from 'react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { useTheme } from '@coinbase/cds-web';
import { Box } from '@coinbase/cds-web/layout';
import type { NavAnimation } from '../../data/navIcons';

type AnimatedNavIconProps = {
  animationData: NavAnimation;
  active?: boolean;
  hovered?: boolean;
  loop?: boolean;
};

export const AnimatedNavIcon = ({
  animationData,
  active = false,
  hovered = false,
  loop = false,
}: AnimatedNavIconProps) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const { activeColorScheme } = useTheme();
  const shouldPlay = loop || active || hovered;
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
      flexShrink={0}
      height={24}
      style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined}
      width={24}
    >
      <Lottie
        animationData={animationData}
        autoplay={loop}
        loop={loop || shouldPlay}
        lottieRef={lottieRef}
        style={{ height: 24, width: 24 }}
      />
    </Box>
  );
};
