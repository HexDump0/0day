import { TICKER } from '../data/content.ts';

export default function Ticker() {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-run">
        <span>{TICKER}</span>
        <span>{TICKER}</span>
      </div>
    </div>
  );
}
