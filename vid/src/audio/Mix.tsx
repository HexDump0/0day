/* The two-stem mix.

   Instrumental: runs continuously, ducks -4dB under big claim cards, dies
   completely in the gap (tape-stop covers the kill), fades out at the end.

   Vocals: gated by the LRC whitelist (booze lines and the NASA bar never
   reach the master). The verse plays from its natural start right after the
   dedication — no time-shift, no manufactured mute; "Put your bytes up"
   lands just after the Stardance card because that's where it sits in the
   song. Each kept line uses cosine ramps.

   The gap hides a jump: the files are untouched, but the montage doesn't
   need the whole verse. Element A plays song==video time and dies at the
   tape-stop (mid-line by design). Element B starts underneath the silent
   gap with trimBefore offset GAP_SKIP — muted while it primes, gated open
   from the drop — so the chorus lands on the video's drop beat and the
   splice lives entirely inside silence.

   SFX: tape stop, sub hit on the "0", riser into the drop, whooshes/ticks
   are triggered by the scenes' cut lists. */
import React from 'react';
import {Audio} from '@remotion/media';
import {Sequence, staticFile, interpolate} from 'remotion';
import {
  ALLOWED_LINES, beatTime, DROP_BEAT, FPS, GAP_SKIP, sec, T_DEDICATION,
  T_FLAGSHIP_START, T_TAPE_STOP, T_VOX_RESUME, T_ZERO, T_DROP, T_END,
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

/* element A (song==video): everything up to the tape-stop, then silence —
   a fast 30ms handoff to tape_brake.wav, which continues the same audio
   at falling speed (real varispeed of the mix, rendered offline) */
const HANDOFF_S = 0.03;
const instrumentalVolume = (f: number): number => {
  const t = f / FPS;
  if (t >= T_TAPE_STOP) {
    return t < T_TAPE_STOP + HANDOFF_S ? 1 - (t - T_TAPE_STOP) / HANDOFF_S : 0;
  }
  return duckGain(t) * masterFade(t);
};

/* element B (video time, file offset by GAP_SKIP): silent through the gap
   while the stream primes, open from the drop */
const instrumentalVolumeB = (f: number): number => {
  const t = T_TAPE_STOP + f / FPS; // sequence-local frames → video time
  if (t < T_DROP) return 0;
  return duckGain(t) * masterFade(t);
};

const RESUME_LINE = ALLOWED_LINES.find((line) => line.time === T_VOX_RESUME);
if (!RESUME_LINE) {
  throw new Error(`Missing vocal resume line at ${T_VOX_RESUME}s`);
}

const VOCAL_LINES = ALLOWED_LINES.filter(
  (line) => line.time <= T_DEDICATION || line.time >= T_VOX_RESUME,
);

/* Under the YSWS setup the verse sits lowered — audible for flow, quiet
   enough that the cards still read — then rises across the last two beats
   so "Put your bytes up" lands at full volume just after Stardance. */
const VOX_SETUP_GAIN = 0.45;
const setupVocalGain = (t: number): number => {
  if (t < T_VOX_RESUME - 0.2) return 1; // dedication stays full
  return interpolate(
    t,
    [beatTime(DROP_BEAT - 44), T_FLAGSHIP_START],
    [VOX_SETUP_GAIN, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
};

const vocalsVolume = (f: number): number => {
  const t = f / FPS;
  // dead from the tape-stop — the brake carries the slowing vocal instead
  if (t >= T_TAPE_STOP) {
    return t < T_TAPE_STOP + HANDOFF_S ? 1 - (t - T_TAPE_STOP) / HANDOFF_S : 0;
  }
  let g = 0;
  for (const l of VOCAL_LINES) {
    g = Math.max(g, gateGain(t, l.gateStart, l.end));
  }
  return g * setupVocalGain(t) * masterFade(t);
};

const vocalsVolumeB = (f: number): number => {
  const t = T_TAPE_STOP + f / FPS; // video time
  if (t < T_DROP) return 0;
  const song = t + GAP_SKIP; // lyric gates live in song time
  let g = 0;
  for (const l of VOCAL_LINES) {
    g = Math.max(g, gateGain(song, l.gateStart, l.end));
  }
  return g * masterFade(t);
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
      {/* trimmed mp3 playback lands ~68ms late (seek/priming) — measured by
          cross-correlating the render against the stem; trim that much
          further in so the chorus hits the drop beat exactly */}
      <Sequence from={sec(T_TAPE_STOP)}>
        <Audio
          src={staticFile('audio/instrumental.mp3')}
          trimBefore={sec(T_TAPE_STOP + GAP_SKIP + 0.068)}
          volume={instrumentalVolumeB}
        />
        <Audio
          src={staticFile('audio/vocals.mp3')}
          trimBefore={sec(T_TAPE_STOP + GAP_SKIP + 0.068)}
          volume={vocalsVolumeB}
        />
      </Sequence>
      {sfx('tape_brake.wav', T_TAPE_STOP, 1)}
      {sfx('tape_stop.wav', T_TAPE_STOP, 0.6)}
      {sfx('sub_hit.wav', T_ZERO, 1)}
      {sfx('riser.wav', T_DROP - 2.55, 0.75)}
      {cuts.map((c) => sfx(c.sound, c.time, c.vol ?? 0.4))}
    </>
  );
};
