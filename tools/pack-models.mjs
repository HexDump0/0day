/* deps: npm i @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions meshoptimizer jpeg-js pngjs */
/* Pack hero models: simplify -> bake world transforms + per-vertex albedo ->
   normalize -> quantize int16 -> single binary with JSON manifest.
   Format: [u32 magic 'A5CI'][u32 jsonLen][json][payload (4-aligned)]
   Per model: positions int16 xyz, ao u8, color u8 rgb, indices u16/u32. */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, weld, simplify } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { readFileSync, writeFileSync } from 'node:fs';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

function multiply(out, a, b) { // column-major mat4: out = a * b
  out.length = 16;
  for (let col = 0; col < 4; col++)
    for (let row = 0; row < 4; row++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + row] * b[col * 4 + k];
      out[col * 4 + row] = s;
    }
  return out;
}

const SRC = new URL('../models', import.meta.url).pathname;
const OUT = new URL('../public/models/pack.bin', import.meta.url).pathname;
const TARGET_TRIS = 14000;

const MODELS = [
  { id: 'flipper', file: 'flipper_zero.glb', rot: [90, 0, 90] },
  { id: 'hackrf', file: 'hack_rf.glb' },
  { id: 'pc98', file: 'pc-9801ux.glb' },
  { id: 'rpi', file: 'raspberry_pi_5_-_schematic_model.glb', rot: [90, 0, 0] },
  { id: 'usb', file: 'usb_stick.glb' },
  { id: 'duck', file: 'rubber_duck.glb' },
];

await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

