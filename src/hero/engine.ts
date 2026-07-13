/* 0day — hero engine: HACKER HARDWARE // ASCII.
   A rotating exhibit of hacker hardware — Flipper Zero, HackRF One, a PC-98,
   a Raspberry Pi, a USB stick — cycling on a pedestal of light, rendered
   entirely as type. Each swap rides a corruption burst: geometry slices tear,
   glyph rows shear, and the next device resolves out of the noise. At the end
   of the cycle, briefly, a rubber duck. Quack.
   Pass 1 draws the current model at 4 samples per character cell into two
   targets: lit color, and smooth-normal + linear depth. Lighting is a soft
   three-light key/fill over baked ambient occlusion, using baked smooth vertex
   normals, washed with a slight tint of the model's real material color, plus an
   acid rim and a slow scan of light. Pass 2 is the ASCII shader: it reads the
   normal/depth target to draw oriented outline strokes, then every remaining
   cell samples scene luminance and picks a glyph from a density ramp; where the
   scene is dark, a faint field of running 0day phrases takes over. The cursor
   tumbles the model; clicking surges it.
   Models ship in models/pack.bin (see pack.ts). Raw WebGL2, no libraries.
   Canvas-2D point-cloud fallback (see fallback.ts).

   createHeroEngine(canvas, hero) wires everything and returns { destroy } —
   the caller (a React effect) invokes destroy() on unmount so StrictMode's
   double-mount never leaks a GL context or duplicate listeners. */
import {
  ATLAS_CHARS, CHAR_IDX, EDGE_IDX, PAPER, PHRASES, RAMP, SEPS, SEQ, TUNE,
} from './constants.ts';
import { VS_FULL, VS_MODEL, FS_MODEL, FS_ASCII, FS_BLIT } from './shaders.ts';
import { fetchPack } from './pack.ts';
import { createHeroState } from './state.ts';
import { createFallback } from './fallback.ts';
import { buildTunePanel } from './tune.ts';

interface GLModel {
  vao: WebGLVertexArrayObject;
  count: number;
  type: number;
  radius: number;
}

export interface HeroEngine {
  destroy: () => void;
}

