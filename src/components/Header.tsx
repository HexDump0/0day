import { APPLY_URL, NAV } from '../data/content.ts';

export default function Header() {
  return (
    <header className="top">
      <a className="brand" href="#top">0day<span className="brand-tick">_</span></a>
      <nav aria-label="primary">
        {NAV.map((link) => (
          <a key={link.href} href={link.href}>{link.label}</a>
        ))}
      </nav>
      <a className="apply" href={APPLY_URL} target="_blank" rel="noreferrer">RSVP</a>
    </header>
  );
}
