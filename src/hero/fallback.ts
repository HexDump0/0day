/* canvas-2D fallback (no WebGL2): a glyph point cloud of the current model,
   cycling on the same SEQ timings. Managed as a resume/stop pair so the engine
   can pause it when the hero scrolls out of view or the tab is hidden. */
import { RAMP, SEQ } from './constants.ts';
import { fetchPack, type PackData } from './pack.ts';
import type { HeroState } from './state.ts';

export interface FallbackCtx {
  canvas: HTMLCanvasElement;
  hero: HTMLElement;
  hwEl: HTMLElement | null;
  reduced: boolean;
  state: HeroState;
}

export interface Fallback {
  resume: () => void;
  stop: () => void;
}

export function createFallback(ctx: FallbackCtx): Fallback {
  const { canvas, hero, hwEl, reduced, state } = ctx;
  const noop: Fallback = { resume: () => {}, stop: () => {} };
  const gtx = canvas.getContext('2d');
  if (!gtx) return noop;
  const ctx2d = gtx;

  let packData: PackData | null = null;
  let pts: { p: number[]; fit: number } | null = null; // subsampled verts of current model
  let fi = 0;
  let fT0 = 0;
  let rafId = 0;

  function usePoints(i: number) {
    const m = packData && packData[SEQ[i].id];
    if (!m) return;
    const step = Math.max(1, Math.floor(m.verts.length / 3 / 700)) * 3;
    const arr: number[] = [];
    for (let o = 0; o < m.verts.length - 2; o += step)
      arr.push(m.verts[o] / 32767, m.verts[o + 1] / 32767, m.verts[o + 2] / 32767);
    pts = { p: arr, fit: SEQ[i].s * 1.45 / m.radius };
  }

  fetchPack()
    .then((d) => {
      packData = d;
      usePoints(0);
      fT0 = performance.now();
    })
    .catch(() => {});

  function paint(now: number) {
    if (!state.running) return;
    const t = now / 1000;
    const r = hero.getBoundingClientRect();
    if (canvas.width !== (r.width | 0)) {
      canvas.width = r.width;
      canvas.height = r.height;
    }
    const w2 = canvas.width;
    const h2 = canvas.height;
    ctx2d.clearRect(0, 0, w2, h2);
    if (pts) {
      if (!reduced && now > fT0 + SEQ[fi].dur) {
        fi = (fi + 1) % SEQ.length;
        fT0 = now;
        usePoints(fi);
        if (hwEl) hwEl.textContent = SEQ[fi].label;
      }
      ctx2d.font = '12px "Plex Mono", monospace';
      ctx2d.textAlign = 'center';
      const cx = w2 > 900 ? w2 * 0.72 : w2 * 0.5;
      const cy = w2 > 900 ? h2 * 0.48 : h2 * 0.62;
      const sc = Math.min(w2, h2) * 0.34 * pts.fit;
      const yaw = t * SEQ[fi].spin;
      const cyw = Math.cos(yaw);
      const syw = Math.sin(yaw);
      const cp = Math.cos(SEQ[fi].tilt);
      const sp = Math.sin(SEQ[fi].tilt);
      const duck = SEQ[fi].duck;
      for (let i = 0; i < pts.p.length; i += 3) {
        const px = pts.p[i];
        const py = pts.p[i + 1];
        const pz = pts.p[i + 2];
        const x = cyw * px + syw * pz;
        let z = -syw * px + cyw * pz;
        const y = cp * py - sp * z;
        z = sp * py + cp * z;
        const f = 2.4 / (2.9 - z);
        const near = Math.max(0, Math.min(1, z * 0.5 + 0.6));
        ctx2d.fillStyle = duck
          ? `rgba(245,215,66,${(0.2 + near * 0.6).toFixed(2)})`
          : (i % 9 ? `rgba(232,231,224,${(0.1 + near * 0.35).toFixed(2)})`
            : `rgba(198,245,46,${(0.2 + near * 0.6).toFixed(2)})`);
        ctx2d.fillText(RAMP[2 + ((near * 8) | 0)], cx + x * f * sc, cy - y * f * sc);
      }
    }
    if (!reduced) rafId = requestAnimationFrame(paint);
    else state.running = false;
  }

  return {
    resume() {
      if (state.running) return;
      state.running = true;
      rafId = requestAnimationFrame(paint);
    },
    stop() {
      state.running = false;
      cancelAnimationFrame(rafId);
    },
  };
}
