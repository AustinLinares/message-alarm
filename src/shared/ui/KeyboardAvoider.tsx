import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, type StyleProp, type ViewStyle } from 'react-native';

// Lifts its content (typically a footer with action buttons) above the
// on-screen keyboard instead of leaving it hidden behind it.
export function KeyboardAvoider({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <KeyboardAvoidingView behavior="padding" style={[{ flex: 1 }, style]}>
      {children}
    </KeyboardAvoidingView>
  );
}

// Lets a footer drop its bottom safe-area padding while the keyboard covers it.
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}