function mat4MulVec3(m, v) {
  const x = v[0], y = v[1], z = v[2];
  const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
  return [
    (m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
    (m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
    (m[2] * x + m[6] * y + m[10] * z + m[14]) / w,
  ];
}

/* decode a glTF Texture node -> {w,h,data:RGBA u8}, cached per node */
const texCache = new Map();
function decodeTexture(tex) {
  if (!tex) return null;
  if (texCache.has(tex)) return texCache.get(tex);
  const bytes = tex.getImage();
  if (!bytes) { texCache.set(tex, null); return null; }
  let img = null;
  try {
    const mime = tex.getMimeType();
    if (mime === 'image/jpeg') {
      const d = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
      img = { w: d.width, h: d.height, data: d.data };
    } else if (mime === 'image/png') {
      const p = PNG.sync.read(Buffer.from(bytes));
      img = { w: p.width, h: p.height, data: p.data };
    }
  } catch { img = null; }
  texCache.set(tex, img);
  return img;
}
// bilinear-ish nearest sample, UVs wrapped; glTF V axis is top-down
function sampleTex(img, u, v) {
  const wrap = (x) => x - Math.floor(x);
  const px = Math.min(img.w - 1, Math.floor(wrap(u) * img.w));
  const py = Math.min(img.h - 1, Math.floor(wrap(v) * img.h));
  const o = (py * img.w + px) * 4;
  return [img.data[o] / 255, img.data[o + 1] / 255, img.data[o + 2] / 255];
}

/* GLB -> {pos, col} triangle soups (Float32Array xyz / rgb, 3 verts per tri),
   world space. col = per-material baseColorFactor * baseColorTexture(uv). */
async function loadGlbSoup(path) {
  const doc = await io.read(path);
  // pre-simplify per primitive to keep memory sane
  let total = 0;
  const root = doc.getRoot();
  for (const mesh of root.listMeshes())
    for (const prim of mesh.listPrimitives())
      if (prim.getMode() === 4)
        total += (prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION').getCount()) / 3;
  const ratio = Math.min(1, (TARGET_TRIS * 1.5) / total);
  await doc.transform(
    dedup(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.001, lockBorder: false }),
  );
  const pos = [], col = [];
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const visit = (node, parentMat) => {
    const local = node.getMatrix();
    const world = multiply([], parentMat, local);
    const mesh = node.getMesh();
    if (mesh) {
      for (const prim of mesh.listPrimitives()) {
        if (prim.getMode() !== 4) continue;
        const posArr = prim.getAttribute('POSITION').getArray();
        const uvArr = prim.getAttribute('TEXCOORD_0')?.getArray();
        const mat = prim.getMaterial();
        const factor = mat ? mat.getBaseColorFactor() : [0.8, 0.8, 0.8, 1];
        const img = mat ? decodeTexture(mat.getBaseColorTexture()) : null;
        const idx = prim.getIndices()?.getArray() ??
          Uint32Array.from({ length: posArr.length / 3 }, (_, i) => i);
        for (const i of idx) {
          const p = mat4MulVec3(world, [posArr[i * 3], posArr[i * 3 + 1], posArr[i * 3 + 2]]);
          pos.push(p[0], p[1], p[2]);
          let r = factor[0], g = factor[1], b = factor[2];
          if (img && uvArr) {
            const s = sampleTex(img, uvArr[i * 2], uvArr[i * 2 + 1]);
            r *= s[0]; g *= s[1]; b *= s[2];
          }
          col.push(r, g, b);
        }
      }
    }
    for (const child of node.listChildren()) visit(child, world);
  };
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  for (const node of scene.listChildren()) visit(node, I);
  return { pos: new Float32Array(pos), col: new Float32Array(col) };
}

/* binary STL -> {pos, col} soup, rotated Z-up -> Y-up. STL carries no color,
   so tint with a faint PCB green (the Pi) — subtle, just a hint of material. */
function loadStlSoup(path, tint = [0.42, 0.55, 0.42]) {
  const buf = readFileSync(path);
  const triCount = buf.readUInt32LE(80);
  const pos = new Float32Array(triCount * 9);
  const col = new Float32Array(triCount * 9);
  for (let t = 0; t < triCount; t++) {
    const base = 84 + t * 50 + 12; // skip normal
    for (let v = 0; v < 3; v++) {
      const o = base + v * 12;
      const x = buf.readFloatLE(o), y = buf.readFloatLE(o + 4), z = buf.readFloatLE(o + 8);
      pos.set([x, z, -y], (t * 3 + v) * 3); // Z-up -> Y-up
      col.set(tint, (t * 3 + v) * 3);
    }
  }
  return { pos, col };
}

/* weld soups -> indexed, simplify to target, normalize, quantize */
function pack(soup, colSoup) {
  // weld by rounded position; carry the first color seen at each position
  const map = new Map();
  const verts = [];
  const vcols = [];
  let indices = new Uint32Array(soup.length / 3);
  for (let i = 0; i < soup.length / 3; i++) {
    const k = `${Math.round(soup[i * 3] * 1e5)},${Math.round(soup[i * 3 + 1] * 1e5)},${Math.round(soup[i * 3 + 2] * 1e5)}`;
    let vi = map.get(k);
    if (vi === undefined) {
      vi = verts.length / 3;
      map.set(k, vi);
      verts.push(soup[i * 3], soup[i * 3 + 1], soup[i * 3 + 2]);
      vcols.push(colSoup[i * 3], colSoup[i * 3 + 1], colSoup[i * 3 + 2]);
    }
    indices[i] = vi;
  }
  let positions = new Float32Array(verts);
  let colors = new Float32Array(vcols);
  // simplify to target
  if (indices.length / 3 > TARGET_TRIS) {
    const [simplified] = MeshoptSimplifier.simplify(
      indices, positions, 3, TARGET_TRIS * 3, 0.01, []);
    indices = simplified;
    if (indices.length / 3 > TARGET_TRIS * 1.4) {
      const [again] = MeshoptSimplifier.simplify(
        indices, positions, 3, TARGET_TRIS * 3, 0.05, []);
      indices = again;
    }
  }
  // drop unreferenced verts (simplify keeps a subset — colors stay valid)
  const used = new Map();
  const np = [], nc = [];
  const ni = new Uint32Array(indices.length);
  for (let i = 0; i < indices.length; i++) {
    let vi = used.get(indices[i]);
    if (vi === undefined) {
      vi = np.length / 3;
      used.set(indices[i], vi);
      const s = indices[i] * 3;
      np.push(positions[s], positions[s + 1], positions[s + 2]);
      nc.push(colors[s], colors[s + 1], colors[s + 2]);
    }
    ni[i] = vi;
  }
  positions = new Float32Array(np);
  colors = new Float32Array(nc);
  indices = ni;
  // normalize: center bbox, max half-extent -> 1
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3)
    for (let a = 0; a < 3; a++) {
      mn[a] = Math.min(mn[a], positions[i + a]);
      mx[a] = Math.max(mx[a], positions[i + a]);
    }
  const c = mn.map((v, a) => (v + mx[a]) / 2);
  const ext = Math.max(mx[0] - c[0], mx[1] - c[1], mx[2] - c[2]);
  let radius = 0;
  const q = new Int16Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    let r2 = 0;
    for (let a = 0; a < 3; a++) {
      const v = (positions[i + a] - c[a]) / ext;
      r2 += v * v;
      q[i + a] = Math.max(-32767, Math.min(32767, Math.round(v * 32767)));
    }
    radius = Math.max(radius, Math.sqrt(r2));
  }
  const wide = positions.length / 3 > 65535;
  const idxOut = wide ? indices : Uint16Array.from(indices);
  const dims = [0, 1, 2].map(a => +((mx[a] - mn[a]) / ext).toFixed(4));
  const norm = new Float32Array(positions.length);
  for (let i = 0; i < norm.length; i += 3)
    for (let a = 0; a < 3; a++) norm[i + a] = (positions[i + a] - c[a]) / ext;
  const ao = bakeAO(norm, indices);
  const nrm = computeNormals(norm, indices);
  const cq = new Uint8Array(colors.length);
  for (let i = 0; i < colors.length; i++)
    cq[i] = Math.max(0, Math.min(255, Math.round(colors[i] * 255)));
  return { q, idxOut, wide, radius: +radius.toFixed(4), dims, ao, col: cq, nrm };
}

