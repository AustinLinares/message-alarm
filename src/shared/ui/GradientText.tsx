import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import type { StyleProp, TextStyle } from 'react-native';
import { Text } from 'react-native';
import { GRADIENTS, type GradientId } from '../theme/themes';

interface GradientTextProps {
  gradient: GradientId;
  style: StyleProp<TextStyle>;
  children: string;
}

// Top-to-bottom gradient fill on text, as the lock-screen theme's big clock uses.
export function GradientText({ gradient, style, children }: GradientTextProps) {
  const colors = GRADIENTS[gradient].stops as [string, string, ...string[]];
  return (
    <MaskedView maskElement={<Text style={style}>{children}</Text>}>
      <LinearGradient colors={colors} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}
