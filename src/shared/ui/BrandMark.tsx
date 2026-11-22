import type { Theme } from '../theme/themes';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

interface BrandMarkProps {
  size: number;
  // Defaults match the indigo icon: indigo clock face with white text lines.
  body?: string;
  bells?: string;
  lines?: string;
}

// Logo mark from the design (logo/svg/mark-indigo.svg), drawn in a 70x74 viewBox.
export function BrandMark({ size, body = '#4338CA', bells = '#F5B83D', lines = '#FFFFFF' }: BrandMarkProps) {
  return (
    <Svg width={size} height={(size * 74) / 70} viewBox="12 14 70 74">
      <G transform="translate(2 -1)">
        <Path d="M25 29a11 11 0 0 1 15-9" stroke={bells} strokeWidth={6} fill="none" strokeLinecap="round" />
        <Path d="M75 29a11 11 0 0 0-15-9" stroke={bells} strokeWidth={6} fill="none" strokeLinecap="round" />
        <Path d="M65 72l5 7" stroke={body} strokeWidth={5} strokeLinecap="round" />
        <Circle cx={50} cy={52} r={25} fill={body} />
        <Path d="M33 66C30 74 25 80 18 84C28 85 37 81 43 75z" fill={body} />
        <Rect x={37} y={44} width={26} height={5.5} rx={2.75} fill={lines} />
        <Rect x={37} y={55} width={17} height={5.5} rx={2.75} fill={lines} />
      </G>
    </Svg>
  );
}

// Mark colours for the small logo tile (a `primary` square) in each theme.
export function brandColors(theme: Theme) {
  return {
    body: theme.color.onPrimary,
    bells: theme.id === 'cristal' ? '#FFFFFF' : theme.color.accent,
    lines: theme.color.primary,
  };
}
