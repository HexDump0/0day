/* The edit decision list. Scenes render from these tables and the audio layer
   places ticks/whooshes from them too — one schedule, two consumers. */
import {beatTime, CHORUS_HITS, DROP_BEAT, PERIOD, T_DROP, T_FLAGSHIP_START} from './timeline';
import assets from '../data/ysws-assets.json';
import footage from '../data/footage.json';

/* ---- cold open: the Hackers (1995) sample, word-timed via whisper ---- */
export interface TimedWord {
  time: number;
  text: string;
}
export const INTRO_WORDS: TimedWord[] = [
  {time: 0.66, text: 'not'},
  {time: 0.82, text: 'every'},
  {time: 1.04, text: 'geek'},
  {time: 1.28, text: 'with'},
  {time: 1.48, text: 'a'},
  {time: 1.56, text: 'commodore'},
  {time: 1.84, text: '64'},
  {time: 2.36, text: 'can'},
  {time: 2.6, text: 'hack'},
  {time: 2.72, text: 'into'},
  {time: 3.0, text: 'NASA'},
];
export const DEDICATION_WORDS: TimedWord[] = [
  {time: 8.72, text: 'this'},
  {time: 9.08, text: "one's"},
  {time: 9.5, text: 'dedicated'},
  {time: 9.94, text: 'to'},
  {time: 10.24, text: 'all'},
  {time: 10.46, text: 'the'},
  {time: 10.66, text: 'hackers'},
];

/* archival shots: word-synced during the quote, grid-locked after the beat
   drops in at beat 5. startFrom skips into the pre-cut clip (seconds). */
export interface Shot {
  time: number;
  clip: keyof typeof footage;
  slate: string;      // real provenance, shown dim in the corner
  note?: string;      // deadpan annotation, lower third
  startFrom?: number;
}
export const INTRO_SHOTS: Shot[] = [
    { time: 1.56, clip: "c64_title", slate: "commodore, 1982" },
    { time: 2.36, clip: "c64_typing", slate: "commodore, 1982" },
    { time: 3.0, clip: "saturn_ignition", slate: "nasa, 16mm", startFrom: 2.0 },
    {
        time: beatTime(5),
        clip: "saturn_climb",
        slate: "nasa",
        note: "1969: the moon, on 4kb of ram",
    },
    {
        time: beatTime(7),
        clip: "sage_lightgun",
        slate: "sage",
        note: "2026: intelligence became infrastructure",
    },
    {
        time: beatTime(9),
        clip: "ibm_tapes",
        slate: "irs",
        note: "every generation hacked anyway",
    },
    { time: beatTime(11), clip: "earth", slate: "nasa, 16mm" },
];
export const T_INTRO_SHOTS_END = 8.75; // dedication card takes over
export const FOOTAGE = footage as Record<string, {file: string; duration: number}>;

export interface Card {
  time: number;
  slug: string;
  name: string;
  tag: string;
}

/* Flagship YSWS wall — one card every 1.5 beats from beat 29 (~18.9s); the
   verse-2 vocal re-enters ~0.42s after the first card */
const FLAGSHIPS: [string, string, string][] = [
  ['stardance', 'Stardance', 'the largest STEM event of the summer'],
  ['macondo', 'Macondo', 'ship projects → hackathon in Bogotá'],
  ['forge', 'Forge', 'design + build hardware'],
  ['game', 'Hack Club: The Game', 'code 40h → IRL game in Manhattan'],
  ['shipyard', 'Shipyard', '7 weeks of shipping challenges'],
  ['horizons', 'Horizons', '7 hackathons, run by teenagers'],
  ['blueprint', 'Blueprint', 'design hardware, get $400 to build it'],
  ['anvil', 'Anvil', 'build something to help hackers'],
];
export const FLAGSHIP_CARDS: Card[] = FLAGSHIPS.map(([slug, name, tag], i) => ({
  time: T_FLAGSHIP_START + i * 1.5 * PERIOD,
  slug,
  name,
  tag,
}));

/* Rapid-fire wall — real program names from the YSWS catalog. Out of the
   flagship wall (1 card / 1.5 beats) the montage keeps halving its cut
   length — 1 beat → 1/2 → 1/4 — and spends most of its 10 beats at 4 cuts
   a beat until 170+ slams at DROP_BEAT-20. All names are real programs;
   the top gear leans on short names so ~9-frame flashes still register. */
