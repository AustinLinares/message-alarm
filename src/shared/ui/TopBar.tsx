import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../i18n';
import { useTheme } from '../theme/ThemeProvider';

interface TopBarProps {
  title: string;
  onBack?: () => void;
  // Smaller, muted title (used by "About", which has its own large headline).
  subtle?: boolean;
}

export function TopBar({ title, onBack, subtle }: TopBarProps) {
  const theme = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View
      style={[
        styles.bar,
        { paddingTop: insets.top + 8 },
        theme.ui.ruled && {
          marginHorizontal: 20,
          paddingHorizontal: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.color.borderStrong,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('a11y.back')}
        onPress={onBack ?? (() => navigation.goBack())}
        style={[
          styles.back,
          theme.id === 'cristal' || theme.id === 'bloqueo'
            ? {
                borderRadius: 22,
                backgroundColor: theme.id === 'bloqueo' ? theme.color.surface : 'transparent',
                borderWidth: theme.id === 'bloqueo' ? 1 : 0,
                borderColor: theme.color.border,
              }
            : null,
        ]}
        hitSlop={4}
      >
        <ArrowLeft size={22} color={theme.color.text} strokeWidth={2} />
      </Pressable>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={[
          styles.title,
          theme.ui.uppercase
            ? { fontFamily: theme.font.heading(800), fontSize: 15, letterSpacing: 0.4, color: theme.color.text }
            : subtle
              ? { fontFamily: theme.font.body(600), fontSize: 16, color: theme.color.textSecondary }
              : { fontFamily: theme.font.heading(600), fontSize: 22, color: theme.color.text },
        ]}
      >
        {theme.ui.uppercase ? title.toUpperCase() : title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  back: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1 },
});
