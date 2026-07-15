import { PortfolioMark } from './icons';

export const MezoHeader = () => (
  <header className="mezo-header">
    <div className="mezo-wordmark" role="img" aria-label="Portfolio">
      <span className="mezo-wordmark-mark">
        <PortfolioMark size={22} />
      </span>
      <span>Portfolio</span>
    </div>
  </header>
);
