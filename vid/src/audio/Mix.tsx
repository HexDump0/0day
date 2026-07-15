/* The two-stem mix.

   Instrumental: runs continuously, ducks -4dB under big claim cards, dies
   completely in the gap (tape-stop covers the kill), fades out at the end.

   Vocals: gated by the LRC whitelist (booze lines and the NASA bar never
   reach the master). The verse runs uncut; around the "you ship, we ship"
   explainer a slow envelope breathes the stem out after the dedication and
   back in as Stardance lands. 80ms cosine ramps on the hard gates.

   SFX: tape stop, sub hit on the "0", riser into the drop, whooshes/ticks
   are triggered by the scenes' cut lists. */
import React from 'react';
import {Audio, Sequence, staticFile, interpolate} from 'remotion';
import {
  ALLOWED_LINES, beatTime, DROP_BEAT, FPS, sec,
  T_TAPE_STOP, T_ZERO, T_DROP, T_END,
} from '../lib/timeline';

const RAMP_S = 0.08;

/* smooth 0→1→0 window with cosine edges */
const gateGain = (t: number, start: number, end: number): number => {
  if (t <= start - RAMP_S || t >= end + RAMP_S) return 0;
  if (t < start) return 0.5 * (1 + Math.cos(((start - t) / RAMP_S) * Math.PI));
  if (t > end) return 0.5 * (1 + Math.cos(((t - end) / RAMP_S) * Math.PI));
  return 1;
};

/* moments where the instrumental ducks for ~1 beat under a hard claim */
export const DUCKS: number[] = [T_DROP, beatTime(DROP_BEAT + 8), beatTime(DROP_BEAT + 12)];

const duckGain = (t: number): number => {
  let g = 1;
  for (const d of DUCKS) {
    if (t >= d && t < d + 0.75) {
      const p = (t - d) / 0.75;
      g = Math.min(g, 0.63 + 0.37 * p * p); // fast dip, smooth recovery
    }
  }
  return g;
};

const masterFade = (t: number): number =>
  interpolate(t, [T_END - 2.2, T_END - 0.2], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const instrumentalVolume = (f: number): number => {
  const t = f / FPS;
  // the gap: kill from tape-stop until the drop (tape_stop.wav covers the kill)
  if (t >= T_TAPE_STOP && t < T_DROP) {
    return t < T_TAPE_STOP + 0.12 ? 1 - (t - T_TAPE_STOP) / 0.12 : 0;
  }
  return duckGain(t) * masterFade(t);
};

/* slow breath around the explainer: vocals duck (not mute) after the
   dedication tail, back to full right as the first YSWS card (Stardance)
   hits at beat DROP_BEAT-56 */
const T_VOX_OUT = 11.8;
const T_VOX_OUT_END = 14.2;
const T_VOX_IN = beatTime(DROP_BEAT - 56) - 1.2;
const T_VOX_IN_END = beatTime(DROP_BEAT - 56) + 0.2;
const VOX_DUCK = 0.5;

const verseEnvelope = (t: number): number => {
  if (t < T_VOX_OUT || t >= T_VOX_IN_END) return 1;
  const span = 1 - VOX_DUCK;
  if (t < T_VOX_OUT_END) {
    const p = (t - T_VOX_OUT) / (T_VOX_OUT_END - T_VOX_OUT);
    return VOX_DUCK + span * 0.5 * (1 + Math.cos(p * Math.PI));
  }
  if (t < T_VOX_IN) return VOX_DUCK;
  const p = (t - T_VOX_IN) / (T_VOX_IN_END - T_VOX_IN);
  return VOX_DUCK + span * 0.5 * (1 - Math.cos(p * Math.PI));
};

const vocalsVolume = (f: number): number => {
  const t = f / FPS;
  // the gap is dead air — no vocal tail may survive the tape-stop
  if (t >= T_TAPE_STOP && t < T_DROP) {
    return t < T_TAPE_STOP + 0.12 ? 1 - (t - T_TAPE_STOP) / 0.12 : 0;
  }
  let g = 0;
  for (const l of ALLOWED_LINES) {
    g = Math.max(g, gateGain(t, l.gateStart, l.end));
  }
  return g * verseEnvelope(t) * masterFade(t);
};

const sfx = (file: string, at: number, volume = 1): React.ReactNode => (
  <Sequence key={`${file}-${at}`} from={sec(at)} durationInFrames={sec(3.2)}>
    <Audio src={staticFile(`audio/sfx/${file}`)} volume={volume} />
  </Sequence>
);

export const Mix: React.FC<{cuts?: {time: number; sound: string; vol?: number}[]}> = ({
  cuts = [],
}) => {
  return (
    <>
      <Audio
        src={staticFile('audio/instrumental.mp3')}
        volume={instrumentalVolume}
      />
      <Audio src={staticFile('audio/vocals.mp3')} volume={vocalsVolume} />
      {sfx('tape_stop.wav', T_TAPE_STOP, 0.9)}
      {sfx('sub_hit.wav', T_ZERO, 1)}
      {sfx('riser.wav', T_DROP - 2.55, 0.75)}
      {cuts.map((c) => sfx(c.sound, c.time, c.vol ?? 0.4))}
    </>
  );
};
