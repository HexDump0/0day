import { APPLY_URL } from '../data/content.ts';

export default function Footer() {
  return (
    <footer className="foot">
      <span><b>0day</b> — a <a href="https://hackclub.com" target="_blank" rel="noreferrer">Hack Club</a> YSWS</span>
      <span className="foot-mid">disclose responsibly, always</span>
      <a href={APPLY_URL} target="_blank" rel="noreferrer">hackclub.com/slack</a>
    </footer>
  );
}
