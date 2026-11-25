import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BatteryWarning, BellRing, ChevronRight, Download, Info, Palette, Upload } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useI18n } from '../../shared/i18n';
import { SCREEN_PADDING_X, type Theme } from '../../shared/theme/themes';
import { useAppSettings, useTheme, useThemedStyles } from '../../shared/theme/ThemeProvider';
import { applyAlarmMode } from '../../shared/notifications/alarmMode';
import { useDialog } from '../../shared/ui/Dialog';
import { Toggle } from '../../shared/ui/Toggle';
import { ScreenBackground } from '../../shared/ui/ScreenBackground';
import { TopBar } from '../../shared/ui/TopBar';
import { exportBackup, importBackup } from './backupService';

interface SettingsRowProps {
  icon: ReactNode;
  iconBackground: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  last?: boolean;
}

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useI18n();
  const { reloadSettings, settings, updateSettings } = useAppSettings();
  const dialog = useDialog();
  const [working, setWorking] = useState(false);

  async function handleAlarmMode(enabled: boolean) {
    await applyAlarmMode(enabled);
    updateSettings({ alarmMode: enabled });
    if (enabled) dialog.show({ title: t('alarmmode.on_title'), message: t('alarmmode.on_body') });
  }

  async function handleExport() {
    setWorking(true);
    try {
      await exportBackup();
    } catch {
      dialog.show({ title: t('settings.export_error_title'), message: t('settings.export_error_body') });
    } finally {
      setWorking(false);
    }
  }

  function handleImport() {
    dialog.show({
      title: t('settings.import'),
      message: t('settings.import_confirm_body'),
      actions: [
      { label: t('common.cancel'), style: 'cancel' },
      {
        label: t('settings.import'),
        style: 'destructive',
        onPress: async () => {
          setWorking(true);
          try {
            const result = await importBackup();
            if (result === 'imported') {
              await reloadSettings();
              dialog.show({ title: t('common.ok'), message: t('settings.import_ok_body') });
            } else if (result === 'invalid') {
              dialog.show({ title: t('settings.import_invalid_title'), message: t('settings.import_invalid_body') });
            }
          } catch {
            dialog.show({ title: t('settings.import_error_title'), message: t('settings.import_error_body') });
          } finally {
            setWorking(false);
          }
        },
      },
      ],
    });
  }

  function Row({ icon, iconBackground, title, subtitle, onPress, disabled, last }: SettingsRowProps) {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={[styles.row, !last && styles.rowDivider, disabled && { opacity: 0.55 }]}
      >
        <View style={[styles.rowIcon, { backgroundColor: iconBackground }]}>{icon}</View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        </View>
        <ChevronRight size={18} color={theme.color.chevron} />
      </Pressable>
    );
  }

  return (
    <ScreenBackground>
      <TopBar title={t('settings.title')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {t('settings.appearance')}
          </Text>
          <View style={styles.card}>
            <Row
              icon={<Palette size={18} color={theme.color.primary} />}
              iconBackground={theme.color.primarySoft}
              title={t('settings.theme')}
              subtitle={t(`theme.${settings.theme}`)}
              onPress={() => navigation.navigate('Appearance')}
              last
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {t('settings.your_data')}
          </Text>
          <View style={styles.card}>
            <View style={[styles.note, styles.rowDivider]}>
              <Info size={20} color={theme.color.textMuted} />
              <Text style={styles.noteText}>{t('settings.local_only')}</Text>
            </View>
            <Row
              icon={<Download size={18} color={theme.color.primary} />}
              iconBackground={theme.color.primarySoft}
              title={t('settings.export')}
              subtitle={t('settings.export_sub')}
              onPress={handleExport}
              disabled={working}
            />
            <Row
              icon={<Upload size={18} color={theme.color.text} />}
              iconBackground={theme.color.surfaceMuted}
              title={t('settings.import')}
              subtitle={t('settings.import_sub')}
              onPress={handleImport}
              disabled={working}
              last
            />
          </View>
        </View>

        {Platform.OS === 'android' && (
          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {t('settings.reliable_alarms')}
            </Text>
            <View style={[styles.card, styles.batteryCard, styles.alarmCard]}>
              <View style={styles.batteryTop}>
                <View style={[styles.rowIcon, { backgroundColor: theme.color.primarySoft }]}>
                  <BellRing size={18} color={theme.color.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{t('alarmmode.title')}</Text>
                  <Text style={styles.batteryText}>{t('alarmmode.body')}</Text>
                </View>
                <Toggle value={settings.alarmMode} label={t('alarmmode.title')} onValueChange={handleAlarmMode} />
              </View>
            </View>
            <View style={[styles.card, styles.batteryCard]}>
              <View style={styles.batteryTop}>
                <View style={[styles.rowIcon, { backgroundColor: theme.color.warningSoft }]}>
                  <BatteryWarning size={18} color={theme.color.onWarningSoft} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{t('settings.battery_on')}</Text>
                  <Text style={styles.batteryText}>{t('settings.battery_text')}</Text>
                </View>
              </View>
              <Pressable accessibilityRole="button" onPress={() => Linking.openSettings()} style={styles.batteryButton}>
                <Text style={styles.batteryButtonText}>{t('settings.open_app_settings')}</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {t('settings.info')}
          </Text>
          <View style={styles.card}>
            <Row
              icon={<Info size={18} color={theme.color.text} />}
              iconBackground={theme.color.surfaceMuted}
              title={t('settings.about')}
              onPress={() => navigation.navigate('About')}
              last
            />
          </View>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

function createStyles(theme: Theme) {
  const c = theme.color;
  const swiss = theme.ui.ruled;
  return StyleSheet.create({
    content: { paddingHorizontal: SCREEN_PADDING_X, paddingTop: 12, paddingBottom: 40, gap: 26 },
    section: { gap: 10 },
    sectionTitle: {
      marginHorizontal: swiss ? 0 : 4,
      fontFamily: theme.font.body(theme.id === 'cristal' ? 500 : 600),
      fontSize: 13,
      letterSpacing: swiss ? 0.6 : theme.id === 'cristal' ? 1 : 0.6,
      textTransform: 'uppercase',
      color: swiss ? c.text : c.textMuted,
      paddingBottom: swiss ? 6 : 0,
      borderBottomWidth: swiss ? 1 : 0,
      borderBottomColor: c.borderStrong,
    },
    card: {
      borderRadius: swiss ? 0 : theme.id === 'indigo' ? 18 : theme.radius.cardLarge,
      backgroundColor: swiss ? 'transparent' : c.surface,
      overflow: 'hidden',
      borderWidth: swiss ? 0 : theme.ui.cardBorder,
      borderColor: c.border,
    },
    note: { flexDirection: 'row', gap: 12, padding: swiss ? 0 : 16, paddingVertical: swiss ? 12 : 16 },
    noteText: { flex: 1, fontFamily: theme.font.body(400), fontSize: 14, lineHeight: 21, color: c.textSecondary },
    row: {
      minHeight: 60,
      paddingHorizontal: swiss ? 0 : 16,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: c.divider },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: swiss ? 0 : theme.id === 'cristal' ? 12 : theme.id === 'bloqueo' ? 12 : 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: swiss ? 1 : 0,
      borderColor: c.borderStrong,
    },
    rowText: { flex: 1, gap: 2 },
    rowTitle: { fontFamily: theme.font.body(600), fontSize: swiss ? 16 : 15, color: c.text },
    rowSubtitle: { fontFamily: theme.font.body(400), fontSize: 13, color: c.textMuted },
    alarmCard: { marginBottom: 12 },
    batteryCard: { padding: swiss ? 0 : 16, paddingVertical: 16, gap: 14 },
    batteryTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    batteryText: { fontFamily: theme.font.body(400), fontSize: 14, lineHeight: 21, color: c.textSecondary },
    batteryButton: {
      minHeight: 48,
      borderRadius: theme.id === 'bloqueo' ? 999 : theme.id === 'cristal' ? 16 : theme.radius.control,
      backgroundColor: theme.id === 'indigo' ? c.inverse : c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    batteryButtonText: {
      fontFamily: theme.font.body(600),
      fontSize: 15,
      color: theme.id === 'indigo' ? c.textOnInverse : c.onPrimary,
      textAlign: 'center',
    },
  });
}
