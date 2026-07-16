import { useState } from 'react';
import SectionHead from './SectionHead.tsx';
import { DIRECTIONS } from '../data/content.ts';

interface DirectionsProps {
  embedded?: boolean;
}

export default function Directions({ embedded = false }: DirectionsProps) {
  const [activeId, setActiveId] = useState(DIRECTIONS[0].id);
  const active = DIRECTIONS.find((direction) => direction.id === activeId) ?? DIRECTIONS[0];

  const console = (
    <div className="direction-console corners rv">
        <div className="direction-tabs" role="tablist" aria-label="Project directions">
          {DIRECTIONS.map((direction) => (
            <button
              key={direction.id}
              id={`direction-tab-${direction.id}`}
              type="button"
              role="tab"
              aria-selected={direction.id === active.id}
              aria-controls={`direction-panel-${direction.id}`}
              className={direction.id === active.id ? 'is-active' : undefined}
              onClick={() => setActiveId(direction.id)}
              onPointerEnter={() => setActiveId(direction.id)}
              onFocus={() => setActiveId(direction.id)}
            >
              <span className="direction-no">{direction.no}</span>
              <strong>{direction.title}</strong>
              <span className="direction-strap">{direction.strap}</span>
              <span className="direction-arrow" aria-hidden="true">↗</span>
            </button>
          ))}
          <div className="direction-own">
            <span>04</span>
            <p>Or your own idea.<br />Seriously.</p>
          </div>
        </div>

        <article
          key={active.id}
          id={`direction-panel-${active.id}`}
          role="tabpanel"
          aria-labelledby={`direction-tab-${active.id}`}
          className="direction-panel"
          data-direction={active.id}
        >
          <header>
            <p>// direction {active.no}</p>
            <h3>{active.title}</h3>
            <span>{active.strap}</span>
          </header>
          <p className="direction-lead">{active.lead}</p>
          <div>
            <p className="console-label">For example</p>
            <ul>
              {active.examples.map((example) => <li key={example}>{example}</li>)}
            </ul>
          </div>
        </article>
      </div>
  );

  if (embedded) return console;

  return (
    <section id="directions" className="sect directions">
      <SectionHead no="02" title="What can ship" tag="// not a menu" />
      {console}
    </section>
  );
}
