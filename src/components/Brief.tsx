import SectionHead from './SectionHead.tsx';
import Directions from './Directions.tsx';
import { PROGRAM_FACTS } from '../data/content.ts';

export default function Brief() {
  return (
    <section id="brief" className="sect brief" data-signal="brief">
      <SectionHead no="01" title="What is this?" tag="// the whole program" />
      <div className="brief-statement rv">
        <p className="brief-command">
          Do something <span>real</span> and <span>original</span> in security.
        </p>
        <p className="brief-close">Write it up. Ship it.</p>
        <aside>
          <span>That is the whole spec.</span>
          <p>
            The examples below are coordinates, not tracks. Follow one, combine them,
            or arrive somewhere we did not expect.
          </p>
        </aside>
      </div>
      <dl className="fact-rail rv" aria-label="Program facts">
        {PROGRAM_FACTS.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="brief-directions">
        <div className="brief-directions-head rv">
          <span>// some starting points</span>
          <p>Pick one, combine them, or do something else entirely.</p>
        </div>
        <Directions embedded />
      </div>
    </section>
  );
}
