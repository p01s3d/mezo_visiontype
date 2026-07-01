import { UpsellCard } from '@coinbase/cds-web/cards';
import { Box } from '@coinbase/cds-web/layout';
import { Pictogram } from '@coinbase/cds-web/illustrations';

export const RecurringBuyCard = () => {
  return (
    <UpsellCard
      title="Add liquidity"
      description="Provide liquidity to earn trading fees and yield on your assets."
      action="Explore pools"
      media={
        <Box position="relative" bottom={6} right={24}>
          <Pictogram dimension="64x64" name="recurringPurchases" />
        </Box>
      }
      onDismissPress={() => {}}
    />
  );
};
