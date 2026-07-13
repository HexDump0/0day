import { APPLY_URL } from '../data/content.ts';

export default function FinalCta() {
  return (
    <section className="final rv">
      <p className="eyebrow">// end of transmission</p>
      <h2>Everything you've built<br />can be broken.<br /><span className="hl">Find out how.</span></h2>
      <a className="btn btn-solid" href={APPLY_URL} target="_blank" rel="noreferrer">
        <span className="btn-arrow">&gt;</span> Apply now
      </a>
    </section>
  );
}
