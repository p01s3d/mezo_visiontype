import type { MouseEvent, ReactNode } from 'react';
import { Pressable } from '@coinbase/cds-web/system';

type HomePressableRowProps = {
  children: ReactNode;
  accessibilityLabel: string;
  bleedX?: 0 | 2 | 3;
  onPress?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  paddingY?: 1.5 | 2;
};

export const HomePressableRow = ({
  children,
  accessibilityLabel,
  bleedX = 2,
  onPress,
  onMouseEnter,
  onMouseLeave,
  paddingY = 1.5,
}: HomePressableRowProps) => {
  const marginX = bleedX === 0 ? undefined : bleedX === 3 ? (-3 as const) : (-2 as const);
  const paddingX = bleedX === 0 ? undefined : bleedX;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      background="transparent"
      borderRadius={300}
      marginX={marginX}
      onClick={onPress}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      paddingX={paddingX}
      paddingY={paddingY}
      width="100%"
    >
      {children}
    </Pressable>
  );
};

export function stopRowPress(event: MouseEvent) {
  event.stopPropagation();
}
