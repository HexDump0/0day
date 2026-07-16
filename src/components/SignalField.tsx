import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  glyph: string;
  target: number;
  locked: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface SignalConfig {
  text: string;
  x: number;
  y: number;
  scale?: number;
}

const GLYPHS = '01<>/_+#$%&@!?';
const SIGNALS: Record<string, SignalConfig | null> = {
  hero: null,
  brief: { text: 'ORIGINAL', x: 0.72, y: 0.56, scale: 0.88 },
  proof: { text: 'WRITEUP.md', x: 0.51, y: 0.55, scale: 0.82 },
  rules: { text: 'ALLOW|DENY', x: 0.5, y: 0.52, scale: 0.74 },
  how: { text: 'MAKE→SHIP', x: 0.62, y: 0.54, scale: 0.78 },
  faq: { text: '?', x: 0.76, y: 0.54, scale: 1.35 },
  join: { text: '0DAY_', x: 0.5, y: 0.52, scale: 1.05 },
};

function glyphAt(index: number) {
  return GLYPHS[index % GLYPHS.length];
}

export default function SignalField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = matchMedia('(pointer: coarse)');
    const pointer = { x: -9999, y: -9999, px: -9999, py: -9999, speed: 0, pulse: 0 };
    let particles: Particle[] = [];
    let targets: Point[] = [];
    let activeKey = 'hero';
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let last = performance.now();
    let sectionTick = 0;
    let hidden = document.hidden;
    let disposed = false;

    const random = (min: number, max: number) => min + Math.random() * (max - min);

    const createParticles = () => {
      const divisor = coarse.matches ? 9000 : 3400;
      const count = Math.max(76, Math.min(coarse.matches ? 125 : 420, Math.floor(width * height / divisor)));
      particles = Array.from({ length: count }, (_, index) => ({
        x: random(0, width),
        y: random(0, height),
        vx: random(-0.12, 0.12),
        vy: random(-0.12, 0.12),
        size: random(9, 14),
        phase: random(0, Math.PI * 2),
        glyph: glyphAt(index * 7),
        target: index,
        locked: index % 7 !== 0,
      }));
    };

    const buildTargets = (config: SignalConfig | null) => {
      targets = [];
      if (!config) return;

      const offscreen = document.createElement('canvas');
      offscreen.width = Math.max(1, Math.round(width));
      offscreen.height = Math.max(1, Math.round(height));
      const paint = offscreen.getContext('2d', { willReadFrequently: true });
      if (!paint) return;

      const lines = config.text.split('|');
      const longest = lines.reduce((max, line) => Math.max(max, line.length), 1);
      const scale = config.scale ?? 1;
      const fontSize = Math.max(
        58,
        Math.min(220, width / (longest * 0.58), height * 0.26) * scale,
      );
      const lineHeight = fontSize * 0.82;

      paint.clearRect(0, 0, width, height);
      paint.fillStyle = '#fff';
      paint.textAlign = 'center';
      paint.textBaseline = 'middle';
      paint.font = `900 ${fontSize}px "Doto", "Plex Mono", monospace`;
      const startY = config.y * height - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, index) => {
        paint.fillText(line, config.x * width, startY + index * lineHeight);
      });

      const data = paint.getImageData(0, 0, offscreen.width, offscreen.height).data;
      const stride = coarse.matches ? 10 : 7;
      const points: Point[] = [];
      for (let y = 0; y < offscreen.height; y += stride) {
        for (let x = 0; x < offscreen.width; x += stride) {
          if (data[(y * offscreen.width + x) * 4 + 3] > 96) points.push({ x, y });
        }
      }
      if (!points.length) return;

      targets = particles.map((_, index) => {
        const point = points[(index * 97 + index * index * 13) % points.length];
        return { x: point.x + random(-2.5, 2.5), y: point.y + random(-2.5, 2.5) };
      });
    };

    const detectSection = () => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-signal]'));
      const center = height * 0.52;
      let bestKey = 'hero';
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        const distance = rect.top <= center && rect.bottom >= center
          ? 0
          : Math.min(Math.abs(rect.top - center), Math.abs(rect.bottom - center));
        if (distance < bestDistance) {
          bestDistance = distance;
          bestKey = section.dataset.signal ?? 'hero';
        }
      }

      if (bestKey !== activeKey) {
        activeKey = bestKey;
        buildTargets(SIGNALS[activeKey] ?? null);
        canvas.dataset.mode = activeKey;
      }
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(devicePixelRatio || 1, coarse.matches ? 1.25 : 1.6);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
      detectSection();
      buildTargets(SIGNALS[activeKey] ?? null);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.px = pointer.x;
      pointer.py = pointer.y;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.speed = Math.min(42, Math.hypot(pointer.x - pointer.px, pointer.y - pointer.py));
    };
    const onPointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
      pointer.speed = 0;
    };
    const onPointerDown = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.pulse = 1;
    };
    const onVisibility = () => {
      hidden = document.hidden;
      if (!hidden && !raf && !reduced.matches) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };

    const renderParticle = (particle: Particle, time: number, targetMode: boolean) => {
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const pointerHeat = Math.max(0, 1 - distance / 170);
      const settle = targetMode && particle.locked && targets.length
        ? Math.max(0, 1 - Math.hypot(
            particle.x - targets[particle.target % targets.length].x,
            particle.y - targets[particle.target % targets.length].y,
          ) / 80)
        : 0;
      const alpha = 0.02 + settle * 0.27 + pointerHeat * 0.42;
      const acid = pointerHeat > 0.08 || (settle > 0.82 && particle.target % 11 === 0);

      ctx.fillStyle = acid
        ? `rgba(198,245,46,${alpha})`
        : `rgba(232,231,224,${alpha})`;
      ctx.font = `${particle.size + pointerHeat * 3}px "Plex Mono", monospace`;
      ctx.fillText(particle.glyph, particle.x, particle.y + Math.sin(time * 0.0016 + particle.phase) * 1.6);
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      const targetMode = Boolean(SIGNALS[activeKey]);
      particles.forEach((particle, index) => {
        if (targetMode && particle.locked && targets.length) {
          const target = targets[index % targets.length];
          particle.x = target.x;
          particle.y = target.y;
        }
        renderParticle(particle, 0, targetMode);
      });
    };

    function draw(now: number) {
      raf = 0;
      if (hidden || reduced.matches) return;

      const dt = Math.min(2.2, (now - last) / 16.667);
      last = now;
      sectionTick += dt;
      if (sectionTick > 10) {
        detectSection();
        sectionTick = 0;
      }

      ctx.clearRect(0, 0, width, height);
      const config = SIGNALS[activeKey] ?? null;
      const targetMode = Boolean(config && targets.length);
      const repelRadius = 155 + pointer.speed * 1.5;
      const visibleCount = activeKey === 'hero'
        ? Math.min(particles.length, coarse.matches ? 54 : 110)
        : particles.length;

      for (let index = 0; index < visibleCount; index++) {
        const particle = particles[index];
        if (targetMode && particle.locked) {
          const target = targets[particle.target % targets.length];
          particle.vx += (target.x - particle.x) * 0.016 * dt;
          particle.vy += (target.y - particle.y) * 0.016 * dt;
        } else {
          const flow = now * 0.00014 + particle.phase;
          particle.vx += Math.cos(flow + particle.y * 0.004) * 0.008 * dt;
          particle.vy += Math.sin(flow + particle.x * 0.003) * 0.008 * dt;
        }

        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < repelRadius && distance > 0.1) {
          const force = (1 - distance / repelRadius) * (0.24 + pointer.speed * 0.018);
          particle.vx += (dx / distance) * force * dt;
          particle.vy += (dy / distance) * force * dt;
          if ((index + Math.floor(now / 90)) % 5 === 0) particle.glyph = glyphAt(index + Math.floor(now / 80));
        }

        particle.vx *= Math.pow(targetMode && particle.locked ? 0.82 : 0.965, dt);
        particle.vy *= Math.pow(targetMode && particle.locked ? 0.82 : 0.965, dt);
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;

        if (!particle.locked || !targetMode) {
          if (particle.x < -30) particle.x = width + 30;
          if (particle.x > width + 30) particle.x = -30;
          if (particle.y < -30) particle.y = height + 30;
          if (particle.y > height + 30) particle.y = -30;
        }

        renderParticle(particle, now, targetMode);
      }

      if (pointer.pulse > 0.005) {
        const radius = (1 - pointer.pulse) * 220 + 18;
        ctx.strokeStyle = `rgba(198,245,46,${pointer.pulse * 0.26})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        pointer.pulse *= Math.pow(0.91, dt);
      }
      pointer.speed *= Math.pow(0.82, dt);
      raf = requestAnimationFrame(draw);
    }

    const onMotionChange = () => {
      if (reduced.matches) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        detectSection();
        drawStatic();
      } else if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };
    const onScroll = () => {
      if (!reduced.matches) return;
      detectSection();
      drawStatic();
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    reduced.addEventListener('change', onMotionChange);
    coarse.addEventListener('change', resize);

    document.fonts?.ready.then(() => {
      if (disposed) return;
      resize();
      if (reduced.matches) drawStatic();
    });
    resize();
    if (reduced.matches) drawStatic();
    else raf = requestAnimationFrame(draw);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      reduced.removeEventListener('change', onMotionChange);
      coarse.removeEventListener('change', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="signal-field" aria-hidden="true" />;
}
