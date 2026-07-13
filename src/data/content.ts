/* Page content as data — the repetitive bits of the landing page live here so
   the components stay markup-only. Edit copy here, not in the JSX. */

export const APPLY_URL = 'https://hackclub.com/slack';

export interface NavLink {
  href: string;
  label: string;
}
export const NAV: NavLink[] = [
  { href: '#program', label: 'Program' },
  { href: '#tracks', label: 'Tracks' },
  { href: '#how', label: 'How it works' },
  { href: '#faq', label: 'FAQ' },
];

// the acid ticker — one phrase string, rendered twice for the seamless loop
export const TICKER =
  'You ship → we ship // everything connected can be broken // ' +
  'no certifications, no gatekeeping // track 01: build // track 02: break // ' +
  'reviewed by humans // 18 & under, worldwide // ';

export interface SpecRow {
  label: string;
  value: string;
  acid?: boolean;
}
export const SPEC: SpecRow[] = [
  { label: 'program', value: 'You Ship, We Ship' },
  { label: 'operator', value: 'Hack Club' },
  { label: 'eligibility', value: '18 and under' },
  { label: 'cost', value: 'none' },
  { label: 'review', value: 'by humans' },
  { label: 'excuses accepted', value: '0', acid: true },
];

export interface TrackItem {
  term: string;
  desc: string;
}
export interface Track {
  no: string;
  title: string;
  sub: string;
  lead: string;
  items: TrackItem[];
  deliverable: string;
}
export const TRACKS: Track[] = [
  {
    no: 'Track 01',
    title: 'Build',
    sub: 'make a security tool',
    lead: 'If you can write code, you can build one of these:',
    items: [
      { term: 'Scanner', desc: "grades a website's defenses" },
      { term: 'Log analyzer', desc: 'catches brute-force attacks hiding in the noise' },
      { term: 'Leak finder', desc: 'hunts API keys exposed in a repo' },
      { term: 'Visualizer', desc: 'watch a weak password get cracked live' },
    ],
    deliverable: 'deliverable — a working tool',
  },
  {
    no: 'Track 02',
    title: 'Break',
    sub: 'find something real',
    lead: 'Dig into real software people use every day:',
    items: [
      { term: 'Audit', desc: 'hunt a vulnerability in open source, disclose it responsibly' },
      { term: 'Reverse', desc: 'take a piece of malware apart' },
      { term: 'Dissect', desc: 'pull a captured network conversation to pieces' },
      { term: 'Trace', desc: 'follow an attacker through server logs' },
    ],
    deliverable: 'deliverable — findings + writeup',
  },
];

export interface Step {
  no: string;
  title: string;
  body: string;
}
export const STEPS: Step[] = [
  {
    no: '01',
    title: 'Pick a track',
    body: "Build a tool, or break into real code. Both count. Both teach you what a tutorial can't.",
  },
  {
    no: '02',
    title: 'Ship something real',
    body: 'A working scanner. A disclosed vulnerability. A dissected capture. Real means it exists outside a tutorial.',
  },
  {
    no: '03',
    title: 'We ship you back',
    body: "Hack Club sends you something that takes you deeper into security. That's the deal.",
  },
];

export interface Faq {
  q: string;
  a: string;
}
export const FAQS: Faq[] = [
  {
    q: 'Who can join?',
    a: "Anyone 18 or under, anywhere in the world. It's free — that's the whole point of Hack Club.",
  },
  {
    q: "I've never done security before.",
    a: "Good — that's who this is for. The only prerequisite is that you can write code. Both tracks start from there.",
  },
  {
    q: 'What counts as "real"?',
    a: 'Something that exists outside a tutorial: a tool someone else could use, a bug that actually got fixed, a writeup someone learns from. Every submission is reviewed by real people at Hack Club.',
  },
  {
    q: 'What do I get for shipping?',
    a: 'Hack Club ships you something that takes you deeper into security. You ship, we ship — that\'s the deal.',
  },
  {
    q: 'Is breaking into things... legal?',
    a: "The Break track means auditing open-source code, analyzing malware samples, and reading logs and captures — then disclosing responsibly. Never touch systems you don't have permission to test.",
  },
];
