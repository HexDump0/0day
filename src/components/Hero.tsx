import { useEffect, useRef } from 'react';
import { createHeroEngine } from '../hero/engine.ts';
import { useScramble } from '../hooks/useScramble.ts';

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);

  useScramble(eyebrowRef);

  useEffect(() => {
    const hero = heroRef.current;
    const canvas = canvasRef.current;
    if (!hero || !canvas) return;
    const engine = createHeroEngine(canvas, hero);
    return () => engine.destroy();
  }, []);

  return (
    <section className="hero" id="hero" data-signal="hero" ref={heroRef}>
      <canvas id="fx" aria-hidden="true" ref={canvasRef}></canvas>
      <div className="hero-copy">
        <h1 className="shout">
          <span className="line line-ink">You hack.</span>
          <span className="line line-green">We ship.</span>
        </h1>
        <p className="hero-sub">
          Do anything cybersec: build a tool, find vulns, reverse engineer malware. Write up your work, ship it, and get hacker gear.
        </p>
        <div className="hero-ctas">
          <a className="btn" href="https://hackclub.com/slack" target="_blank" rel="noreferrer">
            <span className="btn-arrow">&gt;</span> RSVP
          </a>
        </div>
      </div>

      <div className="hero-foot">
        <a className="scroll-cue" href="#brief">
          <span className="cue-line" aria-hidden="true"></span>
          <span>Open the brief</span>
        </a>
        <div className="statline" aria-label="program status">
          <span>hw: <b id="hwname">loading&hellip;</b></span>
          <span className="coords" id="coords" aria-hidden="true">x ---- / y ----</span>
        </div>
      </div>
    </section>
  );
}
