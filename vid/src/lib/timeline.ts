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
   beats.json/lyrics.json — the whole edit re-derives.

   Video time == song time up to the tape-stop. The audio files are untouched
   and the verse plays continuously — but the montage doesn't need the whole
   verse, so the silent gap hides a GAP_SKIP jump: the music dies wherever
   the tape-stop lands (mid-line is fine, that's the effect), and after the
   gap the same files resume at the chorus via trimBefore in the Mix. Every
   constant below T_TAPE_STOP is in both clocks; everything after is video
   time (song time minus GAP_SKIP). */
const T_CHORUS_START = 54.25;              // first "Drink..." line (LRC, song time)
const SONG_DROP_BEAT = Math.round((T_CHORUS_START - OFFSET) / PERIOD);
export const GAP_SKIP_BEATS = 14;
export const GAP_SKIP = GAP_SKIP_BEATS * PERIOD; // song seconds skipped in the gap
export const DROP_BEAT = SONG_DROP_BEAT - GAP_SKIP_BEATS; // video beat of the drop
export const T_DROP = beatTime(DROP_BEAT); // chorus downbeat, 0DAY reveal

export const T_DEDICATION = 8.75;          // "This one's dedicated..."
export const T_VERSE = 13.98;              // verse starts → lineage montage
export const T_TAPE_STOP = T_DROP - 2 * BAR; // instrumental dies; the gap
export const T_ZERO = T_TAPE_STOP + 1.5;   // the "0" slams (sub hit)
export const T_UNTIL_NOW = T_DROP - 2.0;   // riser begins to bite
export const T_OUTRO = 62.76;              // "Zero through Three" (song 71.6)
export const T_END = 69.56;

export const DURATION = sec(T_END);

/* Chorus "Hack all the things" vocal hits (LRC song times minus GAP_SKIP) */
export const CHORUS_HITS = [46.72, 49.11, 51.78, 56.71, 59.39, 61.91];

/* The verse plays from its natural start right after the dedication, but
   sits lowered in the mix under the YSWS setup cards — present for flow,
   quiet enough to read over — and rises back to full across the last two
   beats into the Stardance card, where "Put your bytes up" (sung attack
   ~19.31) lands at full volume in its own pocket. */
export const T_VOX_RESUME = T_VERSE;
export const T_FLAGSHIP_START = beatTime(DROP_BEAT - 42);

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
