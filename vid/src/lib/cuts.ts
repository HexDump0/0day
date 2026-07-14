/* The edit decision list. Scenes render from these tables and the audio layer
   places ticks/whooshes from them too — one schedule, two consumers. */
import {beatTime, CHORUS_HITS, DROP_BEAT, T_DROP} from './timeline';
import assets from '../data/ysws-assets.json';

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