/* smooth per-vertex normals: area-weighted sum of adjacent face normals,
   quantized to signed int8. Welded verts share one normal -> smooth shading
   (curves read round; the flat face normal, kept in-shader, still finds creases). */
function computeNormals(pos, indices) {
  const acc = new Float32Array(pos.length);
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t], b = indices[t + 1], c = indices[t + 2];
    const ux = pos[b * 3] - pos[a * 3], uy = pos[b * 3 + 1] - pos[a * 3 + 1], uz = pos[b * 3 + 2] - pos[a * 3 + 2];
    const vx = pos[c * 3] - pos[a * 3], vy = pos[c * 3 + 1] - pos[a * 3 + 1], vz = pos[c * 3 + 2] - pos[a * 3 + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; // area-weighted
    for (const vi of [a, b, c]) { acc[vi * 3] += nx; acc[vi * 3 + 1] += ny; acc[vi * 3 + 2] += nz; }
  }
  const out = new Int8Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) {
    let x = acc[i], y = acc[i + 1], z = acc[i + 2];
    const L = Math.hypot(x, y, z) || 1;
    out[i] = Math.max(-127, Math.min(127, Math.round(x / L * 127)));
    out[i + 1] = Math.max(-127, Math.min(127, Math.round(y / L * 127)));
    out[i + 2] = Math.max(-127, Math.min(127, Math.round(z / L * 127)));
  }
  return out;
}

/* per-vertex ambient occlusion via depth maps: for each of 64 sphere
   directions, rasterize a max-depth grid and test each vertex against it.
   255 = fully lit. Positions must be normalized (max half-extent 1). */
function bakeAO(positions, indices) {
  const nVerts = positions.length / 3;
  const DIRS = 64, RES = 128, EXT = 1.8, EPS = 0.02;
  const lit = new Float32Array(nVerts);
  const zbuf = new Float32Array(RES * RES);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let d = 0; d < DIRS; d++) {
    // fibonacci sphere direction + orthonormal basis
    const y = 1 - (d + 0.5) * 2 / DIRS;
    const r = Math.sqrt(1 - y * y), th = golden * d;
    const w = [r * Math.cos(th), y, r * Math.sin(th)];
    const up = Math.abs(w[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let u = [
      w[1] * up[2] - w[2] * up[1],
      w[2] * up[0] - w[0] * up[2],
      w[0] * up[1] - w[1] * up[0],
    ];
    const ul = Math.hypot(...u);
    u = u.map(v => v / ul);
    const v = [
      w[1] * u[2] - w[2] * u[1],
      w[2] * u[0] - w[0] * u[2],
      w[0] * u[1] - w[1] * u[0],
    ];
    zbuf.fill(-Infinity);
    const px = (p) => [
      ((p[0] * u[0] + p[1] * u[1] + p[2] * u[2]) / EXT * 0.5 + 0.5) * (RES - 1),
      ((p[0] * v[0] + p[1] * v[1] + p[2] * v[2]) / EXT * 0.5 + 0.5) * (RES - 1),
      p[0] * w[0] + p[1] * w[1] + p[2] * w[2],
    ];
    const P = (i) => [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]];
    for (let t = 0; t < indices.length; t += 3) {
      const a = px(P(indices[t])), b = px(P(indices[t + 1])), cc = px(P(indices[t + 2]));
      const minx = Math.max(0, Math.floor(Math.min(a[0], b[0], cc[0])));
      const maxx = Math.min(RES - 1, Math.ceil(Math.max(a[0], b[0], cc[0])));
      const miny = Math.max(0, Math.floor(Math.min(a[1], b[1], cc[1])));
      const maxy = Math.min(RES - 1, Math.ceil(Math.max(a[1], b[1], cc[1])));
      const den = (b[1] - cc[1]) * (a[0] - cc[0]) + (cc[0] - b[0]) * (a[1] - cc[1]);
      if (Math.abs(den) < 1e-9) continue;
      for (let gy = miny; gy <= maxy; gy++)
        for (let gx = minx; gx <= maxx; gx++) {
          const w0 = ((b[1] - cc[1]) * (gx - cc[0]) + (cc[0] - b[0]) * (gy - cc[1])) / den;
          const w1 = ((cc[1] - a[1]) * (gx - cc[0]) + (a[0] - cc[0]) * (gy - cc[1])) / den;
          const w2 = 1 - w0 - w1;
          if (w0 < -0.01 || w1 < -0.01 || w2 < -0.01) continue;
          const z = w0 * a[2] + w1 * b[2] + w2 * cc[2];
          const o = gy * RES + gx;
          if (z > zbuf[o]) zbuf[o] = z;
        }
    }
    for (let i = 0; i < nVerts; i++) {
      const p = px(P(i));
      const gx = Math.round(p[0]), gy = Math.round(p[1]);
      if (gx < 0 || gx >= RES || gy < 0 || gy >= RES) continue;
      if (p[2] >= zbuf[gy * RES + gx] - EPS) lit[i] += 1;
    }
  }
  // per-model contrast stretch: map the 5th..95th visibility percentiles onto
  // a floor..1 range, so interior structure reads the same regardless of how
  // open or closed the shape happens to be. FLOOR keeps recesses dim, not black.
  const FLOOR = 0.32;
  const frac = Array.from(lit, v => v / DIRS);
  const sorted = [...frac].sort((a, b) => a - b);
  const lo = sorted[Math.floor(nVerts * 0.05)];
  const hi = sorted[Math.floor(nVerts * 0.95)] || 1;
  const span = Math.max(hi - lo, 1e-3);
  const ao = new Uint8Array(nVerts);
  for (let i = 0; i < nVerts; i++) {
    const t = Math.max(0, Math.min(1, (frac[i] - lo) / span));
    ao[i] = Math.round((FLOOR + (1 - FLOOR) * t) * 255);
  }
  return ao;
}

