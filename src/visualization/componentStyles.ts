import type { CSSProperties } from 'react';

const colors = [
  ['#e1eecb', '#47672d'],
  ['#dceafb', '#305c8d'],
  ['#ffe7ca', '#865819'],
  ['#eedff7', '#774795'],
  ['#d1eee9', '#2b7067'],
  ['#f8dfe5', '#92445a'],
  ['#eeeecc', '#696926'],
  ['#e1e2fa', '#51559b'],
  ['#f5e2ce', '#88592e'],
  ['#d9eff2', '#306f79'],
  ['#e9e5e1', '#6d6259'],
  ['#f4ddeb', '#8b3f70'],
];

export function componentStyle(index: number): CSSProperties {
  const [background, border] = colors[index % colors.length];
  return { '--component-background': background, '--component-border': border } as CSSProperties;
}
