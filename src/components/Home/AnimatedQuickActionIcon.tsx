import { useEffect, useRef } from 'react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { Box } from '@coinbase/cds-web/layout';
import type { QuickActionAnimation } from '../../data/quickActionIcons';

const COINBASE_BLUE = '#0052FF';

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
  const shouldPlay = loop || hovered;

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
      borderRadius={1000}
      display="flex"
      flexShrink={0}
      height={40}
      justifyContent="center"
      style={{ background: COINBASE_BLUE }}
      width={40}
    >
      <Box height={24} style={{ filter: 'brightness(0) invert(1)' }} width={24}>
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
