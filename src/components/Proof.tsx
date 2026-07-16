import SectionHead from './SectionHead.tsx';
import { HOUR_METHODS } from '../data/content.ts';

export default function Proof() {
  return (
    <section id="proof" className="sect proof">
      <SectionHead no="02" title="Proof of work" tag="// the writeup matters" />
      <div className="proof-layout rv">
        <div className="proof-manifest corners">
          <span className="manifest-id">SHIP_MANIFEST.md</span>
          <h3>The artifact is what you made.<br /><em>The writeup proves the work.</em></h3>
          <p>
            Record the path, not just the ending: what you tried, where it failed,
            what the evidence says, and why your conclusion holds.
          </p>
          <div className="manifest-checks" aria-label="Writeup checklist">
            <span>process</span>
            <span>decisions</span>
            <span>dead ends</span>
            <span>evidence</span>
            <span>result</span>
          </div>
        </div>

        <div className="hour-stack">
          <div className="hour-stack-head">
            <span>Declare time</span>
            <span>Use any or all</span>
          </div>
          {HOUR_METHODS.map((method) => (
            <article key={method.no}>
              <span className="hour-no">{method.no}</span>
              <div>
                <h3>{method.title}</h3>
                <p>{method.covers}</p>
              </div>
              <b>{method.proof}</b>
            </article>
          ))}
          <div className="review-gate">
            <span aria-hidden="true">↓</span>
            <p><b>At review:</b> declared hours are cross-checked against the writeup’s depth.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
