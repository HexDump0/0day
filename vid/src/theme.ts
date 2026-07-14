import type React from 'react';

/* Brand tokens lifted verbatim from the 0day site (src/styles/index.css). */

export const BG = '#0b0b09';
export const FG = '#e8e7e0';
export const ACID = '#c6f52e';
export const DIM = '#9a9990';
export const BODY = '#d2d1c8';
export const HAIR = 'rgba(232, 231, 224, .18)';
export const INK = '#111111'; // text on acid

export const DOTO = 'Doto, monospace';
/* Doto is a variable font; without this it renders at its sparsest weight */
export const DOTO_HEAVY: React.CSSProperties = {
  fontFamily: DOTO,
  fontVariationSettings: "'wght' 900",
  fontWeight: 900,
};
export const MONO = '"Plex Mono", ui-monospace, monospace';
export const GROTESK = 'Grotesk, system-ui, sans-serif';

/* The site hero's ASCII density ramp — reused as texture so the video and
   the landing page share a visual signature. */
export const RAMP = " .':;-=+*csoxk%&#W@";
