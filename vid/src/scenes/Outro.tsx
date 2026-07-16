/* 62.76–69.56s. "Zero through Three, we're in every single ring" — the rings
   collapse to ring 0, one deadpan sign-off, then the lockup. */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ACID, BG, DIM, DOTO_HEAVY, FG, MONO} from '../theme';
import {T_END, T_OUTRO} from '../lib/timeline';

const RING_STEP = 0.27;
const T_RING0 = T_OUTRO + 3 * RING_STEP;   // "ring 0" lands
const T_SIGNOFF = T_OUTRO + 3.2;           // rings out, sign-off in
const T_LOCKUP = T_SIGNOFF + 1.44;         // final lockup

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  const blink = Math.floor(frame / 20) % 2 === 0;

  if (t < T_SIGNOFF) {
    const step = Math.min(Math.floor((t - T_OUTRO) / RING_STEP), 3);
    const ring = 3 - step;
    return (
      <AbsoluteFill style={{background: BG, justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            ...DOTO_HEAVY, lineHeight: 0.9,
            fontSize: 180 + step * 70,
            color: ring === 0 ? ACID : FG,
          }}
        >
          RING {ring}
        </div>
        {t >= T_RING0 + 0.9 && (
          <div style={{fontFamily: MONO, fontSize: 38, color: FG, marginTop: 40}}>
            we’re in every single ring
          </div>
        )}
      </AbsoluteFill>
    );
  }

  if (t < T_LOCKUP) {
    // plain card, same deadpan register as the dedication
    return (
      <AbsoluteFill style={{background: BG, justifyContent: 'center', alignItems: 'center'}}>
        <div style={{fontFamily: MONO, fontSize: 44, color: FG}}>
          and dont actually hack into nasa tho
        </div>
      </AbsoluteFill>
    );
  }

  const fade = interpolate(t, [T_END - 0.9, T_END - 0.1], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{background: BG, justifyContent: 'center', alignItems: 'center', opacity: fade}}
    >
      <div style={{...DOTO_HEAVY, fontSize: 300, color: ACID, lineHeight: 0.95}}>
        0DAY
      </div>
      <div style={{fontFamily: MONO, fontSize: 40, color: FG, marginTop: 20}}>
        you ship. we ship.
      </div>
      <div style={{fontFamily: MONO, fontSize: 34, color: DIM, marginTop: 50}}>
        0day.hexdump0.pw{' '}
        <span style={{color: ACID, opacity: blink ? 1 : 0}}>▮</span>
      </div>
    </AbsoluteFill>
  );
};
