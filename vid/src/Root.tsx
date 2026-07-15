import React from 'react';
import {Composition, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Video} from './Video';
import {DURATION, FPS, HEIGHT, WIDTH} from './lib/timeline';
import {LineageFeel, LINEAGE_FEEL_DURATION} from './concepts/LineageFeel';

/* same three faces the landing page uses */
loadFont({family: 'Doto', url: staticFile('fonts/Doto.ttf')});
loadFont({family: 'Plex Mono', url: staticFile('fonts/IBMPlexMono-Regular.ttf')});
loadFont({family: 'Grotesk', url: staticFile('fonts/SpaceGrotesk.ttf')});

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ZeroDayLaunch"
      component={Video}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    <Composition
      id="LineageFeel"
      component={LineageFeel}
      durationInFrames={LINEAGE_FEEL_DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  </>
);
