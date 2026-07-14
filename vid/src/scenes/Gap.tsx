/* 49.87–54.92s. The music is dead. Two bars of silence carry the whole
   argument: "about cybersecurity: 0". Then the riser drags us to the drop. */
import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {ACID, BG, DIM, DOTO_HEAVY, FG, MONO} from '../theme';
import {T_DROP, T_UNTIL_NOW, T_ZERO} from '../lib/timeline';
import {GlitchText} from '../components/fx';

export const Gap: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;

  const zeroIn = t >= T_ZERO;
  const slam = zeroIn
    ? interpolate(t, [T_ZERO, T_ZERO + 0.12], [1.6, 1], {
        extrapolateRight: 'clamp',
      })
    : 0;
  // pre-drop shake, building over the riser
  const build = interpolate(t, [T_UNTIL_NOW, T_DROP], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const sx = (random(`sx${frame}`) - 0.5) * 26 * build ** 2;
  const sy = (random(`sy${frame}`) - 0.5) * 26 * build ** 2;

  return (
    <AbsoluteFill style={{background: BG}}>
      <AbsoluteFill
        style={{
          justifyContent: 'center', alignItems: 'center',
          transform: `translate(${sx}px, ${sy}px)`,
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 44, color: DIM}}>
          about cybersecurity:
        </div>
        {zeroIn && (
          <GlitchText strength={build * 0.8} seed={9}>
            <div
              style={{
                ...DOTO_HEAVY, fontSize: 560, color: ACID,
                lineHeight: 0.9, transform: `scale(${slam})`,
              }}
            >
              0
            </div>
          </GlitchText>
        )}
        {t >= T_UNTIL_NOW && (
          <div style={{fontFamily: MONO, fontSize: 40, color: FG, marginTop: 30}}>
            until now.
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
