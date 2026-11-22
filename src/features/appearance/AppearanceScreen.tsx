import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../../shared/i18n';
import { GRADIENT_IDS, GRADIENTS, SCREEN_PADDING_X, THEME_IDS, type Theme } from '../../shared/theme/themes';
import { useAppSettings, useTheme, useThemedStyles } from '../../shared/theme/ThemeProvider';
import { ScreenBackground } from '../../shared/ui/ScreenBackground';
import { TopBar } from '../../shared/ui/TopBar';
import { Toggle } from '../../shared/ui/Toggle';
import { ThemePreview } from './ThemePreview';

export function AppearanceScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useI18n();
  const { settings, updateSettings } = useAppSettings();

  return (
    <ScreenBackground>
      <TopBar title={t('appearance.title')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>{t('appearance.intro')}</Text>

        <View accessibilityRole="radiogroup" accessibilityLabel={t('settings.theme')} style={styles.grid}>
          {THEME_IDS.map((id) => {
            const selected = settings.theme === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => updateSettings({ theme: id })}
                style={[styles.themeCard, { borderColor: selected ? theme.color.primary : 'transparent' }]}
              >
                <ThemePreview id={id} gradient={settings.gradient} />
                <View style={styles.themeFooter}>
                  <Text style={styles.themeName}>{t(`theme.${id}`)}</Text>
                  {selected && <Check size={18} color={theme.color.primary} strokeWidth={2.6} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {settings.theme === 'bloqueo' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{t('appearance.gradient')}</Text>
            <View accessibilityRole="radiogroup" accessibilityLabel={t('appearance.gradient')} style={styles.swatches}>
              {GRADIENT_IDS.map((id) => {
                const selected = settings.gradient === id;
                const stops = GRADIENTS[id].stops as [string, string, ...string[]];
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="radio"
                    accessibilityLabel={t(`gradient.${id}`)}
                    accessibilityState={{ checked: selected }}
                    onPress={() => updateSettings({ gradient: id })}
                    style={styles.swatchItem}
                  >
                    <View
                      style={[
                        styles.swatchRing,
                        selected && { borderColor: theme.color.primary },
                      ]}
                    >
                      <GradientSwatch colors={stops} />
                    </View>
                    <Text style={styles.swatchName}>{t(`gradient.${id}`)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={[styles.panel, styles.panelRow]}>
          <View style={styles.panelText}>
            <Text style={styles.panelTitle}>{t('appearance.follow_system')}</Text>
            <Text style={styles.panelSub}>{t('appearance.follow_system_sub')}</Text>
          </View>
          <Toggle
            value={settings.followSystem}
            onValueChange={(followSystem) => updateSettings({ followSystem })}
            label={t('appearance.follow_system')}
          />
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

function GradientSwatch({ colors }: { colors: [string, string, ...string[]] }) {
  return (
    <LinearGradient
      colors={colors}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ width: 52, height: 52, borderRadius: 26 }}
    />
  );
}

function createStyles(theme: Theme) {
  const c = theme.color;
  return StyleSheet.create({
    content: { paddingHorizontal: SCREEN_PADDING_X, paddingTop: 8, paddingBottom: 40, gap: 14 },
    intro: { marginHorizontal: 4, fontFamily: theme.font.body(400), fontSize: 14, lineHeight: 21, color: c.textSecondary },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    themeCard: {
      width: '48%',
      flexGrow: 1,
      padding: 8,
      borderRadius: theme.id === 'suizo' ? 0 : 20,
      borderWidth: 2,
      backgroundColor: c.surface,
    },
    themeFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      paddingTop: 10,
      paddingBottom: 2,
      paddingHorizontal: 4,
      minHeight: 44,
    },
    themeName: { flex: 1, fontFamily: theme.font.body(600), fontSize: 14, color: c.text },
    panel: {
      marginTop: 10,
      padding: 16,
      borderRadius: theme.id === 'indigo' ? 18 : theme.radius.cardLarge,
      backgroundColor: c.surface,
      borderWidth: theme.ui.cardBorder,
      borderColor: c.border,
      gap: 12,
    },
    panelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    panelText: { flex: 1, gap: 2 },
    panelTitle: { fontFamily: theme.font.body(600), fontSize: 15, color: c.text },
    panelSub: { fontFamily: theme.font.body(400), fontSize: 13, color: c.textMuted },
    swatches: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    swatchItem: { flex: 1, alignItems: 'center', gap: 6, minHeight: 44 },
    swatchRing: { padding: 3, borderRadius: 32, borderWidth: 2, borderColor: 'transparent' },
    swatchName: { fontFamily: theme.font.body(500), fontSize: 12, color: c.text, textAlign: 'center' },
  });
}
