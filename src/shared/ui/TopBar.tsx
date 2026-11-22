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
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('a11y.back')}
        onPress={onBack ?? (() => navigation.goBack())}
        style={styles.back}
        hitSlop={4}
      >
        <ArrowLeft size={22} color={theme.color.text} strokeWidth={2} />
      </Pressable>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={[
          styles.title,
          subtle
            ? { fontFamily: theme.font.body(600), fontSize: 16, color: theme.color.textSecondary }
            : { fontFamily: theme.font.display(600), fontSize: 22, color: theme.color.text },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  back: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1 },
});
