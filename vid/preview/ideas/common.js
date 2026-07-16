/* shared beat clock for all mockups. PERIOD matches beats.json (95.01 bpm). */
const PERIOD = 60 / 95.01; // seconds per beat
const beat = (k) => k * PERIOD; // seconds at beat k (mockups start at beat 0)

function fitStage() {
  const s = document.querySelector('.stage');
  const fit = () => {
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    s.style.transform = `scale(${k})`;
  };
  addEventListener('resize', fit);
  fit();
}

/* run(cb, loopSeconds): calls cb(t) every frame with looping clock t.
   Click the replay button (or press R) to restart.
   ?t=12 in the URL starts the clock 12s in (useful for stills). */
function run(cb, loopSeconds) {
  const skip = parseFloat(new URLSearchParams(location.search).get('t') || '0') * 1000;
  if (skip > 0) document.documentElement.classList.add('jump'); // stills: no tweens
  let start = performance.now() - skip;
  const restart = () => { start = performance.now(); };
  document.querySelector('.replay')?.addEventListener('click', restart);
  addEventListener('keydown', (e) => { if (e.key === 'r') restart(); });
  const tick = (now) => {
    const t = ((now - start) / 1000) % loopSeconds;
    cb(t);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* exp-decaying impulse like lib/timeline.ts: 1.0 at hit, ~0 after `life` s */
function impulse(t, hits, life = 0.22) {
  let best = Infinity;
  for (const h of hits) {
    const d = t - h;
    if (d >= 0 && d < best) best = d;
  }
  return best === Infinity ? 0 : Math.exp((-3 * best) / life);
}

/* show/hide helper: element visible iff t in [from, to) */
function vis(el, on) {
  el.style.visibility = on ? 'visible' : 'hidden';
}
