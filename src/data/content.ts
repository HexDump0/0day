/* The public program spec. Keep claims here factual: these strings are reused
   across the page, so the site cannot quietly contradict itself section to
   section. */

export const APPLY_URL = 'https://hackclub.com/slack';

export interface NavLink {
  href: string;
  label: string;
}

export const NAV: NavLink[] = [
  { href: '#brief', label: 'What is this?' },
  { href: '#proof', label: 'Proof' },
  { href: '#rules', label: 'Rules' },
  { href: '#how', label: 'How it works' },
  { href: '#faq', label: 'FAQ' },
];

export const TICKER =
  'HAVE YOU TRIED TURNING IT OFF AND NEVER TURNING IT BACK ON // ' +
  'WHILE(YOU.SHIP()) { WE.SHIP(); } // ' +
  '18 & UNDER, WORLDWIDE // ' +
  'NMAP YOUR POTENTIAL // ' +
  'SOMEWHERE, A FLIPPER ZERO HAS YOUR NAME ON IT // ' +
  '404: EXCUSES NOT FOUND // ' +
  '0 DAYS OF EXPERIENCE REQUIRED // ' +
  'DISCLOSE RESPONSIBLY // ';

export interface ProgramFact {
  label: string;
  value: string;
}

export const PROGRAM_FACTS: ProgramFact[] = [
  { label: 'format', value: 'You Ship, We Ship' },
  { label: 'eligibility', value: '18 & under' },
  { label: 'reach', value: 'worldwide' },
  { label: 'cost', value: 'free' },
];

export interface Direction {
  id: 'build' | 'break' | 'reverse';
  no: string;
  title: string;
  strap: string;
  lead: string;
  examples: string[];
  ships: string[];
  note: string;
}

export const DIRECTIONS: Direction[] = [
  {
    id: 'build',
    no: '01',
    title: 'Build',
    strap: 'Make security useful.',
    lead:
      'Write software that helps somebody inspect, defend, understand, or safely demonstrate a real security problem.',
    examples: [
      'A scanner that grades a site’s defenses',
      'A leak finder that hunts exposed secrets',
      'An exploit proof-of-concept for your own target',
      'Defensive automation people can actually run',
    ],
    ships: ['working tool', 'source code', 'technical writeup'],
    note: 'A tutorial clone is practice. Your submission should make a decision of its own.',
  },
  {
    id: 'break',
    no: '02',
    title: 'Break',
    strap: 'Find something real.',
    lead:
      'Audit open-source software or systems you own, find a real vulnerability, and handle the result like a responsible researcher.',
    examples: [
      'Trace an unsafe trust boundary in open source',
      'Turn a suspicious code path into a reproducible finding',
      'Show the impact without harming users or data',
      'Report it privately and document the fix',
    ],
    ships: ['reproduction', 'responsible disclosure', 'findings + writeup'],
    note: 'Paid bounties do not count. 0day is for original work that is not already compensated.',
  },
  {
    id: 'reverse',
    no: '03',
    title: 'Reverse',
    strap: 'Explain the artifact.',
    lead:
      'Start with a binary, firmware image, malware sample, file format, or protocol—and work backwards until its behavior makes sense.',
    examples: [
      'Malware teardown: persistence, payload, and IOCs',
      'Firmware dig: hardcoded secrets, backdoors, weak crypto',
      'Reverse an undocumented format or network protocol',
      'Explain a hidden feature or anti-analysis technique',
    ],
    ships: ['annotated analysis', 'reversed specification', 'parser · unpacker · YARA rule'],
    note: 'Use isolated environments and only artifacts you legally have. Crackmes and preset challenges are practice, not a ship.',
  },
];

export interface HourMethod {
  no: string;
  title: string;
  covers: string;
  proof: string;
}

export const HOUR_METHODS: HourMethod[] = [
  {
    no: 'A',
    title: 'Hackatime',
    covers: 'Code written in a tracked editor.',
    proof: 'Link the project.',
  },
  {
    no: 'B',
    title: 'Lapse',
    covers: 'Ghidra, Wireshark, Burp, VMs, hardware, and other tool-driven work.',
    proof: 'Submit the timelapse.',
  },
  {
    no: 'C',
    title: 'Self-declare',
    covers: 'Research, thinking, documentation, and responsible disclosure.',
    proof: 'Log it honestly.',
  },
];

export interface RuleItem {
  title: string;
  body: string;
}

export const IN_SCOPE: RuleItem[] = [
  { title: 'Your own systems', body: 'Hardware, software, and networks you control.' },
  { title: 'Open-source code', body: 'Audit it carefully and disclose findings responsibly.' },
  { title: 'Legal artifacts', body: 'Research samples, firmware you own, and freely distributed binaries.' },
  { title: 'Original work', body: 'A question you chose—not a flag someone hid for you.' },
];

export const OUT_OF_SCOPE: RuleItem[] = [
  { title: 'CTFs and labs', body: 'Great practice. They are not an eligible ship.' },
  { title: 'Paid bounties', body: 'Already-compensated work does not earn gear again.' },
  { title: 'Preset RE challenges', body: 'Crackmes and challenge writeups are practice.' },
  { title: 'Uninvited testing', body: 'Never touch a system you do not own or have permission to test.' },
];

export interface Step {
  no: string;
  title: string;
  body: string;
}

export const STEPS: Step[] = [
  {
    no: '01',
    title: 'Do something real',
    body: 'Build a tool, find a real vuln, or take software apart. Original work only — CTF flags and paid bounties don’t count.',
  },
  {
    no: '02',
    title: 'Log your hours',
    body: 'Link your Hackatime project, record with Lapse, or self-declare. Use whichever methods fit your work.',
  },
  {
    no: '03',
    title: 'Write it up',
    body: 'Your writeup is your proof. At review, your hours are checked against it — make it justify your time.',
  },
  {
    no: '04',
    title: 'We ship you back',
    body: 'Approved hours become a balance; the balance becomes hacker gear. Ship again, earn again.',
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
    a: "Good — that's who this is for. Start on the build side: if you can write code, you can build a scanner, a leak-finder, a cracking visualizer. The deep end can wait.",
  },
  {
    q: 'What counts as a ship?',
    a: "Something real and original, plus a writeup. CTFs and labs don't count — someone already planted that flag for you. Paid bug bounties don't count either — you already got paid. Practice on CTFs all you want; ship original work.",
  },
  {
    q: 'How do hours work?',
    a: 'Declare them however fits your work: link a Hackatime project, record a Lapse timelapse, or self-declare — any or all. At review, your hours are cross-checked against your writeup. The better the writeup, the more defensible the hours — especially the self-declared ones.',
  },
  {
    q: 'What gear can I get?',
    a: 'Flipper Zeros, HackRFs, cyberdecks, Raspberry Pis, Bad USBs, and more. Your hours become a balance; the balance becomes gear. Repeatable — ship again, earn again.',
  },
  {
    q: 'Is breaking into things... legal?',
    a: "On your own systems and in open-source code, yes — find the bug, then disclose responsibly. The hard line: never touch anything you don't own or weren't invited to test. That's the difference between a security researcher and a criminal.",
  },
];
