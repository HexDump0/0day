/* Single source of truth for time: the detected beat grid + LRC data.
   Everything on screen is placed via these helpers — no hand-typed frame
   numbers in scene code. */
import beatsData from '../data/beats.json';
import lyricsData from '../data/lyrics.json';

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const BPM: number = beatsData.bpm;
export const OFFSET: number = beatsData.offset;
export const PERIOD: number = beatsData.period; // seconds per beat
export const BAR = PERIOD * 4;

export interface LyricLine {
  time: number;
  end: number;
  gateStart: number;
  text: string;
  allowed: boolean;
}
export const LYRICS = lyricsData as LyricLine[];
export const ALLOWED_LINES = LYRICS.filter((l) => l.allowed);

export const sec = (s: number): number => Math.round(s * FPS);
export const beatTime = (k: number): number => OFFSET + k * PERIOD;
export const beatFrame = (k: number): number => sec(beatTime(k));
export const beatIndexAt = (s: number): number => (s - OFFSET) / PERIOD;

/* ---- landmark moments ----
   Everything hangs off the chorus downbeat so a lyric retime only needs new
   beats.json/lyrics.json — the whole edit re-derives. */
const T_CHORUS_START = 54.25;              // first "Drink..." line (LRC)
export const DROP_BEAT = Math.round((T_CHORUS_START - OFFSET) / PERIOD);
export const T_DROP = beatTime(DROP_BEAT); // chorus downbeat, 0DAY reveal

export const T_DEDICATION = 8.75;          // "This one's dedicated..."
export const T_VERSE = 13.98;              // verse starts → lineage montage
export const T_TAPE_STOP = T_DROP - 2 * BAR; // instrumental dies; the gap
export const T_ZERO = T_TAPE_STOP + 1.5;   // the "0" slams (sub hit)
export const T_UNTIL_NOW = T_DROP - 2.0;   // riser begins to bite
export const T_OUTRO = 71.6;               // "Zero through Three"
export const T_END = 78.4;

export const DURATION = sec(T_END);

/* Chorus "Hack all the things" vocal hits (LRC) */
export const CHORUS_HITS = [55.56, 57.95, 60.62, 65.55, 68.23, 70.75];

/* frames since the most recent event in `times`; Infinity if none yet */
export const sinceLast = (frame: number, times: number[]): number => {
  let best = Infinity;
  for (const t of times) {
    const d = frame - sec(t);
    if (d >= 0 && d < best) best = d;
  }
  return best;
};

/* exp-decaying impulse: 1.0 at the event, ~0 after `life` frames */
export const impulse = (frame: number, times: number[], life = 14): number => {
  const d = sinceLast(frame, times);
  return d === Infinity ? 0 : Math.exp((-3 * d) / life);
};

/* every beat time within [from, to) */
export const beatsIn = (from: number, to: number): number[] => {
  const out: number[] = [];
  const k0 = Math.ceil((from - OFFSET) / PERIOD);
  for (let k = k0; beatTime(k) < to; k++) out.push(beatTime(k));
  return out;
};
