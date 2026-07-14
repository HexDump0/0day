/* 14.45–49.87s. The YSWS lineage: what YSWS is, the flagship wall (real
   duotoned artwork), the accelerating name wall, then the stat block that
   walks straight into the tape-stop. Hard cuts only, all on the grid. */
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ACID, BG, DIM, DOTO_HEAVY, FG, HAIR, INK, MONO} from '../theme';
import {ALLOWED_LINES, beatTime, DROP_BEAT, PERIOD, sec, T_TAPE_STOP} from '../lib/timeline';
import {
  FLAGSHIP_CARDS, RAPID_CARDS, T_STAT_COUNT, T_STAT_KINDS, T_STAT_QUESTION,
  YSWS_ASSETS,
} from '../lib/cuts';
import {Punch, Typewriter} from '../components/fx';

const CUT_TIMES = [
  ...FLAGSHIP_CARDS.map((c) => c.time),
  ...RAPID_CARDS.map((c) => c.time),
  T_STAT_COUNT, T_STAT_KINDS, T_STAT_QUESTION,
];

/* running program counter, top right — accelerates with the montage */
const Counter: React.FC<{t: number}> = ({t}) => {
  const n = Math.round(
    interpolate(
      t,
      [beatTime(DROP_BEAT - 56), beatTime(DROP_BEAT - 40), beatTime(DROP_BEAT - 24), T_STAT_COUNT],
      [1, 24, 90, 170],
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

/* lower-third caption for the whitelisted verse vocals — the on-screen text
   and the audible words are the same data */
const Caption: React.FC<{t: number}> = ({t}) => {
  const line = ALLOWED_LINES.find(
    (l) => t >= l.time && t < l.end && l.time > 15 && l.time < 50,
  );
  if (!line) return null;
  return (
    <div
      style={{
        position: 'absolute', bottom: 64, left: 80, fontFamily: MONO,
        fontSize: 30, color: FG,
      }}
    >
      <span style={{color: ACID}}>&gt; </span>
      {line.text.toLowerCase()}
    </div>
  );
};

const Intro: React.FC<{t: number}> = ({t}) => {
  const b = (k: number) => t >= beatTime(DROP_BEAT + k);
  return (
    <AbsoluteFill style={{justifyContent: 'center', padding: '0 140px'}}>
      <div style={{fontFamily: MONO, fontSize: 40, color: DIM}}>
        {b(-64) && <div>for years, hack club has run</div>}
      </div>
      {b(-62) && (
        <div style={{...DOTO_HEAVY, fontSize: 130, color: FG, margin: '20px 0'}}>
          YOU SHIP, WE SHIP
        </div>
      )}
      <div style={{fontFamily: MONO, fontSize: 40, color: FG}}>
        {b(-59) && (
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
  const pan = 1.04 + local * 0.012; // slow per-card push-in
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
      <div style={{position: 'absolute', left: 80, bottom: 140}}>
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
  const invert = idx % 4 === 3;
  return (
    <AbsoluteFill
      style={{
        background: invert ? ACID : BG,
        justifyContent: 'center', alignItems: 'center',
      }}
    >
      <div
        style={{
          ...DOTO_HEAVY, fontSize: 200,
          color: invert ? INK : FG, textAlign: 'center',
        }}
      >
        {card.name.toUpperCase()}
      </div>
      <div
        style={{
          position: 'absolute', bottom: 64, fontFamily: MONO, fontSize: 28,
          color: invert ? INK : DIM,
        }}
      >
        and dozens more
      </div>
    </AbsoluteFill>
  );
};

const Stats: React.FC<{t: number}> = ({t}) => {
  const rollFast = interpolate(t, [T_STAT_COUNT, T_STAT_COUNT + PERIOD * 2], [90, 170], {
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
      {t >= T_STAT_KINDS && (
        <div style={{fontFamily: MONO, fontSize: 38, color: FG, marginTop: 60}}>
          hardware · games · websites · hackathons · music
        </div>
      )}
      {t >= T_STAT_QUESTION && (
        <div style={{marginTop: 60}}>
          <Typewriter
            text="about cybersecurity: "
            startFrame={sec(T_STAT_QUESTION)}
            endFrame={sec(T_STAT_QUESTION + 1.1)}
            style={{fontSize: 44, color: ACID}}
          />
        </div>
      )}
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
      <Punch hits={CUT_TIMES.map((c) => c)} amount={0.045}>
        {view}
      </Punch>
      {t < T_STAT_COUNT && <Counter t={t} />}
      <Caption t={t} />
    </AbsoluteFill>
  );
};
