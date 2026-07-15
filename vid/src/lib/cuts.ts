/* The edit decision list. Scenes render from these tables and the audio layer
   places ticks/whooshes from them too — one schedule, two consumers. */
import {beatTime, CHORUS_HITS, DROP_BEAT, T_DROP} from './timeline';
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
  {time: 1.56, clip: 'c64_title', slate: 'commodore, 1982'},
  {time: 2.36, clip: 'c64_typing', slate: 'commodore, 1982'},
  {time: 3.0, clip: 'saturn_ignition', slate: 'nasa, 16mm', startFrom: 2.0},
  {time: beatTime(5), clip: 'saturn_climb', slate: 'nasa, 16mm',
    note: '1969: the moon, on 4kb of ram'},
  {time: beatTime(7), clip: 'sage_lightgun', slate: 'sage, 1956',
    note: '1956: war games, on vacuum tubes'},
  {time: beatTime(9), clip: 'ibm_tapes', slate: 'irs, 1966',
    note: 'every generation hacked anyway'},
  {time: beatTime(11), clip: 'earth', slate: 'nasa, 16mm'},
];
export const T_INTRO_SHOTS_END = 8.75; // dedication card takes over
export const FOOTAGE = footage as Record<string, {file: string; duration: number}>;

export interface Card {
  time: number;
  slug: string;
  name: string;
  tag: string;
}

/* Flagship YSWS wall — one card every 2 beats, starting beat 30 (~19.6s) */
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
  time: beatTime(DROP_BEAT - 56 + i * 2),
  slug,
  name,
  tag,
}));

/* Rapid-fire wall — real program names from the catalog, 1 per beat then
   2 per beat as it accelerates into the stat block */
const RAPID_NAMES = [
  'Midnight', 'Juice', 'Neighborhood', 'Highway', 'Boot', 'HomeLab',
  'Hackvault', 'Outpost', 'Reboot', 'HackCraft', 'Lumen', 'Swirl',
  'Scraps', 'Slushies', 'Fallout', 'Stasis',
  // double-time from here
  'Polygon', 'Keeb', 'Noodles', 'Pxl', 'Meow', 'Woof', 'Bauble', 'Fudge',
];
export const RAPID_CARDS: {time: number; name: string}[] = RAPID_NAMES.map(
  (name, i) => ({
    time: i < 16 ? beatTime(DROP_BEAT - 40 + i) : beatTime(DROP_BEAT - 24 + (i - 16) * 0.5),
    name,
  }),
);

/* Stat block beats */
export const T_STAT_COUNT = beatTime(DROP_BEAT - 20);   // "170+ programs shipped"
export const T_STAT_KINDS = beatTime(DROP_BEAT - 16);   // hardware / games / ...
export const T_STAT_QUESTION = beatTime(DROP_BEAT - 12); // "about cybersecurity:"

/* Drop-section claim cards (between chorus vocal hits) */
export interface Claim {
  time: number;
  kind: 'lyric' | 'claim' | 'track';
  title: string;
  body?: string[];
}
export const DROP_SCHEDULE: Claim[] = [
  {time: T_DROP, kind: 'claim', title: '0DAY'},
  {time: CHORUS_HITS[0], kind: 'lyric', title: 'HACK ALL THE THINGS'},
  {time: beatTime(DROP_BEAT + 4), kind: 'claim', title: "hack club's first cybersecurity ysws"},
  {time: CHORUS_HITS[1], kind: 'lyric', title: 'HACK ALL THE THINGS'},
  {time: beatTime(DROP_BEAT + 8), kind: 'track', title: 'track 01 — build',
    body: ['scanner', 'log analyzer', 'leak finder', 'password cracker, visualized']},
  {time: CHORUS_HITS[2], kind: 'lyric', title: 'HACK ALL THE THINGS'},
  {time: beatTime(DROP_BEAT + 12), kind: 'track', title: 'track 02 — break',
    body: ['audit real code', 'reverse malware', 'dissect captures', 'trace attackers']},
  {time: beatTime(DROP_BEAT + 14), kind: 'claim', title: 'you ship → we ship'},
  {time: beatTime(DROP_BEAT + 16), kind: 'claim', title: 'reviewed by humans'},
  {time: CHORUS_HITS[3], kind: 'lyric', title: 'HACK ALL THE THINGS'},
  {time: beatTime(DROP_BEAT + 20), kind: 'claim', title: '18 & under · worldwide · free'},
  {time: CHORUS_HITS[4], kind: 'lyric', title: 'HACK ALL THE THINGS'},
  {time: beatTime(DROP_BEAT + 24), kind: 'claim', title: 'no certifications · no gatekeeping'},
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
  ...RAPID_CARDS.map((c, i) => ({
    time: c.time, sound: `tick${(i % 3) + 1}.wav`, vol: 0.16,
  })),
  {time: beatTime(DROP_BEAT + 8), sound: 'whoosh.wav', vol: 0.4},
  {time: beatTime(DROP_BEAT + 12), sound: 'whoosh.wav', vol: 0.4},
  {time: T_STAT_COUNT, sound: 'whoosh.wav', vol: 0.45},
];

export const YSWS_ASSETS = assets as Record<
  string,
  {file: string; width?: number; height?: number; svg?: boolean}
>;
