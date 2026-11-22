import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { RadialGlow, type Glow } from './RadialGlow';

const CRISTAL_GLOWS: Glow[] = [
  { cx: '10%', cy: '5%', r: '55%', color: '#3B2D8F' },
  { cx: '95%', cy: '90%', r: '60%', color: '#0E6E8C' },
];
const BLOQUEO_GLOWS: Glow[] = [{ cx: '50%', cy: '18%', r: '60%', color: '#FF5E8A', opacity: 0.28 }];

// Page background: flat colour, or the dark themes' glowing gradients.
export function ScreenBackground({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const glows = theme.ui.background === 'cristal' ? CRISTAL_GLOWS : theme.ui.background === 'bloqueo' ? BLOQUEO_GLOWS : null;
  return (
    <View style={[{ flex: 1, backgroundColor: theme.color.background }, style]}>
      {glows && <RadialGlow glows={glows} />}
      {children}
    </View>
  );
}
