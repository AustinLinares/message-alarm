import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

export interface Glow {
  cx: string; // e.g. "15%"
  cy: string;
  r: string;
  color: string;
  opacity?: number;
}

// React Native has no radial gradients; the dark themes' glowing backgrounds are drawn as SVG.
export function RadialGlow({ glows }: { glows: Glow[] }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" pointerEvents="none">
      <Defs>
        {glows.map((glow, index) => (
          <RadialGradient key={index} id={`glow${index}`} cx={glow.cx} cy={glow.cy} r={glow.r}>
            <Stop offset="0" stopColor={glow.color} stopOpacity={glow.opacity ?? 1} />
            <Stop offset="1" stopColor={glow.color} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {glows.map((_glow, index) => (
        <Rect key={index} x="0" y="0" width="100%" height="100%" fill={`url(#glow${index})`} />
      ))}
    </Svg>
  );
}
