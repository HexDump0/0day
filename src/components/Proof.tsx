import { useState } from 'react';
import SectionHead from './SectionHead.tsx';
import { HOUR_METHODS } from '../data/content.ts';

/* Faux document body: headings + redacted bars, enough to read as a real
   markdown file without competing with the actual copy. */
const WRITEUP_SECTIONS = [
  { heading: '## decisions', bars: [92, 61] },
  { heading: '## dead ends', bars: [74] },
  { heading: '## evidence', bars: [85, 52] },
  { heading: '## result', bars: [68] },
];

export default function Proof() {
  const [hot, setHot] = useState<string | null>(null);

  return (
    <section id="proof" className="sect proof">
      <SectionHead no="02" title="Proof of work" tag="// one required file" />
      <div className="proof-intro rv">
        <p>Track the hours however the work happened.</p>
        <p><span>The writeup is not optional.</span> It is what makes the time believable.</p>
      </div>

      <div className="proof-stack corners rv">
        <div className="proof-sources-head">
          <span>// time sources</span>
          <span>any or all — they can overlap</span>
        </div>

        <ul className="proof-sources" aria-label="Ways to track time">
          {HOUR_METHODS.map((method) => (
            <li
              key={method.id}
              className={hot === method.id ? 'is-hot' : ''}
              onPointerEnter={() => setHot(method.id)}
              onPointerLeave={() => setHot(null)}
            >
              <span className="proof-source-no">{method.no}</span>
              <strong>{method.title}</strong>
              <p>{method.covers}</p>
              <span className="proof-source-proof">{method.proof}</span>
            </li>
          ))}
        </ul>

        <article className="proof-file">
          <span className="proof-required">required</span>
          <div className="proof-file-pitch">
            <p className="manifest-id">SHIP_MANIFEST.MD</p>
            <h3>WRITEUP<span>.md</span></h3>
            <p>
              Show the path: decisions, dead ends, evidence, and the result.
              The deeper the file, the more defensible the hours.
            </p>
          </div>
          <div className="proof-doc" aria-hidden="true">
            <div className="proof-doc-fm">
              <span>---</span>
              <span><i>ship:</i> what you made</span>
              <span><i>time:</i></span>
              {HOUR_METHODS.map((method) => (
                <span
                  key={method.id}
                  className={`proof-fm-line${hot === method.id ? ' is-hot' : ''}`}
                >
                  <i>{method.title.toLowerCase()}:</i>{' '}
                  {method.proof.toLowerCase().replace(/\.$/, '')}
                </span>
              ))}
              <span>---</span>
            </div>
            <div className="proof-doc-body">
              {WRITEUP_SECTIONS.map((section) => (
                <div key={section.heading} className="proof-doc-sec">
                  <h4>{section.heading}</h4>
                  {section.bars.map((width, i) => (
                    <span key={i} style={{ width: `${width}%` }}></span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      <div className="proof-review rv">
        <code>$ review writeup --against declared_hours</code>
        <p>A human reads the file and checks the hours against the work.</p>
        <strong>approved hours → gear</strong>
      </div>
    </section>
  );
}
