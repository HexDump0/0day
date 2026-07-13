import SectionHead from './SectionHead.tsx';
import { APPLY_URL, TRACKS } from '../data/content.ts';

export default function Tracks() {
  return (
    <section id="tracks" className="sect">
      <SectionHead no="02" title="Tracks" tag="// pick one" />
      <div className="tracks corners rv">
        {TRACKS.map((track) => (
          <article className="track" key={track.no}>
            <header>
              <span className="track-no">{track.no}</span>
              <h3>{track.title}</h3>
              <p className="track-sub">{track.sub}</p>
            </header>
            <p>{track.lead}</p>
            <ul>
              {track.items.map((item) => (
                <li key={item.term}><b>{item.term}</b> — {item.desc}</li>
              ))}
            </ul>
            <footer>
              <span>{track.deliverable}</span>
              <a href={APPLY_URL} target="_blank" rel="noreferrer">begin &gt;</a>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
