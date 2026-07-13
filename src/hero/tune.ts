/* dev tuning panel (?tune) — live sliders for the shader knobs + per-model
   placement. Not shown to real visitors. Tune, hit "copy", paste the block back
   to have the values baked into constants.ts. Returns a cleanup that removes the
   panel and clears its sync interval. */
import { SEQ, TUNE, type SeqItem, type TuneKnobs } from './constants.ts';
import type { HeroState } from './state.ts';

export interface TuneCtx {
  state: HeroState;
  setLabel: () => void;
}

export function buildTunePanel(ctx: TuneCtx): () => void {
  const { state, setLabel } = ctx;

  const GLOBAL: [keyof TuneKnobs, number, number, number][] = [
    ['amb', 0, 0.5, 0.01], ['key', 0, 1.6, 0.02], ['fill', 0, 0.6, 0.01],
    ['specP', 2, 120, 1], ['specS', 0, 1.5, 0.02],
    ['depthB', 0, 1, 0.01], ['depthR', 0, 1.2, 0.02], ['under', 0, 0.6, 0.01],
  ];
  const PER: [keyof SeqItem, number, number, number][] = [
    ['s', 0.4, 2.0, 0.01], ['spin', 0, 1.2, 0.01], ['tilt', -0.8, 0.8, 0.01],
    ['ox', -0.6, 0.6, 0.01], ['oy', -0.6, 0.6, 0.01],
  ];
  const css = `position:fixed;top:12px;right:12px;z-index:9999;width:250px;
    background:rgba(12,12,10,.94);border:1px solid #c6f52e;border-radius:6px;
    padding:10px 12px;font:11px/1.4 ui-monospace,monospace;color:#e8e7e0;
    max-height:94vh;overflow:auto;box-shadow:0 8px 40px rgba(0,0,0,.6)`;
  const panel = document.createElement('div');
  panel.setAttribute('style', css);
  // draggable title bar
  const bar = document.createElement('div');
  bar.textContent = '⠿ TUNE PANEL';
  bar.style.cssText = 'color:#c6f52e;font-weight:700;letter-spacing:.08em;margin:-4px -4px 6px;padding:4px;cursor:move;user-select:none';
  panel.append(bar);
  bar.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const r = panel.getBoundingClientRect();
    const dx = e.clientX - r.left;
    const dy = e.clientY - r.top;
    panel.style.right = 'auto';
    panel.style.left = r.left + 'px';
    panel.style.top = r.top + 'px';
    bar.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      panel.style.left = Math.max(0, Math.min(innerWidth - 40, ev.clientX - dx)) + 'px';
      panel.style.top = Math.max(0, Math.min(innerHeight - 20, ev.clientY - dy)) + 'px';
    };
    const up = () => {
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', up);
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', up);
  });

  // a slider row whose target object/key can be re-pointed via bind()
  const row = (label: string) => {
    const wrap = document.createElement('label');
    wrap.style.cssText = 'display:grid;grid-template-columns:58px 1fr 40px;gap:6px;align-items:center;margin:2px 0';
    const nm = document.createElement('span');
    nm.textContent = label;
    nm.style.opacity = '.8';
    const sl = document.createElement('input');
    sl.type = 'range';
    sl.style.cssText = 'width:100%;accent-color:#c6f52e';
    const val = document.createElement('span');
    val.style.cssText = 'text-align:right;color:#c6f52e';
    let obj: Record<string, number> | null = null;
    let key = '';
    sl.addEventListener('input', () => {
      if (!obj) return;
      obj[key] = parseFloat(sl.value);
      val.textContent = obj[key].toFixed(2);
    });
    wrap.append(nm, sl, val);
    const bind = (o: Record<string, number>, k: string, min: number, max: number, step: number) => {
      obj = o;
      key = k;
      sl.min = String(min);
      sl.max = String(max);
      sl.step = String(step);
      sl.value = String(o[k]);
      val.textContent = (+o[k]).toFixed(2);
    };
    return { wrap, bind };
  };

  // global section
  const gHead = document.createElement('div');
  gHead.textContent = 'global shader';
  gHead.style.cssText = 'margin:8px 0 2px;opacity:.6;text-transform:uppercase;letter-spacing:.08em';
  panel.append(gHead);
  for (const [k, mn, mx, st] of GLOBAL) {
    const r = row(k);
    r.bind(TUNE as unknown as Record<string, number>, k, mn, mx, st);
    panel.append(r.wrap);
  }

  // model selector + freeze
  const mHead = document.createElement('div');
  mHead.style.cssText = 'margin:10px 0 4px;opacity:.6;text-transform:uppercase;letter-spacing:.08em';
  mHead.textContent = 'model';
  panel.append(mHead);
  const sel = document.createElement('select');
  sel.style.cssText = 'width:100%;margin-bottom:6px;background:#161616;color:#e8e7e0;border:1px solid #444;padding:3px';
  sel.innerHTML = `<option value="-1">▸ cycle (live)</option>` +
    SEQ.map((m, i) => `<option value="${i}">${m.id}</option>`).join('');
  panel.append(sel);

  const perRows = PER.map(([k, mn, mx, st]) => ({ k, mn, mx, st, r: row(k) }));
  for (const p of perRows) panel.append(p.r.wrap);
  // point the per-model rows at whichever model is current
  const rebind = () => {
    for (const p of perRows)
      p.r.bind(SEQ[state.mi] as unknown as Record<string, number>, p.k, p.mn, p.mx, p.st);
  };
  rebind();
  sel.addEventListener('change', () => {
    const v = parseInt(sel.value, 10);
    if (v < 0) {
      state.tuneFreeze = false;
    } else {
      state.mi = v;
      state.mT0 = performance.now();
      state.mPulsed = true;
      state.tuneFreeze = true;
      setLabel();
      rebind();
    }
  });
  // when the cycle advances on its own, keep the per-model sliders in sync
  let lastMi = state.mi;
  const syncTimer = setInterval(() => {
    if (state.mi !== lastMi) {
      lastMi = state.mi;
      if (!state.tuneFreeze) rebind();
    }
  }, 200);

  // copy-out
  const btn = document.createElement('button');
  btn.textContent = 'copy values';
  btn.style.cssText = 'width:100%;margin-top:10px;background:#c6f52e;color:#161616;border:0;padding:6px;font:700 11px ui-monospace,monospace;cursor:pointer;border-radius:4px';
  btn.addEventListener('click', () => {
    const g = GLOBAL.map(([k]) => `${k}=${(+TUNE[k]).toFixed(3)}`).join(' ');
    const lines = ['TUNE: ' + g];
    for (const m of SEQ)
      lines.push(`${m.id}: s=${m.s.toFixed(2)} spin=${m.spin.toFixed(2)} tilt=${m.tilt.toFixed(2)} ox=${(m.ox || 0).toFixed(2)} oy=${(m.oy || 0).toFixed(2)}`);
    const text = lines.join('\n');
    navigator.clipboard?.writeText(text).then(
      () => { btn.textContent = 'copied ✓'; setTimeout(() => (btn.textContent = 'copy values'), 1200); },
      () => { prompt('copy these values:', text); },
    );
  });
  panel.append(btn);

  const hint = document.createElement('div');
  hint.style.cssText = 'margin-top:6px;opacity:.5;font-size:10px';
  hint.textContent = 'pick a model to freeze it while tuning';
  panel.append(hint);

  document.body.append(panel);

  return () => {
    clearInterval(syncTimer);
    panel.remove();
  };
}
