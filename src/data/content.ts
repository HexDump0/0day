/* The public program spec. Keep claims here factual: these strings are reused
   across the page, so the site cannot quietly contradict itself section to
   section. */

export const APPLY_URL = "https://rsvp.hackclub.community/0day";

export interface NavLink {
  href: string;
  label: string;
}

export const NAV: NavLink[] = [
  { href: '#brief', label: 'What is this?' },
  { href: '#how', label: 'How it works' },
  { href: '#proof', label: 'Proof' },
  { href: '#rules', label: 'Rules' },
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

export interface Direction {
  id: 'build' | 'break' | 'reverse';
  no: string;
  title: string;
  strap: string;
  lead: string;
  examples: string[];
}

export const DIRECTIONS: Direction[] = [
    {
        id: "build",
        no: "01",
        title: "Build",
        strap: "Make something useful.",
        lead: "Build software,tools or projects for cybersecurity.",
        examples: [
            "A website fuzzer",
            "Vulnerability scanner",
            "Packet sniffer",
        ],
    },
    {
        id: "break",
        no: "02",
        title: "Break",
        strap: "Find something real.",
        lead: "Find real vulns in software, report them and get a CVE, make detailed a write up on a recent CVE.",
        examples: [
            "Write PoC for a new CVE",
            "Find a CVE on a open source project",
            "Make a detailed write up on a recent CVE",
        ],
    },
    {
        id: "reverse",
        no: "03",
        title: "Reverse",
        strap: "Tear stuff apart.",
        lead: "Reverse engineer a binary, firmware image, malware sample, file format, or protocol and make a write up on your findings.",
        examples: [
            "Teardown a malware (safely)",
            "Reverse engineer a binary or firmware image",
            "Reverse an undocumented format or network protocol",
        ],
    },
];

export interface HourMethod {
  id: 'hackatime' | 'lapse' | 'self';
  no: string;
  title: string;
  covers: string;
  proof: string;
}

export const HOUR_METHODS: HourMethod[] = [
  {
    id: 'hackatime',
    no: 'A',
    title: 'Hackatime',
    covers: 'Code written in a tracked editor.',
    proof: 'Link the project.',
  },
  {
    id: 'lapse',
    no: 'B',
    title: 'Lapse',
    covers: 'Ghidra, Wireshark, Burp, VMs, hardware, and other work.',
    proof: 'Submit the timelapse.',
  },
  {
    id: 'self',
    no: 'C',
    title: 'Self-declare',
    covers: 'Research, thinking, documentation.',
    proof: 'Please log it honestly.',
  },
];

export interface RuleItem {
  title: string;
  body: string;
}

export const IN_SCOPE: RuleItem[] = [
  { title: 'Your own stuff', body: 'Hardware, software, and networks you own.' },
  { title: 'Open-source code', body: 'And remember to disclose responsibly.' },
  { title: 'Original work', body: 'Should not be a copy paste of a yt tutorial.' },
];

export const OUT_OF_SCOPE: RuleItem[] = [
  { title: 'CTFs and labs', body: 'Great practice. They are not an eligible ship.' },
  { title: 'Paid bounties', body: 'You already got paid.' },
  { title: 'Preset RE challenges', body: 'Crackmes and challenge writeups are practice.' },
];

export interface Step {
  no: string;
  title: string;
  body: string;
}

export const STEPS: Step[] = [
  {
    no: '01',
    title: 'Make',
    body: 'Build, break, or reverse something real.',
  },
  {
    no: '02',
    title: 'Track',
    body: 'Use Hackatime, Lapse or self-declare.',
  },
  {
    no: '03',
    title: 'Write up',
    body: 'Make a write up on your work.',
  },
  {
    no: '04',
    title: 'Get gear',
    body: 'Get stuff for the hours you spent.',
  },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: 'Who can join?',
    a: "Anyone 18 or under, anywhere in the world. It's free! that's the whole point of Hack Club.",
  },
  {
    q: "I've never done security before.",
    a: "Good, that's who this is for. Start on the build side: if you can write code, you can build a scanner, a leak finder and other stuff",
  },
  {
    q: 'What counts as a ship?',
    a: "Something real and original, plus a writeup. CTFs and labs don't count and Paid bug bounties don't count either. Practice on CTFs all you want; ship original work.",
  },
  {
    q: 'How do hours work?',
    a: 'Declare them however fits your work: link a Hackatime project, record a Lapse, or self-declare. At review, your hours are cross checked against your writeup. The better the writeup, the more defensible your hours are especially the self-declared ones.',
  },
  {
    q: 'What gear can I get?',
    a: 'Flipper Zeros, HackRFs, cyberdecks, Raspberry Pis, Bad USBs, and more!',
  },
  {
    q: 'Is breaking into things... legal?',
    a: "On your own systems and in open-source code, yes.",
  },
];
