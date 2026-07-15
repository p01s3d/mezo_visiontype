import { Box, HStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';

type CDSLogoProps = {
  compact?: boolean;
};

const BRAND_BLUE = '#0052FF';

function PortfolioMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill={BRAND_BLUE} height="5" rx="1.5" width="4" x="3" y="14" />
      <rect fill={BRAND_BLUE} height="9" rx="1.5" width="4" x="10" y="10" />
      <rect fill={BRAND_BLUE} height="13" rx="1.5" width="4" x="17" y="6" />
    </svg>
  );
}

export const CDSLogo = ({ compact = false }: CDSLogoProps) => {
  if (compact) {
    return (
      <Box paddingX={0.5}>
        <PortfolioMark size={24} />
      </Box>
    );
  }

  return (
    <Box paddingX={1}>
      <HStack alignItems="center" gap={1}>
        <PortfolioMark size={20} />
        <Text
          aria-label="Portfolio"
          font="headline"
          role="img"
          style={{ letterSpacing: '-0.01em' }}
        >
          Portfolio
        </Text>
      </HStack>
    </Box>
  );
};
