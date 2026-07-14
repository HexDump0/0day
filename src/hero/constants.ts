/* 0day hero — shared constants and per-model exhibit config.
   Pure data + a couple of derived lookup tables; no DOM, no GL. */

export const ACID: readonly [number, number, number] = [198 / 255, 245 / 255, 46 / 255];
export const PAPER: readonly [number, number, number] = [232 / 255, 231 / 255, 224 / 255];

export const RAMP = " .':;-=+*csoxk%&#W@"; // 19-level density ramp, sparse -> dense
// atlas = density ramp first (indices 0..10), then the phrase alphabet.
// | and \ are here only so the edge pass can draw oriented outline strokes.
export const ATLAS_CHARS = [
  ...new Set(RAMP + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>!?$&·_|\\'),
];
export const CHAR_IDX: Record<string, number> = Object.fromEntries(
  ATLAS_CHARS.map((c, i) => [c, i]),
);
// oriented edge glyphs, indexed by gradient bin: 0 →| 1 →\ 2 →- 3 →/
export const EDGE_IDX = ['|', '\\', '-', '/'].map((c) => CHAR_IDX[c]);

export const PHRASES = [
  'YOU SHIP WE SHIP', 'HACK THE PLANET',
  'BUILD A SECURITY TOOL', 'BREAK INTO REAL CODE',
  'HUNT THE VULN', 'DISCLOSE RESPONSIBLY ALWAYS',
  'TRACK 01 BUILD', 'TRACK 02 BREAK', 'MADE BY HUMANS',
  '18 AND UNDER WORLDWIDE', 'SCANNER LOG ANALYZER LEAK FINDER',
  'REVERSE THE MALWARE', 'TRACE THE ATTACKER THROUGH THE LOGS',
  'READ THE ACTUAL CODE', 'NO CERTIFICATIONS NO GATEKEEPING',
  'SHIP SOMETHING REAL', '0DAY HACK CLUB YSWS',
  'FIND OUT HOW BEFORE SOMEONE ELSE DOES', 'API KEY EXPOSED IN REPO',
  'CRACK THE WEAK PASSWORD', 'GRADE THE DEFENSES',
  'DISSECT THE CAPTURE', 'ROOT AT 0DAY NETWORK', 'PAYLOAD DELIVERED',
  'EXPLOIT THE ZERO DAY', 'PATCH THE HOLE', 'NOT A FORM NOT A BOT',
  'SUDO MAKE ME A SANDWICH', 'THE CYCLE NEVER ENDS',
];
export const SEPS = ['   ', '  ·  ', '  //  '];

export interface SeqItem {
  id: string;
  label: string;
  dur: number;
  s: number;
  spin: number;
  tilt: number;
  ox: number;
  oy: number;
  duck?: boolean;
}

/* ---------- the exhibit: per-model display config ----------
   s scales relative to fit, spin is yaw rad/s, tilt is base pitch.
   The duck is not on the roster. The duck is a rounding error.
   ox/oy: per-model screen offset added to the base placement (tune with ?tune) */
export const SEQ: SeqItem[] = [
  { id: 'flipper', label: 'flipper_zero', dur: 9000, s: 0.94, spin: 0.32, tilt: -0.48, ox: 0.01, oy: 0.05 },
  { id: 'hackrf', label: 'hackrf_one', dur: 9000, s: 1.08, spin: 0.29, tilt: 0.56, ox: 0.05, oy: 0.55 },
  { id: 'pc98', label: 'pc-9801ux', dur: 9000, s: 1.27, spin: 0.43, tilt: 0.17, ox: 0.00, oy: 0.14 },
  { id: 'rpi', label: 'raspberry_pi_5', dur: 9000, s: 0.89, spin: 0.42, tilt: -0.29, ox: 0.00, oy: 0.09 },
  { id: 'usb', label: 'usb_payload', dur: 9000, s: 0.93, spin: 0.48, tilt: 0.80, ox: 0.01, oy: 0.03 },
  { id: 'duck', label: 'quack', dur: 4000, s: 0.72, spin: 0.55, tilt: 0.17, duck: true, ox: 0.00, oy: 0.09 },
];

export interface TuneKnobs {
  amb: number; key: number; fill: number;
  specP: number; specS: number;
  depthB: number; depthR: number;
  under: number;
}

// global shader knobs (live-editable via the ?tune panel; defaults = current look)
export const TUNE: TuneKnobs = {
  amb: 0.06, key: 0.98, fill: 0.18, // diffuse: ambient + key + fill
  specP: 30, specS: 0.55, // specular exponent + strength
  depthB: 0.32, depthR: 0.95, // depth gradient base + range
  under: 0.28, // 3D underlay opacity (desktop)
};