export function createHeroEngine(canvas: HTMLCanvasElement, hero: HTMLElement): HeroEngine {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = createHeroState();
  const cleanups: Array<() => void> = [];

  /* ---------- state ---------- */
  const mouse = { x: 0, y: 0, sx: 0, sy: 0, inside: false };
  let flow = 0; // sweeping-light phase
  let nextAmbient = 0; // next scheduled ambient corruption
  let last = 0;
  let W = 0, H = 0, dpr = 1, wide = true, cwD = 0, chD = 0, sW = 2, sH = 2;
  let rafId = 0;

  let gl: WebGL2RenderingContext = null as unknown as WebGL2RenderingContext;
  let progScene!: WebGLProgram, progAscii!: WebGLProgram, progBlit!: WebGLProgram;
  let fbo!: WebGLFramebuffer, sceneTex!: WebGLTexture, auxTex!: WebGLTexture;
  let atlasTex!: WebGLTexture, mapTex!: WebGLTexture, depthRb!: WebGLRenderbuffer;
  let mapCols = 0, mapRows = 0;
  const U: {
    scene: Record<string, WebGLUniformLocation | null>;
    ascii: Record<string, WebGLUniformLocation | null>;
    blit: Record<string, WebGLUniformLocation | null>;
  } = { scene: {}, ascii: {}, blit: {} };

  // exhibit state: models load async; the cycle starts when they arrive
  let models: GLModel[] | null = null; // by SEQ order
  const hwEl = document.getElementById('hwname');
  // ?hw=duck locks the exhibit to one model (also: how you summon the duck)
  const hwLock = SEQ.findIndex((m) => m.id === new URLSearchParams(location.search).get('hw'));

  function setLabel() {
    if (hwEl) hwEl.textContent = SEQ[state.mi].label;
  }

  function compile(glc: WebGL2RenderingContext, type: number, src: string): WebGLShader {
    const s = glc.createShader(type)!;
    glc.shaderSource(s, src);
    glc.compileShader(s);
    if (!glc.getShaderParameter(s, glc.COMPILE_STATUS))
      throw new Error(glc.getShaderInfoLog(s) ?? 'shader compile failed');
    return s;
  }
  function link(glc: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
    const p = glc.createProgram()!;
    glc.attachShader(p, compile(glc, glc.VERTEX_SHADER, vs));
    glc.attachShader(p, compile(glc, glc.FRAGMENT_SHADER, fs));
    glc.linkProgram(p);
    if (!glc.getProgramParameter(p, glc.LINK_STATUS))
      throw new Error(glc.getProgramInfoLog(p) ?? 'program link failed');
    return p;
  }

  function mat3Rot(pitch: number, yaw: number): Float32Array {
    const cx = Math.cos(pitch), sx = Math.sin(pitch);
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    // Ry * Rx, column-major
    return new Float32Array([
      cy, 0, -sy,
      sx * sy, cx, sx * cy,
      cx * sy, -sx, cx * cy,
    ]);
  }

  async function loadModels() {
    const byId = await fetchPack();
    const lp = gl.getAttribLocation(progScene, 'a_pos');
    const la = gl.getAttribLocation(progScene, 'a_ao');
    const lc = gl.getAttribLocation(progScene, 'a_col');
    const ln = gl.getAttribLocation(progScene, 'a_nrm');
    models = SEQ.map((cfg): GLModel => {
      const m = byId[cfg.id];
      const vao = gl.createVertexArray()!;
      gl.bindVertexArray(vao);
      const vb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vb);
      gl.bufferData(gl.ARRAY_BUFFER, m.verts, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(lp);
      // normalized SHORT: quantized [-32767,32767] -> [-1,1] for free
      gl.vertexAttribPointer(lp, 3, gl.SHORT, true, 0, 0);
      const ab = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, ab);
      gl.bufferData(gl.ARRAY_BUFFER, m.ao, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(la);
      gl.vertexAttribPointer(la, 1, gl.UNSIGNED_BYTE, true, 0, 0); // [0,255] -> [0,1]
      const cb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cb);
      gl.bufferData(gl.ARRAY_BUFFER, m.col, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(lc);
      gl.vertexAttribPointer(lc, 3, gl.UNSIGNED_BYTE, true, 0, 0); // albedo rgb
      const nb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, nb);
      gl.bufferData(gl.ARRAY_BUFFER, m.nrm, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(ln);
      gl.vertexAttribPointer(ln, 3, gl.BYTE, true, 0, 0); // smooth normal [-1,1]
      const ib = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.indices, gl.STATIC_DRAW);
      gl.bindVertexArray(null);
      return {
        vao,
        count: m.indices.length,
        type: m.idx32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
        radius: m.radius, // apparent size = s * 2.05 / radius (live)
      };
    });
    if (hwLock >= 0) state.mi = hwLock;
    state.mT0 = performance.now();
    setLabel();
    if (reduced) { state.running = false; start(); } // repaint the static frame
  }

  function buildAtlas() {
    const n = ATLAS_CHARS.length;
    const c = document.createElement('canvas');
    c.width = n * cwD;
    c.height = chD;
    const g = c.getContext('2d')!;
    g.fillStyle = '#fff';
    g.font = `${Math.round(chD * 0.84)}px "Plex Mono", ui-monospace, monospace`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let i = 0; i < n; i++) g.fillText(ATLAS_CHARS[i], i * cwD + cwD / 2, chD / 2 + 1);
    gl.bindTexture(gl.TEXTURE_2D, atlasTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  // one glyph index per character cell: rows of running phrases
  function buildMap() {
    mapCols = Math.ceil(W / cwD);
    mapRows = Math.ceil(H / chD);
    const rnd = ((s) => () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x80000000))(42);
    const data = new Uint8Array(mapCols * mapRows);
    for (let ry = 0; ry < mapRows; ry++) {
      let line = '';
      let idx = Math.floor(rnd() * PHRASES.length);
      while (line.length < mapCols + 8) {
        line += PHRASES[idx % PHRASES.length] + SEPS[Math.floor(rnd() * SEPS.length)];
        idx += 1 + Math.floor(rnd() * 3);
      }
      const off = Math.floor(rnd() * line.length);
      for (let cx = 0; cx < mapCols; cx++)
        data[ry * mapCols + cx] = CHAR_IDX[line[(cx + off) % line.length]] || 0;
    }
    gl.bindTexture(gl.TEXTURE_2D, mapTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, mapCols, mapRows, 0, gl.RED, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  function initGL(): boolean {
    const ctx = canvas.getContext('webgl2', { alpha: true, antialias: false });
    if (!ctx) return false;
    gl = ctx;
    progScene = link(gl, VS_MODEL, FS_MODEL);
    progAscii = link(gl, VS_FULL, FS_ASCII);
    progBlit = link(gl, VS_FULL, FS_BLIT);
    for (const k of ['u_r3', 'u_d3', 'u_f', 'u_scale', 'u_off', 'u_asp', 'u_glow', 'u_glitch', 'u_time', 'u_flow', 'u_base', 'u_tex',
      'u_amb', 'u_key', 'u_fill', 'u_specP', 'u_specS', 'u_depthB', 'u_depthR'])
      U.scene[k] = gl.getUniformLocation(progScene, k);
    for (const k of ['u_scene', 'u_aux', 'u_atlas', 'u_map', 'u_res', 'u_cell', 'u_mapsize', 'u_n', 'u_ramp', 'u_time', 'u_lod', 'u_glitch', 'u_edge'])
      U.ascii[k] = gl.getUniformLocation(progAscii, k);
    for (const k of ['u_scene', 'u_res', 'u_alpha', 'u_lod'])
      U.blit[k] = gl.getUniformLocation(progBlit, k);

    sceneTex = gl.createTexture()!;
    auxTex = gl.createTexture()!;
    atlasTex = gl.createTexture()!;
    mapTex = gl.createTexture()!;
    fbo = gl.createFramebuffer()!;
    depthRb = gl.createRenderbuffer()!;
    return true;
  }

  function size() {
    const r = hero.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(2, Math.round(r.width * dpr));
    H = Math.max(2, Math.round(r.height * dpr));
    canvas.width = W;
    canvas.height = H;
    wide = r.width > 900;
    cwD = Math.round((wide ? 8 : 7) * dpr);
    chD = Math.round(cwD * 1.7);

    // the model renders at SS samples per character cell. higher SS gives the
    // shading normals far finer footing, so surfaces read as crisp planes.
    const SS = 4;
    sW = Math.ceil(W / cwD) * SS;
    sH = Math.ceil(H / chD) * SS;
    gl.bindTexture(gl.TEXTURE_2D, sceneTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sW, sH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // aux target: view normal + linear depth, sampled at LOD 0 for edge finding
    gl.bindTexture(gl.TEXTURE_2D, auxTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sW, sH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, sW, sH);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, auxTex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRb);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    buildAtlas();
    buildMap();
  }

  function draw(now: number) {
    const t = now / 1000;
    const dt = Math.min((now - last) / 1000, 0.05) || 0;
    last = now;

    // the exhibit cycle: a corruption burst leads each swap by a beat,
    // so the model changes inside the noise
    if (models && !reduced && hwLock < 0 && !state.tuneFreeze) {
      const cfg = SEQ[state.mi];
      if (!state.mPulsed && now >= state.mT0 + cfg.dur - 250) {
        state.pulses.push({ t0: now, amp: 0.85 });
        state.mPulsed = true;
      }
      if (now >= state.mT0 + cfg.dur) {
        state.mi = (state.mi + 1) % SEQ.length;
        state.mT0 = now;
        state.mPulsed = false;
        state.yaw0 = t * SEQ[state.mi].spin; // each model enters at a fresh angle
        setLabel();
      }
    }

    // corruption envelope: scheduled ambient bursts + swap bursts + clicks
    if (!reduced && now >= nextAmbient) {
      state.pulses.push({ t0: now, amp: 0.3 + Math.random() * 0.25 });
      nextAmbient = now + 3600 + Math.random() * 5000;
    }
    state.pulses = state.pulses.filter((p) => now - p.t0 < 900);
    let glitch = 0, boost = 0;
    for (const p of state.pulses) {
      const a = (now - p.t0) / 900;
      glitch = Math.max(glitch, p.amp * Math.sin(Math.min(a * 4.0, 1.0) * Math.PI) * (1 - a * 0.5));
      boost += p.amp * Math.exp(-a * 3.0);
    }
    glitch = Math.min(glitch, 1);
    flow += dt * (1.6 + boost * 9.0); // surges whip the scan around

    const cfg = SEQ[state.mi];
    const yaw = (t * cfg.spin - state.yaw0) - 0.5;
    const pitch = cfg.tilt + Math.sin(t * 0.23) * 0.13;

    /* pass 1 — the model into the low-res scene texture */
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, sW, sH);
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (models) {
      const m = models[state.mi];
      gl.useProgram(progScene);
      gl.uniformMatrix3fv(U.scene.u_r3, false, mat3Rot(pitch, yaw));
      gl.uniform1f(U.scene.u_d3, 2.9);
      gl.uniform1f(U.scene.u_f, 2.4);
      gl.uniform1f(U.scene.u_scale, (wide ? 0.62 : 0.5) * cfg.s * 2.05 / m.radius);
      gl.uniform2f(U.scene.u_off, (wide ? 0.46 : 0) + (cfg.ox || 0), (wide ? -0.03 : -0.1) + (cfg.oy || 0));
      gl.uniform2f(U.scene.u_asp, H / W, 1);
      gl.uniform1f(U.scene.u_glow, (1 + boost * 0.4) * (wide ? 1 : 0.45));
      gl.uniform1f(U.scene.u_glitch, glitch);
      gl.uniform1f(U.scene.u_time, reduced ? 0 : t);
      gl.uniform1f(U.scene.u_flow, flow);
      gl.uniform1f(U.scene.u_amb, TUNE.amb);
      gl.uniform1f(U.scene.u_key, TUNE.key);
      gl.uniform1f(U.scene.u_fill, TUNE.fill);
      gl.uniform1f(U.scene.u_specP, TUNE.specP);
      gl.uniform1f(U.scene.u_specS, TUNE.specS);
      gl.uniform1f(U.scene.u_depthB, TUNE.depthB);
      gl.uniform1f(U.scene.u_depthR, TUNE.depthR);
      // paper base; the per-vertex albedo washes in the real material color.
      // the duck leans warmer so its yellow reads even through the ASCII ramp.
      gl.uniform1f(U.scene.u_tex, cfg.duck ? 0.7 : 0.5);
      if (cfg.duck) gl.uniform3f(U.scene.u_base, 1.0, 0.94, 0.7);
      else gl.uniform3f(U.scene.u_base, PAPER[0], PAPER[1], PAPER[2]);
      gl.bindVertexArray(m.vao);
      gl.drawElements(gl.TRIANGLES, m.count, m.type, 0);
      gl.bindVertexArray(null);
    }
    gl.disable(gl.DEPTH_TEST);

    gl.bindTexture(gl.TEXTURE_2D, sceneTex);
    gl.generateMipmap(gl.TEXTURE_2D);

    /* pass 2 — dim 3D underlay, then the ASCII overlay, both premultiplied */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied compositing

    // underlay: the real render, dim, sitting behind the type
    gl.useProgram(progBlit);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTex);
    gl.uniform1i(U.blit.u_scene, 0);
    gl.uniform2f(U.blit.u_res, W, H);
    gl.uniform1f(U.blit.u_alpha, wide ? TUNE.under : TUNE.under * 0.72);
    gl.uniform1f(U.blit.u_lod, 0.0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.useProgram(progAscii);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTex);
    gl.uniform1i(U.ascii.u_scene, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, atlasTex);
    gl.uniform1i(U.ascii.u_atlas, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, mapTex);
    gl.uniform1i(U.ascii.u_map, 2);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, auxTex);
    gl.uniform1i(U.ascii.u_aux, 3);
    gl.uniform2f(U.ascii.u_res, W, H);
    gl.uniform2f(U.ascii.u_cell, cwD, chD);
    gl.uniform2f(U.ascii.u_mapsize, mapCols, mapRows);
    gl.uniform1f(U.ascii.u_n, ATLAS_CHARS.length);
    gl.uniform1f(U.ascii.u_ramp, RAMP.length);
    gl.uniform1f(U.ascii.u_time, reduced ? 0 : t);
    gl.uniform1f(U.ascii.u_lod, 2.0); // SS=4 -> average 4x down to ~1 sample/cell
    gl.uniform1f(U.ascii.u_glitch, glitch);
    gl.uniform4f(U.ascii.u_edge, EDGE_IDX[0], EDGE_IDX[1], EDGE_IDX[2], EDGE_IDX[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
  }

  function frame(now: number) {
    if (!state.running) return;
    draw(now);
    if (reduced) { state.running = false; return; }
    rafId = requestAnimationFrame(frame);
  }
  function start() {
    if (state.running || !state.visible) return;
    state.running = true;
    last = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  /* ---------- wiring ---------- */
  let usingGL = false;
  try { usingGL = initGL(); } catch { usingGL = false; }
  let fallback: ReturnType<typeof createFallback> | null = null;

  const onResize = () => { size(); if (reduced) { state.running = false; start(); } };

  if (usingGL) {
    size();
    loadModels().catch(() => { models = null; });
    if (document.fonts && document.fonts.ready)
      document.fonts.ready.then(() => { buildAtlas(); if (reduced) { state.running = false; start(); } });
    addEventListener('resize', onResize);
    cleanups.push(() => removeEventListener('resize', onResize));
    start();
  } else {
    fallback = createFallback({ canvas, hero, hwEl, reduced, state });
    fallback.resume();
  }

  const onPointerMove = (e: PointerEvent) => {
    const r = hero.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    mouse.x = (px / r.width) * 2 - 1;
    mouse.y = (py / r.height) * 2 - 1;
    mouse.inside = true;
    const coords = document.getElementById('coords');
    if (coords)
      coords.textContent =
        `x ${String(Math.round(px)).padStart(4, '0')} / y ${String(Math.round(py)).padStart(4, '0')}`;
  };
  const onPointerLeave = () => { mouse.inside = false; };
  const onPointerDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('a') || reduced) return;
    state.pulses.push({ t0: performance.now(), amp: 1 });
  };
  hero.addEventListener('pointermove', onPointerMove);
  hero.addEventListener('pointerleave', onPointerLeave);
  hero.addEventListener('pointerdown', onPointerDown);
  cleanups.push(() => {
    hero.removeEventListener('pointermove', onPointerMove);
    hero.removeEventListener('pointerleave', onPointerLeave);
    hero.removeEventListener('pointerdown', onPointerDown);
  });

  const vis = new IntersectionObserver(([en]) => {
    state.visible = en.isIntersecting;
    if (state.visible) {
      if (usingGL) start();
      else fallback?.resume();
    } else state.running = false;
  });
  vis.observe(hero);
  cleanups.push(() => vis.disconnect());

  const onVisibility = () => {
    if (document.hidden) state.running = false;
    else if (usingGL) start();
    else fallback?.resume();
  };
  document.addEventListener('visibilitychange', onVisibility);
  cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));

  /* ---------- dev tuning panel (?tune) ---------- */
  if (new URLSearchParams(location.search).has('tune'))
    cleanups.push(buildTunePanel({ state, setLabel }));

  /* ---------- teardown ---------- */
  return {
    destroy() {
      state.running = false;
      cancelAnimationFrame(rafId);
      fallback?.stop();
      for (const fn of cleanups) fn();
      // NB: deliberately do NOT call WEBGL_lose_context here. React StrictMode
      // mounts, cleans up, then remounts on the SAME canvas — and once a
      // context is lost, getContext('webgl2') returns that dead context forever
      // (blank canvas). Stopping the loop + listeners is enough; the browser
      // reclaims the context when the canvas leaves the DOM on real unmount.
    },
  };
}
