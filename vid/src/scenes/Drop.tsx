/* 54.92–72.42s. The reveal IS the drop. Claim cards and gated chorus hits
   alternate, everything cut hard on the schedule in cuts.ts. */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ACID, BG, DIM, DOTO_HEAVY, FG, HAIR, INK, MONO} from '../theme';
import {beatsIn, CHORUS_HITS, PERIOD, T_DROP, T_OUTRO} from '../lib/timeline';
import {DROP_SCHEDULE} from '../lib/cuts';
import {GlitchText, Punch, SpecRow} from '../components/fx';

const TICKER =
  'you ship → we ship // everything connected can be broken // no certifications, no gatekeeping // ' +
  'track 01: build // track 02: break // reviewed by humans // 18 & under, worldwide // ';

const Ticker: React.FC<{t: number}> = ({t}) => (
  <div
    style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      borderTop: `1px solid ${HAIR}`, overflow: 'hidden',
      padding: '16px 0', whiteSpace: 'nowrap',
      fontFamily: MONO, fontSize: 26, color: DIM,
    }}
  >
    <div style={{display: 'inline-block', transform: `translateX(${-((t - T_DROP) * 260) % 3000}px)`}}>
      {TICKER.repeat(6)}
    </div>
  </div>
);

export const Drop: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;

  const idx = DROP_SCHEDULE.findLastIndex((c) => t >= c.time);
  const item = DROP_SCHEDULE[Math.max(idx, 0)];
  const local = t - item.time;

  // the very first frames of the reveal: inverted acid flash
  const flash = t - T_DROP < 0.1;

  let view: React.ReactNode = null;
  if (item.title === '0DAY') {
    view = (
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            ...DOTO_HEAVY, fontSize: 420,
            color: flash ? INK : ACID, lineHeight: 0.9,
          }}
        >
          0DAY
        </div>
        {local > PERIOD * 0.6 && (
          <div style={{fontFamily: MONO, fontSize: 40, color: flash ? INK : FG}}>
            a cybersecurity you-ship-we-ship, by hack club
          </div>
        )}
      </AbsoluteFill>
    );
  } else if (item.kind === 'lyric') {
    const align = CHORUS_HITS.indexOf(item.time) % 2 === 0 ? 'flex-start' : 'flex-end';
    view = (
      <AbsoluteFill style={{justifyContent: 'center', alignItems: align, padding: '0 90px'}}>
        <GlitchText strength={0.35 * Math.exp(-local * 6)} seed={item.time}>
          <div
            style={{
              ...DOTO_HEAVY, fontSize: 170, lineHeight: 0.95,
              color: ACID, textAlign: align === 'flex-start' ? 'left' : 'right',
            }}
          >
            HACK<br />ALL THE<br />THINGS
          </div>
        </GlitchText>
      </AbsoluteFill>
    );
  } else if (item.kind === 'track') {
    view = (
      <AbsoluteFill style={{justifyContent: 'center', padding: '0 200px'}}>
        <div style={{...DOTO_HEAVY, fontSize: 120, color: FG, marginBottom: 40}}>
          {item.title.toUpperCase()}
        </div>
        <div style={{width: 1100}}>
          {item.body!.map((b, i) => {
            const show = local >= (i + 1) * PERIOD * 0.5;
            return show ? (
              <SpecRow key={b} label={`0${i + 1}`} value={b} acid={i === 0} />
            ) : null;
          })}
        </div>
      </AbsoluteFill>
    );
  } else {
    const first = item.title.includes('first');
    view = (
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: '0 160px'}}>
        <div
          style={{
            ...(first ? DOTO_HEAVY : {fontFamily: MONO, fontWeight: 500}),
            fontSize: first ? 120 : 74,
            color: FG, textAlign: 'center', lineHeight: 1.15,
          }}
        >
          {first ? (
            <>
              hack club’s <span style={{color: ACID}}>first</span>
              <br />
              cybersecurity ysws
            </>
          ) : (
            item.title
          )}
        </div>
      </AbsoluteFill>
    );
  }

  const beats = beatsIn(T_DROP, T_OUTRO);
  return (
    <AbsoluteFill style={{background: flash ? ACID : BG}}>
      <Punch hits={beats} amount={0.05}>
        <Punch hits={CHORUS_HITS} amount={0.06}>
          {view}
        </Punch>
      </Punch>
      <Ticker t={t} />
    </AbsoluteFill>
  );
};
