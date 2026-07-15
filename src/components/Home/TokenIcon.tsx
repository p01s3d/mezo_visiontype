import type { AvatarSize } from '@coinbase/cds-common/types/AvatarSize';
import { Avatar } from '@coinbase/cds-web/media';
import { getTokenIconUrl } from '../../utils/tokenIcon';

type TokenIconProps = {
  symbol: string;
  source?: string | null;
  size?: AvatarSize;
  alt?: string;
};

const SIZE_PX: Record<AvatarSize, number> = {
  s: 16,
  m: 24,
  l: 32,
  xl: 40,
  xxl: 48,
  xxxl: 56,
};

export const TokenIcon = ({ symbol, source, size = 'l', alt }: TokenIconProps) => {
  const src = source ?? getTokenIconUrl(symbol);

  return (
    <Avatar
      alt={alt ?? symbol}
      dangerouslySetSize={SIZE_PX[size]}
      name={symbol}
      shape="circle"
      size={size}
      src={src}
    />
  );
};
