import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {ACID, BG, DIM, DOTO_HEAVY, FG, INK, MONO} from '../theme';

const FPS = 60;
export const LINEAGE_FEEL_DURATION = 1000;

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const programs = [
  {file: 'stardance.png', name: 'stardance'},
  {file: 'macondo.png', name: 'macondo'},
  {file: 'game.png', name: 'the game'},
  {file: 'shipyard.svg', name: 'shipyard'},
  {file: 'blueprint.png', name: 'blueprint'},
  {file: 'horizons.png', name: 'horizons'},
  {file: 'anvil.png', name: 'anvil'},
  {file: 'forge.png', name: 'forge'},
] as const;

const TypeFrame: React.FC<{
  children: React.ReactNode;
  background?: string;
  color?: string;
  align?: 'left' | 'center';
}> = ({children, background = BG, color = FG, align = 'left'}) => (
  <AbsoluteFill
    style={{
      background,
      color,
      justifyContent: align === 'center' ? 'center' : 'flex-end',
      alignItems: align === 'center' ? 'center' : 'flex-start',
      padding: align === 'center' ? 0 : '0 140px 150px',
    }}
  >
    <div
      style={{
        ...DOTO_HEAVY,
        fontSize: align === 'center' ? 300 : 220,
        lineHeight: 0.92,
        letterSpacing: -7,
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

const Opening: React.FC = () => {
  const frame = useCurrentFrame();

  if (frame < 90) {
    return (
      <AbsoluteFill
        style={{
          background: BG,
          justifyContent: 'center',
          padding: '0 150px',
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 50, color: FG, lineHeight: 1.45}}>
          for years,
          <br />
          hack club has run one deal.
        </div>
      </AbsoluteFill>
    );
  }

  if (frame < 145) {
    return (
      <TypeFrame>
        YOU SHIP<span style={{color: ACID}}>.</span>
      </TypeFrame>
    );
  }

  if (frame < 200) {
    return (
      <TypeFrame background={ACID} color={INK}>
        WE SHIP.
      </TypeFrame>
    );
  }

  return (
    <AbsoluteFill
      style={{
        background: BG,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 54, color: FG}}>something real.</div>
    </AbsoluteFill>
  );
};

const ProgramFrame: React.FC<{index: number; localFrame: number}> = ({
  index,
  localFrame,
}) => {
  const program = programs[index];
  const isSvg = program.file.endsWith('.svg');
  return (
    <AbsoluteFill style={{background: BG}}>
      <Img
        src={staticFile(`assets/ysws/${program.file}`)}
        style={{
          position: 'absolute',
          left: 130,
          right: 130,
          top: 100,
          width: 1660,
          height: 820,
          objectFit: isSvg ? 'contain' : 'cover',
          padding: isSvg ? 210 : 0,
          scale: interpolate(localFrame, [0, 44], [1, 1.018], clamp),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 138,
          bottom: 82,
          fontFamily: MONO,
          fontSize: 27,
          color: FG,
        }}
      >
        {program.name}
      </div>
    </AbsoluteFill>
  );
};

const Montage: React.FC<{frame: number}> = ({frame}) => {
  const index = Math.min(programs.length - 1, Math.floor(frame / 45));
  return <ProgramFrame index={index} localFrame={frame - index * 45} />;
};

const Ending: React.FC<{frame: number}> = ({frame}) => {

  if (frame < 90) {
    return (
      <TypeFrame>
        170+<span style={{color: ACID}}>.</span>
        <div
          style={{
            fontFamily: MONO,
            fontVariationSettings: 'normal',
            fontWeight: 400,
            fontSize: 38,
            letterSpacing: 0,
            marginTop: 38,
            color: DIM,
          }}
        >
          programs shipped
        </div>
      </TypeFrame>
    );
  }

  if (frame < 170) {
    return (
      <AbsoluteFill
        style={{
          background: BG,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 48, color: DIM}}>
          about cybersecurity?
        </div>
      </AbsoluteFill>
    );
  }

  if (frame < 225) return <AbsoluteFill style={{background: BG}} />;

  if (frame < 315) {
    return (
      <TypeFrame align="center">
        <span style={{color: ACID}}>0</span>
      </TypeFrame>
    );
  }

  if (frame < 370) {
    return (
      <AbsoluteFill
        style={{
          background: BG,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 48, color: FG}}>until now.</div>
      </AbsoluteFill>
    );
  }

  return (
    <TypeFrame align="center" background={ACID} color={INK}>
      0DAY
    </TypeFrame>
  );
};

const MinimalAudio: React.FC = () => (
  <>
    <Audio
      src={staticFile('audio/instrumental.mp3')}
      trimBefore={Math.round(13.98 * FPS)}
      volume={(frame) => interpolate(frame, [0, 40, 745, 770], [0.25, 0.9, 0.9, 0], clamp)}
    />
    <Audio
      src={staticFile('audio/vocals.mp3')}
      trimBefore={Math.round(13.98 * FPS)}
      volume={(frame) => interpolate(frame, [0, 40, 735, 765], [0, 0.72, 0.72, 0], clamp)}
    />
    <Sequence from={752} durationInFrames={150} premountFor={30}>
      <Audio src={staticFile('audio/sfx/tape_stop.wav')} volume={0.9} />
    </Sequence>
    <Sequence from={820} durationInFrames={130} premountFor={30}>
      <Audio src={staticFile('audio/sfx/sub_hit.wav')} volume={1} />
    </Sequence>
    <Sequence from={845} durationInFrames={155} premountFor={30}>
      <Audio src={staticFile('audio/sfx/riser.wav')} volume={0.72} />
    </Sequence>
  </>
);

export const LineageFeel: React.FC = () => {
  const frame = useCurrentFrame();
  let scene: React.ReactNode;

  if (frame < 230) scene = <Opening />;
  else if (frame < 590) scene = <Montage frame={frame - 230} />;
  else scene = <Ending frame={frame - 590} />;

  return (
    <AbsoluteFill style={{background: BG}}>
      {scene}
      <MinimalAudio />
    </AbsoluteFill>
  );
};
