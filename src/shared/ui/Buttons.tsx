import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface ButtonProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Full-width, 56px tall main action.
export function PrimaryButton({ label, onPress, icon, disabled, style }: ButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        {
          backgroundColor: pressed ? theme.color.primaryPressed : theme.color.primary,
          borderRadius: theme.radius.card,
          opacity: disabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      {icon}
      <Text style={{ fontFamily: theme.font.body(700), fontSize: 16, color: theme.color.onPrimary, flexShrink: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, icon, disabled, style }: ButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.secondary,
        {
          borderColor: theme.color.border,
          backgroundColor: theme.color.surface,
          borderRadius: theme.radius.control,
          opacity: disabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      {icon}
      <Text style={{ fontFamily: theme.font.body(600), fontSize: 14, color: theme.color.text, flexShrink: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  primary: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondary: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
