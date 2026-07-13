import SectionHead from './SectionHead.tsx';
import { FAQS } from '../data/content.ts';

export default function Faq() {
  return (
    <section id="faq" className="sect">
      <SectionHead no="04" title="FAQ" tag="// before you ask" />
      <div className="faq corners rv">
        {FAQS.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
