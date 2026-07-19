import type { ReactNode } from 'react';
import { Box } from '@coinbase/cds-web/layout';

export function GuidePreviewFill({ children }: { children: ReactNode }) {
  return (
    <Box minWidth={0} width="100%">
      {children}
    </Box>
  );
}
