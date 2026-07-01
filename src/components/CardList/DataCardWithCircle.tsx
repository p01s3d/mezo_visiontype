import { Button } from '@coinbase/cds-web/buttons';
import { Card, CardBody, CardFooter } from '@coinbase/cds-web/cards';
import { ProgressCircle } from '@coinbase/cds-web/visualizations';
import { Text } from '@coinbase/cds-web/typography';
import { upsellCardDefaultWidth } from '@coinbase/cds-common/tokens/card';
import { Icon } from '@coinbase/cds-web/icons';
import type { YieldPool } from '../../api/defillama';
import { getAverageApy } from '../../utils/defiViews';

type DataCardWithCircleProps = {
  pools: YieldPool[];
  loading: boolean;
};

export const DataCardWithCircle = ({ pools, loading }: DataCardWithCircleProps) => {
  const averageApy = getAverageApy(pools);
  const progress = Math.min(averageApy / 20, 1);

  return (
    <Card width={upsellCardDefaultWidth}>
      <CardBody
        paddingX={2}
        title="Market average APY"
        description="Weighted average across top pools by TVL (live)"
        media={
          loading ? (
            <ProgressCircle indeterminate size={100} />
          ) : (
            <ProgressCircle
              progress={progress}
              size={100}
              contentNode={<Text font="title4">{averageApy.toFixed(1)}%</Text>}
            />
          )
        }
      />
      <CardFooter paddingX={2}>
        <Button compact variant="secondary" end={<Icon name="caretRight" color="fg" size="s" />}>
          View breakdown
        </Button>
      </CardFooter>
    </Card>
  );
};
