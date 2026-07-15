/* 0.0–14.0s. The archival cold open.

   The track opens with a Hackers (1995) sample over dead silence:
   "Not every geek with a Commodore 64 can hack into NASA." We play it
   straight — real 1982 Commodore footage and real NASA 16mm, duotoned,
   cut on the spoken words; the quote decodes underneath as a subtitle.
   The instrumental slams in at beat 5, the footage keeps rolling but the
   cuts snap to the grid with deadpan annotations. Dedication card on the
   vocal, then the glitch-out into the verse. */
import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {ACID, BG, DIM, FG, MONO} from '../theme';
import {beatTime, sec, T_DEDICATION, T_VERSE} from '../lib/timeline';
import {
  DEDICATION_WORDS,
  FOOTAGE,
  INTRO_SHOTS,
  INTRO_WORDS,
  T_INTRO_SHOTS_END,
} from '../lib/cuts';
import {GlitchText, Punch, Typer} from '../components/fx';

const T_BEAT_IN = beatTime(5); // instrumental slams in

export const ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  const glitchOut = t > T_VERSE - 0.35 ? (t - (T_VERSE - 0.35)) / 0.35 : 0;

  const shotIdx = INTRO_SHOTS.findLastIndex((s) => t >= s.time);
  const shot = shotIdx >= 0 && t < T_INTRO_SHOTS_END ? INTRO_SHOTS[shotIdx] : null;
  const nextTime =
    shotIdx + 1 < INTRO_SHOTS.length
      ? INTRO_SHOTS[shotIdx + 1].time
      : T_INTRO_SHOTS_END;

  // one-frame acid flash when the beat lands
  const flash = t >= T_BEAT_IN && t < T_BEAT_IN + 0.05;

  return (
    <AbsoluteFill style={{background: flash ? ACID : BG}}>
      {/* archival footage, one Sequence per shot so each clip starts clean */}
      {shot && !flash && (
        <Punch hits={INTRO_SHOTS.map((s) => s.time)} amount={0.03}>
          <Sequence
            key={shot.time}
            from={sec(shot.time)}
            durationInFrames={sec(nextTime - shot.time) + 2}
          >
            <AbsoluteFill>
              <OffthreadVideo
                muted
                src={staticFile(`assets/footage/${FOOTAGE[shot.clip].file}`)}
                startFrom={sec(shot.startFrom ?? 0)}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            </AbsoluteFill>
          </Sequence>
        </Punch>
      )}

      {/* provenance slate, top right */}
      {shot && (
        <div
          style={{
            position: 'absolute', top: 60, right: 80, fontFamily: MONO,
            fontSize: 26, color: DIM,
            background: 'rgba(11,11,9,.72)', padding: '6px 14px',
          }}
        >
          src: {shot.slate}
        </div>
      )}

      {/* the quote, decoding as a subtitle while the sample speaks */}
      {t >= INTRO_WORDS[0].time && t < T_BEAT_IN + 0.4 && (
        <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center'}}>
          <div style={{marginBottom: 100, textAlign: 'center'}}>
            <div
              style={{
                display: 'inline-block', background: 'rgba(11,11,9,.78)',
                padding: '12px 28px',
              }}
            >
              <Typer
                words={INTRO_WORDS}
                style={{fontSize: 46, lineHeight: 1.6, color: FG}}
              />
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* deadpan annotations on the grid-locked cuts */}
      {shot?.note && t >= T_BEAT_IN + 0.4 && (
        <div
          style={{
            position: 'absolute', bottom: 64, left: 80, fontFamily: MONO,
            fontSize: 32, color: FG,
            background: 'rgba(11,11,9,.78)', padding: '10px 22px',
          }}
        >
          <span style={{color: ACID}}>&gt; </span>
          {shot.note}
        </div>
      )}

      {/* dedication: black, small, set like a film dedication card */}
      {t >= T_DEDICATION - 0.05 && (
        <AbsoluteFill
          style={{background: BG, justifyContent: 'center', alignItems: 'center'}}
        >
          <GlitchText strength={glitchOut * 0.9} seed={1}>
            <Typer
              words={DEDICATION_WORDS}
              style={{fontSize: 54, lineHeight: 1.7, color: FG}}
            />
          </GlitchText>
        </AbsoluteFill>
      )}

      {frame % 2 === 0 && glitchOut > 0.5 && (
        <AbsoluteFill style={{background: ACID, opacity: 0.06}} />
      )}
    </AbsoluteFill>
  );
};
