/* 14.45–49.87s. The YSWS lineage: what YSWS is, the flagship wall (real
   duotoned artwork), the accelerating name wall, then the stat block that
   walks straight into the tape-stop. Hard cuts only, all on the grid. */
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ACID, BG, DIM, DOTO_HEAVY, FG, HAIR, MONO} from '../theme';
import {beatTime, DROP_BEAT, PERIOD, sec} from '../lib/timeline';
import {
  FLAGSHIP_CARDS, RAPID_CARDS, T_STAT_COUNT, T_STAT_KINDS, T_STAT_QUESTION,
  YSWS_ASSETS,
} from '../lib/cuts';
import {Punch, PunchHit, Typewriter} from '../components/fx';

/* punch weight follows the gear: full on readable cuts, lighter as the wall
   speeds up — the biggest hit is saved for 170+ */
const RAPID_PUNCH = [0.045, 0.038, 0.022];
const PUNCH_HITS: PunchHit[] = [
  ...FLAGSHIP_CARDS.map((c) => ({time: c.time, amount: 0.045})),
  ...RAPID_CARDS.map((c) => ({time: c.time, amount: RAPID_PUNCH[c.gear]})),
  {time: T_STAT_COUNT, amount: 0.08},
  {time: T_STAT_KINDS, amount: 0.045},
  {time: T_STAT_QUESTION, amount: 0.045},
];

/* running program counter, top right — tracks the cut density, so it
   creeps through the flagships and spins out through the strobe, arriving
   just under 170 as the stat slams */
const Counter: React.FC<{t: number}> = ({t}) => {
  const n = Math.round(
    interpolate(
      t,
      [
        FLAGSHIP_CARDS[0].time,
        beatTime(DROP_BEAT - 30), // rapid wall starts
        beatTime(DROP_BEAT - 28), // 2 / beat
        beatTime(DROP_BEAT - 26), // 4 / beat
        T_STAT_COUNT,
      ],
      [1, 12, 20, 35, 90],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
    ),
  );
  return (
    <div
      style={{
        position: 'absolute', top: 60, right: 80, fontFamily: MONO,
        fontSize: 30, color: DIM,
      }}
    >
      programs_shipped: <span style={{color: ACID}}>{String(n).padStart(3, '0')}</span>
    </div>
  );
};

const Intro: React.FC<{t: number}> = ({t}) => {
  const b = (k: number) => t >= beatTime(DROP_BEAT + k);
  return (
    <AbsoluteFill style={{justifyContent: 'center', padding: '0 140px'}}>
      <div style={{fontFamily: MONO, fontSize: 40, color: DIM}}>
        {b(-50) && <div>for years, hack club has run</div>}
      </div>
      {b(-48) && (
        <div style={{...DOTO_HEAVY, fontSize: 130, color: FG, margin: '20px 0'}}>
          YOU SHIP, WE SHIP
        </div>
      )}
      <div style={{fontFamily: MONO, fontSize: 40, color: FG}}>
        {b(-45) && (
          <div>
            you ship a project <span style={{color: ACID}}>→</span> they ship you
            something real
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Flagship: React.FC<{t: number}> = ({t}) => {
  const idx = FLAGSHIP_CARDS.findLastIndex((c) => t >= c.time);
  const card = FLAGSHIP_CARDS[idx];
  const asset = YSWS_ASSETS[card.slug];
  const local = t - card.time;
  // alternate push-in / pull-out and label side so the wall doesn't loop
  const pushIn = idx % 2 === 0;
  const pan = pushIn ? 1.04 + local * 0.012 : 1.06 - local * 0.012;
  const labelLeft = idx % 2 === 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            width: 1320, height: 700, overflow: 'hidden',
            border: `1px solid ${HAIR}`, position: 'relative',
            background: '#131310',
          }}
        >
          <Img
            src={staticFile(`assets/ysws/${asset.file}`)}
            style={{
              width: '100%', height: '100%',
              objectFit: asset.svg ? 'contain' : 'cover',
              padding: asset.svg ? 140 : 0,
              transform: `scale(${pan})`,
              filter: asset.svg ? 'grayscale(1) invert(0.85) brightness(1.15)' : undefined,
            }}
          />
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute', bottom: 140,
          ...(labelLeft ? {left: 80} : {right: 80, textAlign: 'right' as const}),
        }}
      >
        <div style={{...DOTO_HEAVY, fontSize: 96, color: FG}}>
          {card.name.toUpperCase()}
        </div>
        <div style={{fontFamily: MONO, fontSize: 30, color: DIM, marginTop: 6}}>
          {card.tag}
        </div>
      </div>
      <div
        style={{
          position: 'absolute', top: 60, left: 80, fontFamily: MONO,
          fontSize: 30, color: DIM,
        }}
      >
        [{String(idx + 1).padStart(2, '0')}/{String(FLAGSHIP_CARDS.length).padStart(2, '0')}]
      </div>
    </AbsoluteFill>
  );
};

const Rapid: React.FC<{t: number}> = ({t}) => {
  const idx = RAPID_CARDS.findLastIndex((c) => t >= c.time);
  const card = RAPID_CARDS[idx];
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{...DOTO_HEAVY, fontSize: 200, color: FG, textAlign: 'center'}}>
        {card.name.toUpperCase()}
      </div>
      <div
        style={{
          position: 'absolute', bottom: 64, right: 80, fontFamily: MONO,
          fontSize: 28, color: DIM,
        }}
      >
        and dozens more
      </div>
    </AbsoluteFill>
  );
};

const Stats: React.FC<{t: number}> = ({t}) => {
  // pick up where the corner counter left off and roll home in one beat
  const rollFast = interpolate(t, [T_STAT_COUNT, T_STAT_COUNT + PERIOD], [90, 170], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{...DOTO_HEAVY, fontSize: 330, color: FG, lineHeight: 1}}>
        {Math.round(rollFast)}+
      </div>
      <div style={{fontFamily: MONO, fontSize: 40, color: DIM, marginTop: 10}}>
        programs shipped
      </div>
      <div style={{fontFamily: MONO, fontSize: 38, color: FG, marginTop: 60, minHeight: 48}}>
        {t >= T_STAT_KINDS && 'hardware · games · websites · hackathons · music'}
      </div>
      <div style={{marginTop: 40, minHeight: 56}}>
        {t >= T_STAT_QUESTION && (
          <Typewriter
            text="about cybersecurity: "
            startFrame={sec(T_STAT_QUESTION)}
            endFrame={sec(T_STAT_QUESTION + 1.1)}
            style={{fontSize: 44, color: ACID}}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};

export const Lineage: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  let view: React.ReactNode;
  if (t < FLAGSHIP_CARDS[0].time) view = <Intro t={t} />;
  else if (t < RAPID_CARDS[0].time) view = <Flagship t={t} />;
  else if (t < T_STAT_COUNT) view = <Rapid t={t} />;
  else view = <Stats t={t} />;

  return (
    <AbsoluteFill style={{background: BG}}>
      <Punch hits={PUNCH_HITS}>
        {view}
      </Punch>
      {t < T_STAT_COUNT && <Counter t={t} />}
    </AbsoluteFill>
  );
};
