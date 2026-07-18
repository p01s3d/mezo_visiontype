import { HealthScorePanel } from '../../Home/HealthScorePanel';
import { DEMO_HEALTH_SCORE } from '../../../data/demoHealthScore';

export function VerdictsPreview() {
  return (
    <HealthScorePanel
      health={DEMO_HEALTH_SCORE}
      isConnected={false}
      loading={false}
      missingOpenRouterKey={false}
    />
  );
}
