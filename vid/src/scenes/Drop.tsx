/* 45.45–62.76s (video time). The reveal IS the drop. Cards and gated chorus
   hits alternate, everything cut hard on the schedule in cuts.ts. The six
   lyric hits escalate — bigger and cleaner each time — and the last one
   inverts the frame straight into the outro. */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ACID, BG, DIM, DOTO_HEAVY, FG, HAIR, INK, MONO} from '../theme';
import {beatsIn, CHORUS_HITS, PERIOD, T_DROP, T_OUTRO} from '../lib/timeline';
import {DROP_SCHEDULE} from '../lib/cuts';
import {GlitchText, Punch} from '../components/fx';

const TICKER =
  'you ship → we ship // while(you.ship()) { we.ship(); } // everything connected can be broken // ' +
  'nmap your potential // somewhere, a flipper zero has your name on it // ' +
  'reviewed by humans // disclose responsibly // ' +
  'no certifications, no gatekeeping // 18 & under, worldwide // ';

const Ticker: React.FC<{t: number; ink?: boolean}> = ({t, ink}) => (
  <div
    style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      borderTop: `1px solid ${ink ? 'rgba(17,17,17,.3)' : HAIR}`, overflow: 'hidden',
      padding: '16px 0', whiteSpace: 'nowrap',
      fontFamily: MONO, fontSize: 26, color: ink ? 'rgba(17,17,17,.66)' : DIM,
    }}
  >
    <div style={{display: 'inline-block', transform: `translateX(${-((t - T_DROP) * 260) % 3000}px)`}}>
      {TICKER.repeat(6)}
    </div>
  </div>
);

/* per-hit escalation: size steps up while the glitch dies down */
const HIT_SIZE = [170, 185, 200, 215, 230, 250];
const HIT_GLITCH = [0.35, 0.28, 0.22, 0.16, 0.1, 0];

export const Drop: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;

  const idx = DROP_SCHEDULE.findLastIndex((c) => t >= c.time);
  const item = DROP_SCHEDULE[Math.max(idx, 0)];
  const local = t - item.time;

  // the very first frames of the reveal: inverted acid flash
  const flash = t - T_DROP < 0.1;
  // the last chorus hit: full inversion, ink on acid, out through the cut
  const hitIdx = item.kind === 'lyric' ? CHORUS_HITS.indexOf(item.time) : -1;
  const inverted = hitIdx === 5;

  let view: React.ReactNode = null;
  if (item.kind === 'reveal') {
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
  } else if (item.kind === 'lyric' && inverted) {
    view = (
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            ...DOTO_HEAVY, fontSize: HIT_SIZE[5], lineHeight: 0.92,
            color: INK, textAlign: 'center',
          }}
        >
          HACK<br />ALL THE<br />THINGS
        </div>
      </AbsoluteFill>
    );
  } else if (item.kind === 'lyric') {
    const align = hitIdx % 2 === 0 ? 'flex-start' : 'flex-end';
    view = (
      <AbsoluteFill style={{justifyContent: 'center', alignItems: align, padding: '0 90px'}}>
        <GlitchText strength={HIT_GLITCH[hitIdx] * Math.exp(-local * 6)} seed={item.time}>
          <div
            style={{
              ...DOTO_HEAVY, fontSize: HIT_SIZE[hitIdx], lineHeight: 0.95,
              color: ACID, textAlign: align === 'flex-start' ? 'left' : 'right',
            }}
          >
            HACK<br />ALL THE<br />THINGS
          </div>
        </GlitchText>
      </AbsoluteFill>
    );
  } else if (item.kind === 'first') {
    view = (
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: '0 160px'}}>
        <div style={{...DOTO_HEAVY, fontSize: 120, color: FG, textAlign: 'center', lineHeight: 1.15}}>
          hack club’s <span style={{color: ACID}}>first</span>
          <br />
          cybersecurity ysws
        </div>
      </AbsoluteFill>
    );
  } else if (item.kind === 'brief') {
    view = (
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: '0 160px'}}>
        <div style={{...DOTO_HEAVY, fontSize: 120, color: FG, textAlign: 'center', lineHeight: 1.1}}>
          do something <span style={{color: ACID}}>real</span>
          <br />
          in security.
        </div>
        <div style={{fontFamily: MONO, fontSize: 40, color: DIM, marginTop: 40}}>
          write it up. ship it. and get hacker gear.
        </div>
      </AbsoluteFill>
    );
  } else if (item.kind === 'direction') {
    view = (
      <AbsoluteFill style={{justifyContent: 'center', padding: '0 200px'}}>
        <div style={{fontFamily: MONO, fontSize: 26, letterSpacing: '.18em', color: DIM, marginBottom: 30}}>
          {item.no} / 03
        </div>
        <div style={{...DOTO_HEAVY, fontSize: 220, lineHeight: 0.9, color: FG}}>
          {item.title}
        </div>
        <div style={{fontFamily: MONO, fontSize: 44, color: ACID, marginTop: 30}}>
          {item.strap}
        </div>
      </AbsoluteFill>
    );
  } else if (item.kind === 'thesis') {
    view = (
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: '0 120px'}}>
        <div style={{...DOTO_HEAVY, fontSize: 120, color: FG, textAlign: 'center', lineHeight: 1.05}}>
          …OR <span style={{color: ACID}}>YOUR</span> OWN IDEA
        </div>
        <div style={{fontFamily: MONO, fontSize: 40, color: DIM, marginTop: 40}}>
          go wild!
        </div>
      </AbsoluteFill>
    );
  } else {
    // loot: the payoff — one static card, same grammar as the other claims
    view = (
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: '0 160px'}}>
        <div style={{...DOTO_HEAVY, fontSize: 120, color: FG, textAlign: 'center', lineHeight: 1.1}}>
          HOURS <span style={{fontFamily: MONO, color: ACID}}>→</span> GEAR
        </div>
        <div style={{fontFamily: MONO, fontSize: 40, color: DIM, marginTop: 40}}>
          {item.body!.join(' · ')}
        </div>
      </AbsoluteFill>
    );
  }

  const beats = beatsIn(T_DROP, T_OUTRO);
  return (
    <AbsoluteFill style={{background: flash || inverted ? ACID : BG}}>
      <Punch hits={beats} amount={0.05}>
        <Punch hits={CHORUS_HITS} amount={0.06}>
          {view}
        </Punch>
      </Punch>
      <Ticker t={t} ink={flash || inverted} />
    </AbsoluteFill>
  );
};
