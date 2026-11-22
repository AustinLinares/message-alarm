import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { GradientText } from './GradientText';

interface ClockProps {
  time: string;
  size: number;
  color: string;
  letterSpacing?: number;
  style?: StyleProp<TextStyle>;
}

// The big time display in the theme's own face; the lock-screen theme fills it with the chosen gradient.
export function Clock({ time, size, color, letterSpacing, style }: ClockProps) {
  const theme = useTheme();
  const textStyle: TextStyle = {
    fontFamily: theme.font.display(theme.clock.weight),
    fontSize: size,
    letterSpacing: letterSpacing ?? theme.clock.letterSpacing,
    lineHeight: Math.round(size * (theme.id === 'suizo' ? 0.92 : 1.05)),
    color,
    includeFontPadding: false,
  };
  if (theme.ui.gradientClock) {
    return (
      <GradientText gradient={theme.gradient} style={[textStyle, style]}>
        {time}
      </GradientText>
    );
  }
  return <Text style={[textStyle, style]}>{time}</Text>;
}
