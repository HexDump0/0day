import { APPLY_URL } from '../data/content.ts';

export default function FinalCta() {
  return (
    <section id="join" className="final rv" data-signal="join">
      <p className="eyebrow">// end of transmission</p>
      <h2>Find the question.<br />Do the work.<br /><span className="hl">Ship the evidence.</span></h2>
      <p className="final-sub">Build something useful, find something real, or explain something hidden.</p>
      <a className="btn btn-solid" href={APPLY_URL} target="_blank" rel="noreferrer">
        <span className="btn-arrow">&gt;</span> Enter 0day
      </a>
    </section>
  );
}