export interface RapidCard {
  time: number;
  name: string;
  gear: number; // 0..2 → cut length = 1/2^gear beats
}
const RAPID_GEARS: {beats: number; names: string[]}[] = [
  {beats: 1, names: [
    'Midnight', 'Juice',
  ]},
  {beats: 0.5, names: [
    'Neighborhood', 'Highway', 'Boot', 'HomeLab',
  ]},
  {beats: 0.25, names: [
    'Polygon', 'Keeb', 'Noodles', 'Pxl', 'Meow', 'Woof', 'Bauble', 'Fudge',
    'Sprig', 'OnBoard', 'Blot', 'Arcade', 'Siege', 'Cider', 'Solder',
    'Twist', 'Pulse', 'Cinema', 'Jungle', 'Thunder', 'Grub', 'Cafe',
    'Rewind', 'Emerge',
  ]},
];
export const RAPID_CARDS: RapidCard[] = (() => {
  const out: RapidCard[] = [];
  let k = DROP_BEAT - 30;
  RAPID_GEARS.forEach(({beats, names}, gear) => {
    for (const name of names) {
      out.push({time: beatTime(k), name, gear});
      k += beats;
    }
  });
  // gears must land exactly on the stat block: 2 + 2 + 6 = 10 beats
  if (k !== DROP_BEAT - 20) throw new Error(`rapid wall ends at beat ${k}`);
  return out;
})();

/* Stat block beats */
export const T_STAT_COUNT = beatTime(DROP_BEAT - 20);   // "170+ programs shipped"
export const T_STAT_KINDS = beatTime(DROP_BEAT - 16);   // hardware / games / ...
export const T_STAT_QUESTION = beatTime(DROP_BEAT - 12); // "about cybersecurity:"

/* Drop-section cards (between chorus vocal hits). Directions/straps are
   verbatim from the site's src/data/content.ts — the video and the landing
   page must speak with one voice. */
export interface Claim {
  time: number;
  kind: 'reveal' | 'lyric' | 'first' | 'brief' | 'direction' | 'thesis' | 'loot';
  title: string;
  no?: string; // direction number
  strap?: string; // direction strap
  body?: string[]; // loot manifest rows
}
export const DROP_SCHEDULE: Claim[] = [
  {time: T_DROP, kind: 'reveal', title: '0DAY'},
  {time: CHORUS_HITS[0], kind: 'lyric', title: 'HACK ALL THE THINGS'},
  {time: beatTime(DROP_BEAT + 4), kind: 'first', title: "hack club's first cybersecurity ysws"},
  {time: CHORUS_HITS[1], kind: 'lyric', title: 'HACK ALL THE THINGS'},
  {time: beatTime(DROP_BEAT + 8), kind: 'brief', title: 'do something real in security.'},
  {time: CHORUS_HITS[2], kind: 'lyric', title: 'HACK ALL THE THINGS'},
  {time: beatTime(DROP_BEAT + 12), kind: 'direction', no: '01', title: 'BUILD', strap: 'make security useful.'},
  {time: beatTime(DROP_BEAT + 14), kind: 'direction', no: '02', title: 'BREAK', strap: 'find something real.'},
  {time: beatTime(DROP_BEAT + 16), kind: 'direction', no: '03', title: 'REVERSE', strap: 'explain the artifact.'},
  {time: CHORUS_HITS[3], kind: 'lyric', title: 'HACK ALL THE THINGS'},
  {time: beatTime(DROP_BEAT + 20), kind: 'thesis', title: '…or your own idea'},
  {time: CHORUS_HITS[4], kind: 'lyric', title: 'HACK ALL THE THINGS'},
  {time: beatTime(DROP_BEAT + 24), kind: 'loot', title: 'hours → gear',
    body: ['flipper zero', 'hackrf', 'raspberry pi']},
  {time: CHORUS_HITS[5], kind: 'lyric', title: 'HACK ALL THE THINGS'},
];

/* audio cue list for the Mix component */
export const AUDIO_CUTS: {time: number; sound: string; vol?: number}[] = [
  // intro: soft ticks on the grid-locked archival cuts (not the word-synced ones)
  ...INTRO_SHOTS.filter((s) => s.time > 3.7).map((s, i) => ({
    time: s.time, sound: `tick${(i % 3) + 1}.wav`, vol: 0.2,
  })),
  ...FLAGSHIP_CARDS.map((c, i) => ({
    time: c.time, sound: `tick${(i % 3) + 1}.wav`, vol: 0.3,
  })),
  /* ticks thin out as the wall speeds up — per cut, then every other cut
     in the top gear — so the peak stays musical, not machine-gun */
  ...RAPID_CARDS.filter((c, i) => c.gear <= 1 || i % 2 === 0).map((c, i) => ({
    time: c.time,
    sound: `tick${(i % 3) + 1}.wav`,
    vol: [0.16, 0.13, 0.1][c.gear],
  })),
  // no whooshes anywhere — the chorus carries the drop, ticks carry the cuts
  {time: T_STAT_COUNT, sound: 'tick1.wav', vol: 0.32},
];

export const YSWS_ASSETS = assets as Record<
  string,
  {file: string; width?: number; height?: number; svg?: boolean}
>;
