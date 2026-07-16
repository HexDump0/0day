import SectionHead from './SectionHead.tsx';
import { STEPS } from '../data/content.ts';

export default function HowItWorks() {
  return (
    <section id="how" className="sect" data-signal="how">
      <SectionHead no="04" title="How it works" tag="// you ship → we ship" />
      <ol className="process-loop rv">
        {STEPS.map((step) => (
          <li key={step.no}>
            <span className="process-no">{step.no}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
            <span className="process-arrow" aria-hidden="true">→</span>
          </li>
        ))}
        <li className="process-repeat" aria-label="Then repeat">
          <span aria-hidden="true">↻</span>
          <strong>ship again</strong>
        </li>
      </ol>
    </section>
  );
}
