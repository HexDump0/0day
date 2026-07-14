/* Scene switcher. Scenes are NOT wrapped in offset Sequences on purpose:
   every scene computes from the absolute composition clock, so the beat grid
   in lib/timeline is valid everywhere without offset bookkeeping. */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FPS, T_DROP, T_OUTRO, T_TAPE_STOP, T_VERSE} from './lib/timeline';
import {AUDIO_CUTS} from './lib/cuts';
import {Mix} from './audio/Mix';
import {Chrome} from './components/fx';
import {ColdOpen} from './scenes/ColdOpen';
import {Lineage} from './scenes/Lineage';
import {Gap} from './scenes/Gap';
import {Drop} from './scenes/Drop';
import {Outro} from './scenes/Outro';

export const Video: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  let scene: React.ReactNode;
  if (t < T_VERSE) scene = <ColdOpen />;
  else if (t < T_TAPE_STOP) scene = <Lineage />;
  else if (t < T_DROP) scene = <Gap />;
  else if (t < T_OUTRO) scene = <Drop />;
  else scene = <Outro />;

  return (
    <AbsoluteFill style={{background: '#0b0b09'}}>
      {scene}
      <Chrome />
      <Mix cuts={AUDIO_CUTS} />
    </AbsoluteFill>
  );
};
