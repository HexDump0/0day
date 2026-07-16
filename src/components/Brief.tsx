import SectionHead from './SectionHead.tsx';
import Directions from './Directions.tsx';

export default function Brief() {
  return (
    <section id="brief" className="sect brief">
      <SectionHead no="01" title="What is this?" tag="// the whole program" />
      <div className="brief-statement rv">
        <p className="brief-command">
          Do something <span>real</span> in security.
        </p>
        <p className="brief-close">Write it up. Ship it.</p>
      </div>
      <div className="brief-directions">
        <div className="brief-directions-head rv">
          <span>// some ideas</span>
        </div>
        <Directions embedded />
      </div>
    </section>
  );
}
