/* 0.0–14.45s. Terminal boot on the beat, then the dedication line typed in
   sync with the only vocal of the intro. Ends in a glitch-out. */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ACID, BG, DIM, FG, MONO} from '../theme';
import {beatTime, sec, T_DEDICATION, T_VERSE} from '../lib/timeline';
import {GlitchText, Typewriter} from '../components/fx';

const BOOT: {beat: number; text: string; dim?: boolean}[] = [
  {beat: 1, text: '$ ssh hacker@0day.hackclub.com'},
  {beat: 3, text: "The authenticity of host '0day' can't be established.", dim: true},
  {beat: 5, text: 'Are you sure you want to continue connecting? yes', dim: true},
  {beat: 7, text: 'Warning: you are now inside.', dim: true},
  {beat: 9, text: 'hacker@0day:~$ cat /etc/motd'},
];

export const ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  const glitchOut = t > T_VERSE - 0.35 ? (t - (T_VERSE - 0.35)) / 0.35 : 0;

  return (
    <AbsoluteFill style={{background: BG, padding: '90px 110px'}}>
      <div style={{fontFamily: MONO, fontSize: 34, lineHeight: 1.9}}>
        {BOOT.map((l) => {
          const at = beatTime(l.beat);
          if (t < at) return null;
          return (
            <div key={l.beat} style={{color: l.dim ? DIM : FG}}>
              {l.text}
            </div>
          );
        })}
      </div>
      {t >= T_DEDICATION - 0.1 && (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <GlitchText strength={glitchOut * 0.9} seed={1}>
            <div style={{textAlign: 'center', padding: '0 200px'}}>
              <Typewriter
                text={'// this one’s dedicated\n// to all the hackers'}
                startFrame={sec(T_DEDICATION)}
                endFrame={sec(T_DEDICATION + 3.2)}
                style={{fontSize: 76, color: FG, lineHeight: 1.5}}
              />
            </div>
          </GlitchText>
        </AbsoluteFill>
      )}
      {frame % 2 === 0 && glitchOut > 0.5 && (
        <AbsoluteFill style={{background: ACID, opacity: 0.06}} />
      )}
    </AbsoluteFill>
  );
};
