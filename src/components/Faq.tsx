import SectionHead from './SectionHead.tsx';
import { FAQS } from '../data/content.ts';

export default function Faq() {
  return (
    <section id="faq" className="sect">
      <SectionHead no="05" title="FAQ" tag="// before you ask" />
      <div className="faq corners rv-stagger">
        {FAQS.map((item) => (
          <details className="rv" key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
