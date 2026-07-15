import { REWARDS, TOTAL_WEALTH } from '../../data/mezoActions';
import { CrownIcon } from './icons';

export const WealthBar = () => (
  <div className="mezo-wealthbar-wrap">
    <div className="mezo-wealthbar">
      <div className="mezo-avatar" />
      <div className="mezo-wealthbar-row">
        <div>
          <div className="mezo-wealth-label">total wealth</div>
          <div className="mezo-wealth-value">${TOTAL_WEALTH.toLocaleString('en-US')}</div>
        </div>
        <div className="mezo-points">
          <div className="mezo-wealth-label">rewards</div>
          <div className="mezo-points-value">
            {REWARDS}
            <span className="mezo-rewards-icon">
              <CrownIcon size={16} />
            </span>
          </div>
        </div>
      </div>
      <div className="mezo-ticks">
        <div className="mezo-ticks-fill" style={{ left: '30%', width: '42%' }} />
        <div className="mezo-ticks-fill" style={{ left: '74%', width: '24%' }} />
      </div>
    </div>
  </div>
);
