import { APPLY_URL } from '../data/content.ts';

export default function FinalCta() {
  return (
    <section id="join" className="final rv">
      <h2><span className="hl">Hack the planet.</span></h2>
      <a className="btn btn-solid" href={APPLY_URL} target="_blank" rel="noreferrer">
        <span className="btn-arrow">&gt;</span> RSVP 0day
      </a>
    </section>
  );
}
