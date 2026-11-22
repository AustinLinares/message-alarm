import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BatteryWarning, ChevronRight, Download, Info, Upload } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useI18n } from '../../shared/i18n';
import { SCREEN_PADDING_X, type Theme } from '../../shared/theme/themes';
import { useAppSettings, useTheme, useThemedStyles } from '../../shared/theme/ThemeProvider';
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
  const { reloadSettings } = useAppSettings();
  const [working, setWorking] = useState(false);

  async function handleExport() {
    setWorking(true);
    try {
      await exportBackup();
    } catch {
      Alert.alert(t('settings.export_error_title'), t('settings.export_error_body'));
    } finally {
      setWorking(false);
    }
  }

  function handleImport() {
    Alert.alert(t('settings.import'), t('settings.import_confirm_body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.import'),
        style: 'destructive',
        onPress: async () => {
          setWorking(true);
          try {
            const result = await importBackup();
            if (result === 'imported') {
              await reloadSettings();
              Alert.alert(t('common.ok'), t('settings.import_ok_body'));
            } else if (result === 'invalid') {
              Alert.alert(t('settings.import_invalid_title'), t('settings.import_invalid_body'));
            }
          } catch {
            Alert.alert(t('settings.import_error_title'), t('settings.import_error_body'));
          } finally {
            setWorking(false);
          }
        },
      },
    ]);
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
    <View style={styles.container}>
      <TopBar title={t('settings.title')} />
      <ScrollView contentContainerStyle={styles.content}>
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
    </View>
  );
}

function createStyles(theme: Theme) {
  const c = theme.color;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { paddingHorizontal: SCREEN_PADDING_X, paddingTop: 12, paddingBottom: 40, gap: 26 },
    section: { gap: 10 },
    sectionTitle: {
      marginHorizontal: 4,
      fontFamily: theme.font.body(600),
      fontSize: 13,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: c.textMuted,
    },
    card: { borderRadius: 18, backgroundColor: c.surface, overflow: 'hidden' },
    note: { flexDirection: 'row', gap: 12, padding: 16 },
    noteText: { flex: 1, fontFamily: theme.font.body(400), fontSize: 14, lineHeight: 21, color: c.textSecondary },
    row: { minHeight: 60, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 14 },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: c.divider },
    rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowText: { flex: 1, gap: 2 },
    rowTitle: { fontFamily: theme.font.body(600), fontSize: 15, color: c.text },
    rowSubtitle: { fontFamily: theme.font.body(400), fontSize: 13, color: c.textMuted },
    batteryCard: { padding: 16, gap: 14 },
    batteryTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    batteryText: { fontFamily: theme.font.body(400), fontSize: 14, lineHeight: 21, color: c.textSecondary },
    batteryButton: {
      minHeight: 48,
      borderRadius: theme.radius.control,
      backgroundColor: c.inverse,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    batteryButtonText: { fontFamily: theme.font.body(600), fontSize: 15, color: c.textOnInverse, textAlign: 'center' },
  });
}
