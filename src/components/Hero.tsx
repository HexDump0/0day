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
    <section className="hero" id="hero" ref={heroRef}>
      <canvas id="fx" aria-hidden="true" ref={canvasRef}></canvas>
      <div className="hero-copy">
        <p className="eyebrow" ref={eyebrowRef}>// YSWS program by Hack Club</p>
        <h1 className="shout">
          <span className="line line-ink">You ship.</span>
          <span className="line line-green">We ship.</span>
        </h1>
        <p className="hero-sub">
          Build a security tool, or break into real code. Ship it — and Hack&nbsp;Club ships
          you something that takes you deeper.
        </p>
        <div className="hero-ctas">
          <a className="btn" href="https://hackclub.com/slack" target="_blank" rel="noreferrer">
            <span className="btn-arrow">&gt;</span> Apply now
          </a>
          <span className="hero-hint" aria-hidden="true">[ click to surge ]</span>
        </div>
      </div>

      <div className="hero-foot">
        <a className="scroll-cue" href="#program">
          <span className="cue-line"></span>
          <span>Scroll down</span>
        </a>
        <div className="statline" aria-label="program status">
          <span>hw: <b id="hwname">loading&hellip;</b></span>
          <span>status: <b>open</b></span>
          <span>tracks: <b>02</b></span>
          <span>age: <b>&le;18</b></span>
          <span>missions: <b>&infin;</b></span>
          <span className="coords" id="coords" aria-hidden="true">x ---- / y ----</span>
        </div>
      </div>
    </section>
  );
}
