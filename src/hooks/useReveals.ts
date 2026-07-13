import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* Scroll-reveal for every `.rv` element — the GSAP replacement for the old
   IntersectionObserver that toggled a `.in` class. Each element fades and rises
   into place once, when its top passes 88% of the viewport. Skipped entirely
   under prefers-reduced-motion (CSS then shows `.rv` at full opacity). */
export function useReveals() {
  useLayoutEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray<HTMLElement>('.rv');
      for (const el of els) {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 22 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          },
        );
      }
    });

    // fonts can shift layout after first paint — recompute trigger positions
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => ctx.revert();
  }, []);
}
