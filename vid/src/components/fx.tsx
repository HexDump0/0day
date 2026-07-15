/* The whole effect vocabulary lives here — and it is deliberately small:
   scanlines/grain, glitch text (rgb split), typewriter, beat punch-zoom,
   chromatic burst. Nothing else gets invented in scene files. */
import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {ACID, FG, HAIR, INK, MONO} from '../theme';
import {FPS, impulse} from '../lib/timeline';

/* ---- global texture: scanlines + vignette + drifting grain ---- */
export const Chrome: React.FC<{opacity?: number}> = ({opacity = 1}) => {
  const frame = useCurrentFrame();
  const jitter = Math.floor(frame / 2) % 4;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity}}>
      <AbsoluteFill
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,.22) 0 1px, transparent 1px 4px)',
          backgroundPositionY: jitter,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.5) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

/* ---- rgb-split glitch text; strength 0..1 ---- */
export const GlitchText: React.FC<{
  children: React.ReactNode;
  strength: number;
  style?: React.CSSProperties;
  seed?: number;
}> = ({children, strength, style, seed = 0}) => {
  const frame = useCurrentFrame();
  const r1 = random(`gx-${seed}-${Math.floor(frame / 2)}`) - 0.5;
  const r2 = random(`gy-${seed}-${Math.floor(frame / 2)}`) - 0.5;
  const dx = strength * 14 * r1;
  const dy = strength * 4 * r2;
  const base: React.CSSProperties = {position: 'absolute', inset: 0, ...style};
  return (
    <div style={{position: 'relative', ...style}}>
      {strength > 0.04 && (
        <>
          <div aria-hidden style={{...base, color: '#ff3b6b', transform: `translate(${dx}px, ${dy}px)`, opacity: 0.8, mixBlendMode: 'screen'}}>
            {children}
          </div>
          <div aria-hidden style={{...base, color: '#3bd0ff', transform: `translate(${-dx}px, ${-dy}px)`, opacity: 0.8, mixBlendMode: 'screen'}}>
            {children}
          </div>
        </>
      )}
      <div style={{position: 'relative'}}>{children}</div>
    </div>
  );
};

/* ---- typewriter; reveals text between startFrame and endFrame ---- */
export const Typewriter: React.FC<{
  text: string;
  startFrame: number;
  endFrame: number;
  cursor?: boolean;
  style?: React.CSSProperties;
}> = ({text, startFrame, endFrame, cursor = true, style}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const n = Math.floor(p * text.length);
  const blink = Math.floor(frame / 18) % 2 === 0;
  return (
    <span style={{fontFamily: MONO, color: FG, whiteSpace: 'pre-wrap', ...style}}>
      {text.slice(0, n)}
      {cursor && (
        <span style={{color: ACID, opacity: p >= 1 ? (blink ? 1 : 0) : 1}}>▮</span>
      )}
    </span>
  );
};

/* ---- the Typer: characters ripple through block states, then settle ----
   Port of arlan.me/vault/typer (MIT), made deterministic for Remotion.
   Words carry absolute timeline seconds, so text can sync to speech
   (whisper onsets) or to the beat grid with the same component. */
const TYPER_STATES = ['fill', 'inverse', 'outline'] as const;

const typerCharStyle = (
  state: (typeof TYPER_STATES)[number] | 'plain',
): React.CSSProperties => {
  switch (state) {
    case 'fill':
      return {background: ACID, color: 'transparent', borderRadius: 3};
    case 'inverse':
      return {background: FG, color: INK, borderRadius: 3};
    case 'outline':
      return {boxShadow: `inset 0 0 0 1.5px ${HAIR}`, color: 'transparent', borderRadius: 3};
    default:
      return {};
  }
};

export const Typer: React.FC<{
  words: {time: number; text: string}[];
  cycleFrames?: number; // how long each char rolls before settling
  style?: React.CSSProperties;
}> = ({words, cycleFrames = 9, style}) => {
  const frame = useCurrentFrame();
  return (
    <span style={{fontFamily: MONO, color: FG, whiteSpace: 'pre-wrap', ...style}}>
      {words.map((w, wi) => (
        <span key={wi} style={{display: 'inline-block', whiteSpace: 'pre'}}>
          {[...w.text, ...(wi < words.length - 1 ? [' '] : [])].map((ch, ci) => {
            const reveal = Math.round(w.time * FPS) + ci; // 1-frame char stagger
            if (frame < reveal || ch === ' ') {
              return (
                <span key={ci} style={{visibility: frame < reveal ? 'hidden' : undefined}}>
                  {ch}
                </span>
              );
            }
            const age = frame - reveal;
            const state =
              age >= cycleFrames
                ? 'plain'
                : TYPER_STATES[
                    (Math.floor(age / 3) +
                      Math.floor(random(`typer-${wi}-${ci}`) * 3)) %
                      TYPER_STATES.length
                  ];
            return (
              <span key={ci} style={typerCharStyle(state)}>
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
};

/* ---- beat-locked punch-in zoom + chromatic burst wrapper ----
   `hits` are timeline seconds; scale/aberration decay after each hit. */
export const Punch: React.FC<{
  hits: number[];
  amount?: number;
  children: React.ReactNode;
}> = ({hits, amount = 0.055, children}) => {
  const frame = useCurrentFrame();
  const k = impulse(frame, hits, 12);
  return (
    <AbsoluteFill style={{transform: `scale(${1 + amount * k})`}}>
      {children}
      {k > 0.25 && (
        <AbsoluteFill
          style={{
            boxShadow: `inset ${6 * k}px 0 0 rgba(255,59,107,${0.25 * k}), inset ${-6 * k}px 0 0 rgba(59,208,255,${0.25 * k})`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

/* ---- spec row, straight off the landing page ---- */
export const SpecRow: React.FC<{
  label: string;
  value: string;
  acid?: boolean;
  style?: React.CSSProperties;
}> = ({label, value, acid, style}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: 60,
      borderBottom: `1px solid ${HAIR}`,
      padding: '14px 4px',
      fontFamily: MONO,
      fontSize: 30,
      ...style,
    }}
  >
    <span style={{color: '#9a9990'}}>{label}</span>
    <span style={{color: acid ? ACID : FG}}>{value}</span>
  </div>
);
