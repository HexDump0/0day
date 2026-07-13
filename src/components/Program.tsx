import SectionHead from './SectionHead.tsx';
import { SPEC } from '../data/content.ts';

export default function Program() {
  return (
    <section id="program" className="sect">
      <SectionHead no="01" title="Program" tag="// what this is" />
      <div className="program-grid rv">
        <div>
          <p className="big-copy">
            <em>0day</em> is your way into security. No certifications, no gatekeeping — pick a
            track, ship something <mark>real</mark>, and we ship you something back.
          </p>
          <p className="after-copy">
            Real means it exists outside a tutorial: a tool someone else could run, a bug that
            actually got fixed, a writeup someone learns from. Every submission is reviewed by real
            people at Hack Club — not a form, not a bot.
          </p>
        </div>
        <div className="spec corners">
          {SPEC.map((row) => (
            <div key={row.label}>
              <span>{row.label}</span>
              <b className={row.acid ? 'acid' : undefined}>{row.value}</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