const chunks = [];
const manifest = [];
let offset = 0;
const align4 = () => {
  const pad = (4 - (offset % 4)) % 4;
  if (pad) { chunks.push(Buffer.alloc(pad)); offset += pad; }
};

for (const m of MODELS) {
  const path = `${SRC}/${m.file}`;
  const { pos: soup, col: colSoup } = m.stl ? loadStlSoup(path) : await loadGlbSoup(path);
  if (m.rot) {
    const [ax, ay, az] = m.rot.map(d => d * Math.PI / 180);
    for (let i = 0; i < soup.length; i += 3) {
      let x = soup[i], y = soup[i + 1], z = soup[i + 2], c, s;
      c = Math.cos(ax); s = Math.sin(ax);
      [y, z] = [c * y - s * z, s * y + c * z];
      c = Math.cos(ay); s = Math.sin(ay);
      [x, z] = [c * x + s * z, -s * x + c * z];
      c = Math.cos(az); s = Math.sin(az);
      [x, y] = [c * x - s * y, s * x + c * y];
      soup[i] = x; soup[i + 1] = y; soup[i + 2] = z;
    }
  }
  const { q, idxOut, wide, radius, dims, ao, col, nrm } = pack(soup, colSoup);
  align4();
  const vertOffset = offset;
  chunks.push(Buffer.from(q.buffer, q.byteOffset, q.byteLength));
  offset += q.byteLength;
  align4();
  const aoOffset = offset;
  chunks.push(Buffer.from(ao.buffer, ao.byteOffset, ao.byteLength));
  offset += ao.byteLength;
  align4();
  const colOffset = offset;
  chunks.push(Buffer.from(col.buffer, col.byteOffset, col.byteLength));
  offset += col.byteLength;
  align4();
  const nrmOffset = offset;
  chunks.push(Buffer.from(nrm.buffer, nrm.byteOffset, nrm.byteLength));
  offset += nrm.byteLength;
  align4();
  const idxOffset = offset;
  chunks.push(Buffer.from(idxOut.buffer, idxOut.byteOffset, idxOut.byteLength));
  offset += idxOut.byteLength;
  manifest.push({
    id: m.id, vertCount: q.length / 3, idxCount: idxOut.length,
    vertOffset, aoOffset, colOffset, nrmOffset, idxOffset, idx32: wide, radius, dims,
  });
  const meanAO = (ao.reduce((s, v) => s + v, 0) / ao.length / 255).toFixed(2);
  console.log(`${m.id}: ${q.length / 3} verts, ${idxOut.length / 3} tris, r=${radius}, ao~${meanAO}, dims=[${dims}]`);
}

const json = Buffer.from(JSON.stringify(manifest));
const jsonPad = (4 - (json.length % 4)) % 4;
const header = Buffer.alloc(8);
header.write('A5CI', 0);
header.writeUInt32LE(json.length + jsonPad, 4);
const out = Buffer.concat([header, json, Buffer.alloc(jsonPad), ...chunks]);
writeFileSync(OUT, out);
console.log(`\npack.bin: ${(out.length / 1024).toFixed(1)} KB`);
