import { useMemo, useState } from 'react';
import SectionHead from './SectionHead.tsx';
import { HOUR_METHODS } from '../data/content.ts';

type HourMethodId = (typeof HOUR_METHODS)[number]['id'];

export default function Proof() {
  const [selected, setSelected] = useState(() => new Set(HOUR_METHODS.map((method) => method.id)));
  const [hovered, setHovered] = useState<string | null>(null);

  const attached = useMemo(
    () => HOUR_METHODS.filter((method) => selected.has(method.id)),
    [selected],
  );

  const toggle = (id: HourMethodId) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section id="proof" className="sect proof" data-signal="proof">
      <SectionHead no="02" title="Proof of work" tag="// one required file" />
      <div className="proof-intro rv">
        <p>Track the hours however the work happened.</p>
        <p><span>The writeup is not optional.</span> It is what makes the time believable.</p>
      </div>

      <div className="proof-pipeline corners rv">
        <div className="proof-pipeline-head">
          <span>// time sources</span>
          <span>toggle any or all</span>
          <span>// required proof</span>
          <span>// human review</span>
        </div>

        <div className="proof-methods" role="group" aria-label="Ways to track time">
          {HOUR_METHODS.map((method) => {
            const isSelected = selected.has(method.id);
            const isHot = hovered === method.id;
            return (
              <button
                key={method.id}
                type="button"
                aria-pressed={isSelected}
                className={`${isSelected ? 'is-selected' : ''}${isHot ? ' is-hot' : ''}`}
                onClick={() => toggle(method.id)}
                onPointerEnter={() => setHovered(method.id)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(method.id)}
                onBlur={() => setHovered(null)}
              >
                <span className="proof-method-no">{method.no}</span>
                <span className="proof-method-copy">
                  <strong>{method.title}</strong>
                  <small>{method.covers}</small>
                </span>
                <span className="proof-method-action">{method.proof}</span>
                <span className="proof-method-state" aria-hidden="true">
                  {isSelected ? '●' : '○'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="proof-lines" aria-hidden="true">
          {HOUR_METHODS.map((method) => (
            <span
              key={method.id}
              className={`${selected.has(method.id) ? 'is-selected' : ''}${hovered === method.id ? ' is-hot' : ''}`}
            ></span>
          ))}
        </div>

        <article className="proof-writeup">
          <span className="proof-required">required</span>
          <p className="manifest-id">SHIP_MANIFEST.md</p>
          <h3>WRITEUP<span>.md</span></h3>
          <p>Show the path: decisions, dead ends, evidence, and the result.</p>
          <div className="proof-attachments" aria-live="polite">
            <span>attached time</span>
            <p>
              {attached.length
                ? attached.map((method) => method.title).join(' + ')
                : 'No time source selected'}
            </p>
          </div>
        </article>

        <div className="proof-review-line" aria-hidden="true">
          <span>→</span>
        </div>

        <article className="proof-review">
          <span>human review</span>
          <h3>Hours checked against the work.</h3>
          <p>The writeup’s depth should justify the time you declared.</p>
          <strong>approved hours → gear</strong>
        </article>
      </div>

      <p className="proof-note rv">
        Hackatime, Lapse, and self-declaration can overlap. Use the combination that tells the truth.
      </p>
    </section>
  );
}
