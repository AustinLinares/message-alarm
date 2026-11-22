import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../../shared/i18n';
import { type Theme } from '../../shared/theme/themes';
import { useTheme, useThemedStyles } from '../../shared/theme/ThemeProvider';
import { BrandMark, brandColors } from '../../shared/ui/BrandMark';
import { GradientText } from '../../shared/ui/GradientText';
import { ScreenBackground } from '../../shared/ui/ScreenBackground';
import { TopBar } from '../../shared/ui/TopBar';

const SECTIONS = [
  { title: 'about.problem_title', body: 'about.problem_body' },
  { title: 'about.idea_title', body: 'about.idea_body' },
  { title: 'about.who_title', body: 'about.who_body' },
  { title: 'about.privacy_title', body: 'about.privacy_body' },
  { title: 'about.limit_title', body: 'about.limit_body' },
];

export function AboutScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const palette = brandColors(theme);
  const upper = (text: string) => (theme.ui.uppercase ? text.toUpperCase() : text);
  const lock = theme.id === 'bloqueo';
  const { t } = useI18n();

  return (
    <ScreenBackground>
      <TopBar title={t('settings.about')} subtle />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.logoTile}>
            <BrandMark size={36} body={palette.body} bells={palette.bells} lines={palette.lines} />
          </View>
          {lock ? (
            <GradientText gradient={theme.gradient} style={styles.headline}>
              {t('about.headline')}
            </GradientText>
          ) : (
            <Text accessibilityRole="header" style={styles.headline}>
              {t('about.headline')}
            </Text>
          )}
        </View>
        {SECTIONS.map((section, index) => (
          <View key={section.title} style={styles.section}>
            {lock ? (
              <GradientText gradient={theme.gradient} style={styles.number}>
                {String(index + 1).padStart(2, '0')}
              </GradientText>
            ) : (
              <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
            )}
            <View style={styles.sectionText}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                {t(section.title)}
              </Text>
              <Text style={styles.sectionBody}>{t(section.body)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenBackground>
  );
}

function createStyles(theme: Theme) {
  const c = theme.color;
  const swiss = theme.ui.ruled;
  const boxed = theme.id === 'cristal' || theme.id === 'bloqueo';
  return StyleSheet.create({
    content: { paddingHorizontal: swiss ? 20 : boxed ? 20 : 24, paddingTop: 16, paddingBottom: 48, gap: boxed ? 12 : 28 },
    hero: { gap: 16, paddingBottom: boxed ? 8 : 0 },
    logoTile: {
      width: 56,
      height: 56,
      borderRadius: swiss ? 0 : 16,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headline: {
      fontFamily: theme.font.heading(theme.id === 'cristal' ? 300 : swiss ? 800 : 600),
      fontSize: swiss ? 40 : theme.id === 'bloqueo' ? 34 : theme.id === 'cristal' ? 32 : 30,
      lineHeight: swiss ? 42 : 38,
      letterSpacing: swiss ? -2 : -0.5,
      color: c.text,
    },
    section: boxed
      ? {
          flexDirection: 'row',
          gap: 16,
          padding: 18,
          borderRadius: 24,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
        }
      : { flexDirection: 'row', gap: 16, paddingTop: 22, borderTopWidth: 1, borderTopColor: swiss ? c.borderStrong : c.border },
    number: {
      width: 32,
      fontFamily: theme.font.heading(theme.id === 'bloqueo' ? 900 : 600),
      fontSize: theme.id === 'bloqueo' ? 18 : 15,
      color: swiss ? c.textMuted : c.primary,
    },
    sectionText: { flex: 1, gap: 8 },
    sectionTitle: {
      fontFamily: theme.font.body(theme.id === 'cristal' ? 500 : 700),
      fontSize: 17,
      color: theme.id === 'cristal' ? c.primary : c.text,
    },
    sectionBody: { fontFamily: theme.font.body(400), fontSize: 15, lineHeight: 24, color: c.textSecondary },
  });
}
