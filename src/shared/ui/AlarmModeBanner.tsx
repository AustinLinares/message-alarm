import { BellRing, X } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import { applyAlarmMode } from '../notifications/alarmMode';
import { SCREEN_PADDING_X, type Theme } from '../theme/themes';
import { useAppSettings, useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { SecondaryButton } from './Buttons';
import { useDialog } from './Dialog';

// Invites the user to turn on alarm mode until they do, or close the notice.
// The same switch lives permanently in Settings.
export function AlarmModeBanner() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useI18n();
  const dialog = useDialog();
  const { settings, updateSettings } = useAppSettings();

  if (Platform.OS !== 'android' || settings.alarmMode || settings.alarmBannerDismissed) return null;

  async function enable() {
    await applyAlarmMode(true);
    updateSettings({ alarmMode: true });
    dialog.show({ title: t('alarmmode.on_title'), message: t('alarmmode.on_body') });
  }

  return (
    <View style={styles.banner}>
      <View style={styles.top}>
        <BellRing size={20} color={theme.color.onWarningSoft} />
        <View style={styles.text}>
          <Text style={styles.title}>{t('alarmmode.banner_title')}</Text>
          <Text style={styles.body}>{t('alarmmode.banner_body')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('alarmmode.dismiss')}
          onPress={() => updateSettings({ alarmBannerDismissed: true })}
          hitSlop={10}
          style={styles.close}
        >
          <X size={18} color={theme.color.onWarningSoft} />
        </Pressable>
      </View>
      <SecondaryButton label={t('alarmmode.enable')} onPress={enable} />
    </View>
  );
}

function createStyles(theme: Theme) {
  const c = theme.color;
  return StyleSheet.create({
    banner: {
      marginHorizontal: SCREEN_PADDING_X,
      marginTop: 16,
      padding: 14,
      gap: 12,
      borderRadius: theme.ui.ruled ? 0 : theme.radius.control + 4,
      backgroundColor: c.warningSoft,
      borderWidth: theme.ui.ruled ? 1 : 0,
      borderColor: c.borderStrong,
    },
    top: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    text: { flex: 1, gap: 4 },
    title: { fontFamily: theme.font.body(700), fontSize: 15, color: c.onWarningSoft },
    body: { fontFamily: theme.font.body(400), fontSize: 14, lineHeight: 20, color: c.onWarningSoft },
    close: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  });
}
