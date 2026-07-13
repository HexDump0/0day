import { useLayoutEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(ScrambleTextPlugin);

/* Resolve an element's text out of random glyph noise on mount — the GSAP
   replacement for the old hand-rolled rAF scrambler on the hero eyebrow.
   Same glyph set as before. No-op under prefers-reduced-motion. */
export function useScramble(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const finalText = el.textContent ?? '';
    const tween = gsap.to(el, {
      duration: 1.1,
      ease: 'none',
      scrambleText: {
        text: finalText,
        chars: '01<>/\\#$%&@!?',
        speed: 0.6,
        revealDelay: 0.15,
      },
    });
    return () => {
      tween.kill();
      el.textContent = finalText; // restore in case we unmount mid-scramble
    };
  }, [ref]);
}
