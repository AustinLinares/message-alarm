import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../../shared/i18n';
import { type Theme } from '../../shared/theme/themes';
import { useThemedStyles } from '../../shared/theme/ThemeProvider';
import { BrandMark } from '../../shared/ui/BrandMark';
import { TopBar } from '../../shared/ui/TopBar';

const SECTIONS = [
  { title: 'about.problem_title', body: 'about.problem_body' },
  { title: 'about.idea_title', body: 'about.idea_body' },
  { title: 'about.who_title', body: 'about.who_body' },
  { title: 'about.privacy_title', body: 'about.privacy_body' },
  { title: 'about.limit_title', body: 'about.limit_body' },
];

export function AboutScreen() {
  const styles = useThemedStyles(createStyles);
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <TopBar title={t('settings.about')} subtle />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.logoTile}>
            <BrandMark size={36} body="#FFFFFF" bells="#F5B83D" lines="#4338CA" />
          </View>
          <Text accessibilityRole="header" style={styles.headline}>
            {t('about.headline')}
          </Text>
        </View>
        {SECTIONS.map((section, index) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
            <View style={styles.sectionText}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                {t(section.title)}
              </Text>
              <Text style={styles.sectionBody}>{t(section.body)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: Theme) {
  const c = theme.color;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48, gap: 28 },
    hero: { gap: 16 },
    logoTile: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headline: {
      fontFamily: theme.font.display(600),
      fontSize: 30,
      lineHeight: 35,
      letterSpacing: -0.5,
      color: c.text,
    },
    section: { flexDirection: 'row', gap: 16, paddingTop: 22, borderTopWidth: 1, borderTopColor: c.border },
    number: { width: 32, fontFamily: theme.font.display(600), fontSize: 15, color: c.primary },
    sectionText: { flex: 1, gap: 8 },
    sectionTitle: { fontFamily: theme.font.body(700), fontSize: 17, color: c.text },
    sectionBody: { fontFamily: theme.font.body(400), fontSize: 15, lineHeight: 24, color: c.textSecondary },
  });
}
