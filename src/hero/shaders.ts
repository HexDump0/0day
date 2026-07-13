/* 0day hero — GLSL sources. See engine.ts for the two-pass pipeline overview.
   ACID/PAPER are baked into the fragment shaders as constants at module load. */
import { ACID, PAPER } from './constants.ts';

export const VS_FULL = `#version 300 es
  void main() {
    vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  }`;

// pass 1 — the model, flat-shaded, slice-glitched while the signal is bad
export const VS_MODEL = `#version 300 es
  in vec3 a_pos;
  in float a_ao;
  in vec3 a_col;
  in vec3 a_nrm;
  uniform mat3 u_r3;
  uniform float u_d3, u_f, u_scale, u_glitch, u_time;
  uniform vec2 u_off, u_asp;
  out vec3 v_view;
  out vec3 v_obj;
  out vec3 v_col;
  out vec3 v_nrm;
  out float v_ao;
  out float v_depth;
  float h1(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    vec3 p = a_pos;
    v_obj = p;
    v_ao = a_ao;
    v_col = a_col;
    v_nrm = u_r3 * a_nrm;         // smooth normal into view space (u_r3 orthonormal)
    if (u_glitch > 0.001) {
      float gen = floor(u_time * 24.0);
      float band = floor((p.y + 1.4) * 5.0);
      float r = h1(band * 17.31 + gen * 0.71);
      if (r < 0.4 * u_glitch)
        p.x += (h1(band + gen) - 0.5) * 0.6 * u_glitch;
    }
    vec3 q = u_r3 * p;
    v_view = q;
    float z = u_d3 - q.z;
    v_depth = z;
    vec2 xy = q.xy * u_f * u_scale * u_asp;
    float zn = 0.5, zf = 12.0;
    float cz = z * (zf + zn) / (zf - zn) - 2.0 * zf * zn / (zf - zn);
    gl_Position = vec4(xy + u_off * z, cz, z);
  }`;

// Two outputs: o0 = lit color, o1 = view normal (rgb) + linear depth (a).
// The ASCII pass reads o1 to find silhouette + crease edges and draw them as
// crisp acid outlines — that, plus baked AO, is what pulls the shape out of
// the blob. Background depth clears to 1.0 (far) so the silhouette is a big
// depth step against it.
export const FS_MODEL = `#version 300 es
  precision highp float;
  in vec3 v_view;
  in vec3 v_obj;
  in vec3 v_col;
  in vec3 v_nrm;
  in float v_ao;
  in float v_depth;
  uniform float u_glow, u_flow, u_tex;
  uniform float u_amb, u_key, u_fill, u_specP, u_specS, u_depthB, u_depthR;
  uniform vec3 u_base;
  layout(location = 0) out vec4 o0;
  layout(location = 1) out vec4 o1;
  const vec3 ACID = vec3(${ACID.join(',')});
  const vec3 PAPER = vec3(${PAPER.join(',')});
  void main() {
    // smooth baked normal: stable gradient shading (real depth, full ramp) AND
    // stable edge detection — the old flat face normal flipped every frame as
    // the model turned, which is what made the outline strokes flicker.
    vec3 Nsm = normalize(v_nrm);
    vec3 N = Nsm.z < 0.0 ? -Nsm : Nsm;      // face the camera for lighting
    vec3 V = vec3(0.0, 0.0, 1.0);           // view direction (toward camera)
    // one dominant key from the upper-front + a weak fill: a clear light/shadow
    // gradient reads as sculpted form. low ambient so the shaded side recedes.
    vec3 Lkey = normalize(vec3(0.35, 0.82, 0.46));
    float key = max(dot(N, Lkey), 0.0);
    float fill = max(dot(N, normalize(vec3(-0.6, -0.05, 0.45))), 0.0);
    float dif = u_amb + u_key * key + u_fill * fill;
    // tight specular hotspot — the eye reads gloss as 3D curvature
    float spec = pow(max(dot(N, normalize(Lkey + V)), 0.0), u_specP);
    float rim = pow(1.0 - abs(N.z), 2.4);
    float ao = 0.18 + 0.82 * v_ao;          // deeper recesses -> more structure
    // strong front-to-back gradient -> volume: near burns, far recedes into dark
    float depth = u_depthB + u_depthR * clamp(v_view.z * 0.6 + 0.5, 0.0, 1.0);
    // apply the source albedo slightly — a wash of the real material color
    vec3 tint = mix(vec3(1.0), v_col, u_tex);
    vec3 col = (u_base * tint * dif * ao + ACID * rim * 0.32 * (0.4 + 0.6 * ao)) * depth;
    col += PAPER * spec * u_specS * ao * depth;            // glossy highlight
    // a slow scan of light drifting down the body (u_flow advances it)
    float cur = pow(0.5 + 0.5 * sin(v_obj.y * 4.0 + v_obj.x * 1.2 - u_flow), 8.0);
    col += ACID * cur * (0.2 + rim * 0.28) * depth;
    o0 = vec4(col * u_glow, 1.0);
    o1 = vec4(Nsm * 0.5 + 0.5, clamp(v_depth / 6.0, 0.0, 1.0));  // smooth normal for edges
  }`;

