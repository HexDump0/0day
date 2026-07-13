import SectionHead from './SectionHead.tsx';
import { STEPS } from '../data/content.ts';

export default function HowItWorks() {
  return (
    <section id="how" className="sect">
      <SectionHead no="03" title="How it works" tag="// you ship → we ship" />
      <ol className="steps corners rv">
        {STEPS.map((step) => (
          <li key={step.no}>
            <span className="step-no">{step.no}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
