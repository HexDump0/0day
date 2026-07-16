import SectionHead from './SectionHead.tsx';
import { IN_SCOPE, OUT_OF_SCOPE } from '../data/content.ts';

export default function Rules() {
  return (
    <section id="rules" className="sect rules">
      <SectionHead no="04" title="What counts?" />
      <div className="rules-grid corners rv">
        <article className="rule-column rule-yes">
          <header>
            <span>ALLOW</span>
            <h3>In scope</h3>
          </header>
          <ul>
            {IN_SCOPE.map((item) => (
              <li key={item.title}>
                <span aria-hidden="true">+</span>
                <div><b>{item.title}</b><p>{item.body}</p></div>
              </li>
            ))}
          </ul>
        </article>
        <article className="rule-column rule-no">
          <header>
            <span>DENY</span>
            <h3>OUT OF SCOPE</h3>
          </header>
          <ul>
            {OUT_OF_SCOPE.map((item) => (
              <li key={item.title}>
                <span aria-hidden="true">×</span>
                <div><b>{item.title}</b><p>{item.body}</p></div>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