// pass 2 — the ASCII shader
export const FS_ASCII = `#version 300 es
  precision highp float;
  uniform sampler2D u_scene, u_aux, u_atlas, u_map;
  uniform vec2 u_res, u_cell, u_mapsize;
  uniform float u_n, u_ramp, u_time, u_lod, u_glitch;
  uniform vec4 u_edge;
  out vec4 o;
  const vec3 ACID = vec3(${ACID.join(',')});
  const vec3 PAPER = vec3(${PAPER.join(',')});
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  void main() {
    vec2 cell = floor(gl_FragCoord.xy / u_cell);
    // corruption: whole character rows shear sideways
    if (u_glitch > 0.001) {
      float gen = floor(u_time * 24.0);
      float r = hash(vec2(cell.y * 3.7, gen));
      if (r < 0.5 * u_glitch)
        cell.x += floor((hash(vec2(cell.y, gen)) - 0.5) * 14.0 * u_glitch);
    }
    vec2 uv = (cell + 0.5) * u_cell / u_res;
    vec3 c = textureLod(u_scene, uv, u_lod).rgb;
    // keep the copy column readable, fade at the statline strip + top edge
    float keep = (u_res.x > u_res.y * 1.1)
      ? mix(0.1, 1.0, smoothstep(0.30, 0.58, uv.x)) : 0.4;
    keep *= 0.35 + 0.65 * smoothstep(0.0, 0.1, uv.y);
    keep *= 0.5 + 0.5 * smoothstep(1.0, 0.94, uv.y);
    c *= keep;
    float lum = clamp(dot(c, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    lum *= 0.97 + 0.03 * hash(cell + floor(u_time * 2.0));  // faint, slow shimmer
    vec2 ic = fract(gl_FragCoord.xy / u_cell);

    // ---- edge detection: silhouette (depth step) + creases (normal break) ----
    vec2 tx = u_cell / u_res;               // one character cell in uv
    vec4 a0 = textureLod(u_aux, uv, 0.0);
    vec4 aL = textureLod(u_aux, uv - vec2(tx.x, 0.0), 0.0);
    vec4 aR = textureLod(u_aux, uv + vec2(tx.x, 0.0), 0.0);
    vec4 aU = textureLod(u_aux, uv - vec2(0.0, tx.y), 0.0);
    vec4 aD = textureLod(u_aux, uv + vec2(0.0, tx.y), 0.0);
    float de = max(max(abs(a0.a - aL.a), abs(a0.a - aR.a)),
                   max(abs(a0.a - aU.a), abs(a0.a - aD.a)));
    vec3 n0 = a0.rgb * 2.0 - 1.0;
    float ne = 1.0 - min(min(dot(n0, aL.rgb * 2.0 - 1.0), dot(n0, aR.rgb * 2.0 - 1.0)),
                         min(dot(n0, aU.rgb * 2.0 - 1.0), dot(n0, aD.rgb * 2.0 - 1.0)));
    // draw the outline on the cell that sits on geometry, not the background
    // cell beside it — keeps the silhouette a crisp ~1 cell instead of a halo
    float onModel = 1.0 - smoothstep(0.85, 0.98, a0.a);
    float edge = max(smoothstep(0.03, 0.08, de), smoothstep(0.30, 0.65, ne)) * onModel;
    edge *= keep;
    if (false && edge > 0.14) {   // edges off — exploring 3D underlay instead
      // orient the stroke ALONG the edge: the gradient of depth (or of the
      // normal, for creases where depth barely moves) points ACROSS it, so
      // quantizing the gradient angle to 4 bins picks | \ - / accordingly.
      const float PI = 3.14159265;
      vec3 nL = aL.rgb * 2.0 - 1.0, nR = aR.rgb * 2.0 - 1.0;
      vec3 nU = aU.rgb * 2.0 - 1.0, nD = aD.rgb * 2.0 - 1.0;
      float dgx = aR.a - aL.a, dgy = aD.a - aU.a;
      float ngx = dot(n0, nL) - dot(n0, nR), ngy = dot(n0, nU) - dot(n0, nD);
      bool useDepth = abs(dgx) + abs(dgy) > 0.004;
      float gx = useDepth ? dgx : ngx;
      float gy = useDepth ? dgy : ngy;
      float ang = atan(gy, gx);
      float gm = ang - PI * floor(ang / PI);          // fold to 0..PI
      int dir = int(mod(floor(gm / PI * 4.0 + 0.5), 4.0));
      float gi = dir == 0 ? u_edge.x : dir == 1 ? u_edge.y
               : dir == 2 ? u_edge.z : u_edge.w;
      float g = texture(u_atlas, vec2((gi + ic.x) / u_n, ic.y)).r;
      float mx = max(c.r, max(c.g, c.b));
      vec3 etone = mx > 0.01 ? c / mx : PAPER;         // surface hue, bright
      float a = g * clamp(edge * 1.2, 0.0, 1.0);
      o = vec4(etone * a, a);                          // premultiplied
      return;
    }

    if (lum < 0.06) {
      // near-black: the phrase field — faint running text in uneven patches,
      // corrupting harder while the signal is bad
      float idx = texture(u_map, (cell + 0.5) / u_mapsize).r * 255.0;
      if (idx < 0.5) { o = vec4(0.0); return; }
      float gen = floor(u_time * 1.6);
      if (hash(cell * 0.73 + gen * 0.37) < 0.05 + 0.4 * u_glitch)
        idx = floor(1.0 + hash(cell * 2.7 + gen) * (u_n - 1.0));
      float g = texture(u_atlas, vec2((idx + ic.x) / u_n, ic.y)).r;
      float pt = hash(floor(cell / vec2(13.0, 7.0)) + floor(u_time * 0.07));
      pt = pt * pt;
      float mask = 0.45;
      if (u_res.x > u_res.y * 1.1) mask = mix(0.25, 1.0, smoothstep(0.30, 0.60, uv.x));
      mask *= 0.4 + 0.6 * smoothstep(0.0, 0.09, uv.y);
      float a = g * ((0.02 + 0.055 * pt) * mask + min(lum * 8.0, 0.55));
      vec3 tone = mix(PAPER, ACID, u_glitch * step(hash(cell.yx + gen), 0.3));
      o = vec4(tone * a, a);
      return;
    }
    // bright cells: glyph density follows luminance; corruption swaps glyphs
    float fi = pow(lum, 0.8) * (u_ramp - 1.0) + 1.0;
    if (u_glitch > 0.001 && hash(cell * 1.31 + floor(u_time * 24.0)) < 0.5 * u_glitch)
      fi = 1.0 + hash(cell + u_glitch) * (u_ramp - 1.0);
    float idx = floor(clamp(fi, 1.0, u_ramp - 1.0));
    float g = texture(u_atlas, vec2((idx + ic.x) / u_n, ic.y)).r;
    vec3 tint = c / max(lum, 0.001);
    tint /= max(max(tint.r, max(tint.g, tint.b)), 1.0);
    float a = g * smoothstep(0.05, 0.09, lum);
    o = vec4(tint * (0.5 + 0.5 * lum) * a, a);      // premultiplied
  }`;

// underlay — the actual 3D render, dim, beneath the ASCII overlay
export const FS_BLIT = `#version 300 es
  precision highp float;
  uniform sampler2D u_scene;
  uniform vec2 u_res;
  uniform float u_alpha, u_lod;
  out vec4 o;
  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    vec3 c = textureLod(u_scene, uv, u_lod).rgb;
    // same readability fade as the ascii pass (keep the copy column clear)
    float keep = (u_res.x > u_res.y * 1.1)
      ? mix(0.06, 1.0, smoothstep(0.30, 0.58, uv.x)) : 0.4;
    keep *= 0.35 + 0.65 * smoothstep(0.0, 0.1, uv.y);
    keep *= 0.5 + 0.5 * smoothstep(1.0, 0.94, uv.y);
    c *= keep;
    float lum = clamp(dot(c, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    float a = smoothstep(0.015, 0.2, lum) * u_alpha;
    o = vec4(c * a, a);                             // premultiplied
  }`;
