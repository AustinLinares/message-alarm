import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { AlarmClock, Check, ExternalLink } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useI18n } from '../../shared/i18n';
import { scheduleSnooze } from '../../shared/notifications/scheduler';
import { openWhatsAppChat } from '../../shared/whatsapp';
import { MESSAGE_MAX_LENGTH, type Theme } from '../../shared/theme/themes';
import { useTheme, useThemedStyles } from '../../shared/theme/ThemeProvider';
import { Clock } from '../../shared/ui/Clock';
import { useDialog } from '../../shared/ui/Dialog';
import { ScreenBackground } from '../../shared/ui/ScreenBackground';
import type { Contact, MessageOccurrence, RecipientStatus, ScheduledMessage } from '../../shared/types';
import { getContact } from '../contacts/repository';
import { getOccurrence, setRecipientStatus } from './occurrenceRepository';
import { getScheduledMessage } from './repository';

const MESSAGE_PREVIEW_LIMIT = MESSAGE_MAX_LENGTH;

interface OccurrenceScreenProps {
  route: { params: { occurrenceId: string } };
}

interface RecipientRow {
  contact: Contact;
  status: RecipientStatus;
}

export function OccurrenceScreen({ route }: OccurrenceScreenProps) {
  const { occurrenceId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, formatTime } = useI18n();
  const insets = useSafeAreaInsets();
  const dialog = useDialog();
  const [message, setMessage] = useState<ScheduledMessage | null>(null);
  const [occurrence, setOccurrence] = useState<MessageOccurrence | null>(null);
  const [recipients, setRecipients] = useState<RecipientRow[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      const fetchedOccurrence = await getOccurrence(occurrenceId);
      if (!fetchedOccurrence) return;
      const fetchedMessage = await getScheduledMessage(fetchedOccurrence.scheduledMessageId);
      const rows = await Promise.all(
        fetchedOccurrence.recipients.map(async (recipient) => {
          const contact = await getContact(recipient.contactId);
          return contact ? { contact, status: recipient.status } : null;
        })
      );
      setOccurrence(fetchedOccurrence);
      setMessage(fetchedMessage);
      setRecipients(rows.filter((row): row is RecipientRow => row !== null));
    })();
  }, [occurrenceId]);

  // Opening the chat is the user's own act of sending, so it marks the
  // recipient as done; the app still can't verify the message actually went out.
  async function handleOpenChat(contact: Contact) {
    if (!message || !occurrence) return;
    const result = await openWhatsAppChat(message.whatsappApp, contact.phoneNumber, message.text);
    if (result === 'fallback') {
      dialog.show({
        title: t('occurrence.app_missing_title'),
        message: t('occurrence.app_missing_body', { app: message.whatsappApp === 'business' ? 'WhatsApp Business' : 'WhatsApp' }),
      });
    }
    await setRecipientStatus(occurrence.id, contact.id, 'confirmed');
    setRecipients((prev) =>
      prev.map((row) => (row.contact.id === contact.id ? { ...row, status: 'confirmed' } : row))
    );
  }

  async function handleCopy() {
    if (!message) return;
    await Clipboard.setStringAsync(message.text);
    dialog.show({ title: t('occurrence.copied_title'), message: t('occurrence.copied_body') });
  }

  async function handleShare() {
    if (!message) return;
    await Share.share({ message: message.text });
  }

  async function handleSnooze() {
    if (!message || !occurrence) return;
    await scheduleSnooze(message, occurrence.id);
    navigation.popToTop();
  }

  if (!message || !occurrence) {
    return (
      <ScreenBackground inverse style={styles.center}>
        <Text style={styles.muted}>{t('common.loading')}</Text>
      </ScreenBackground>
    );
  }

  const isLong = message.text.length > MESSAGE_PREVIEW_LIMIT;
  const displayText = expanded || !isLong ? message.text : `${message.text.slice(0, MESSAGE_PREVIEW_LIMIT)}…`;
  const done = recipients.filter((row) => row.status === 'confirmed').length;

  const upper = (text: string) => (theme.ui.uppercase ? text.toUpperCase() : text);

  return (
    <ScreenBackground inverse>
      <StatusBar style={theme.mode === 'dark' || theme.id === 'indigo' ? 'light' : 'dark'} />
      {theme.ui.ruled && <View style={styles.swissCircle} />}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {theme.ui.ruled ? null : theme.id === 'bloqueo' ? (
            <View style={styles.pill}>
              <AlarmClock size={16} color={theme.color.text} />
              <Text style={styles.pillText}>{t('alarm.time_to_send')}</Text>
            </View>
          ) : (
            <>
              <View style={styles.bell}>
                <AlarmClock size={34} color={theme.id === 'indigo' ? theme.color.highlight : theme.color.accent} />
              </View>
              <Text style={styles.heroLabel}>{upper(t('alarm.time_to_send'))}</Text>
            </>
          )}
          {theme.ui.ruled && <Text style={styles.swissHeader}>{upper(t('alarm.time_to_send'))}</Text>}
          <Clock
            time={formatTime(new Date(occurrence.firedAt))}
            size={theme.clock.sizeAlarm}
            color={theme.color.textOnInverse}
            letterSpacing={theme.id === 'indigo' ? -2 : undefined}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('alarm.ready_message')}</Text>
          <Text style={styles.messageText}>{displayText}</Text>
          <View style={styles.messageActions}>
            {isLong && (
              <Pressable accessibilityRole="button" onPress={() => setExpanded((prev) => !prev)} style={styles.link}>
                <Text style={styles.linkText}>{expanded ? t('occurrence.see_less') : t('occurrence.see_more')}</Text>
              </Pressable>
            )}
            <Pressable accessibilityRole="button" onPress={handleCopy} style={styles.link}>
              <Text style={styles.linkText}>{t('occurrence.copy')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={handleShare} style={styles.link}>
              <Text style={styles.linkText}>{t('occurrence.share')}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.recipients}>
          <Text style={styles.cardLabel}>
            {theme.ui.ruled
              ? `${upper(t('alarm.send_to_progress', { done, total: recipients.length }).split('·')[0].trim())} · ${done} / ${recipients.length}`
              : t('alarm.send_to_progress', { done, total: recipients.length })}
          </Text>
          {recipients.map(({ contact, status }) => (
            <View key={contact.id} style={styles.recipientRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(contact.name.trim().charAt(0) || '#').toUpperCase()}</Text>
              </View>
              <View style={styles.recipientInfo}>
                <Text style={styles.recipientName} numberOfLines={1}>
                  {contact.name}
                </Text>
                <Text style={styles.recipientPhone} numberOfLines={1}>
                  {contact.phoneNumber}
                </Text>
              </View>
              {status === 'confirmed' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('alarm.opened')}: ${contact.name}`}
                  onPress={() => handleOpenChat(contact)}
                  style={styles.opened}
                >
                  <Check size={16} color={theme.color.success} strokeWidth={2.6} />
                  <Text style={styles.openedText}>{upper(t('alarm.opened'))}</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('alarm.open_chat')}: ${contact.name}`}
                  onPress={() => handleOpenChat(contact)}
                  style={styles.openChat}
                >
                  <ExternalLink size={16} color={theme.color.onHighlight} strokeWidth={2.4} />
                  <Text style={styles.openChatText}>{t('alarm.open_chat')}</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable accessibilityRole="button" onPress={handleSnooze} style={[styles.footerButton, styles.snooze]}>
          <Text style={styles.footerText}>{t('alarm.snooze')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.popToTop()}
          style={[styles.footerButton, styles.done]}
        >
          <Text style={[styles.footerText, styles.doneText]}>{t('alarm.done')}</Text>
        </Pressable>
      </View>
    </ScreenBackground>
  );
}

function createStyles(theme: Theme) {
  const c = theme.color;
  const swiss = theme.ui.ruled;
  const lock = theme.id === 'bloqueo';
  const cardBox = { borderWidth: theme.ui.cardBorder, borderColor: c.inverseBorder };
  return StyleSheet.create({
    center: { alignItems: 'center', justifyContent: 'center' },
    muted: { fontFamily: theme.font.body(400), color: c.textOnInverseMuted },
    content: { paddingHorizontal: swiss ? 20 : 24, paddingBottom: 24, gap: swiss ? 16 : 28, alignItems: lock ? 'stretch' : undefined },
    swissCircle: { position: 'absolute', right: -70, top: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: c.accent },
    swissHeader: {
      fontFamily: theme.font.heading(800),
      fontSize: 15,
      letterSpacing: 0.4,
      color: c.textOnInverse,
      paddingBottom: 12,
      marginRight: 120,
      borderBottomWidth: 1,
      borderBottomColor: c.inverseBorder,
      alignSelf: 'stretch',
    },
    hero: { alignItems: swiss ? 'flex-start' : 'center', gap: swiss ? 0 : 12 },
    bell: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: c.inverseChip,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
      borderWidth: 10,
      borderColor: theme.id === 'cristal' ? 'rgba(94,230,240,0.08)' : 'rgba(245,184,61,0.12)',
    },
    pill: {
      height: 32,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: c.inverseRaised,
      ...cardBox,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pillText: { fontFamily: theme.font.body(600), fontSize: 13, color: c.textOnInverse },
    heroLabel: {
      fontFamily: theme.font.body(theme.id === 'indigo' ? 600 : 400),
      fontSize: theme.id === 'indigo' ? 14 : 15,
      letterSpacing: theme.id === 'indigo' ? 0.6 : 0,
      textTransform: theme.id === 'indigo' ? 'uppercase' : 'none',
      color: c.textOnInverseMuted,
      textAlign: 'center',
    },
    card: {
      padding: swiss ? 0 : 18,
      paddingVertical: swiss ? 8 : 18,
      borderRadius: swiss ? 0 : theme.id === 'indigo' ? 18 : 24,
      backgroundColor: swiss ? 'transparent' : c.inverseRaised,
      gap: 10,
      ...(swiss ? { borderBottomWidth: 1, borderBottomColor: c.inverseBorder } : cardBox),
    },
    cardLabel: {
      fontFamily: theme.font.body(swiss ? 600 : 400),
      fontSize: 13,
      letterSpacing: swiss ? 0.6 : 0,
      color: swiss ? c.textOnInverse : c.textOnInverseMuted,
    },
    messageText: { fontFamily: theme.font.body(400), fontSize: 16, lineHeight: 24, color: c.textOnInverse },
    messageActions: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 4 },
    link: { minHeight: 44, justifyContent: 'center', paddingRight: 14 },
    linkText: {
      fontFamily: theme.font.body(600),
      fontSize: 14,
      color: swiss ? c.textOnInverse : theme.id === 'cristal' ? c.primary : theme.id === 'bloqueo' ? c.textOnInverse : c.highlight,
      textDecorationLine: swiss || lock ? 'underline' : 'none',
    },
    recipients: { gap: swiss ? 0 : 8 },
    recipientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: swiss ? 8 : 8,
      minHeight: swiss ? 60 : undefined,
      paddingLeft: swiss ? 0 : 12,
      paddingRight: swiss ? 0 : 8,
      borderRadius: swiss ? 0 : lock ? 22 : theme.id === 'cristal' ? 18 : 14,
      backgroundColor: swiss ? 'transparent' : c.inverseRaised,
      ...(swiss ? { borderBottomWidth: 1, borderBottomColor: c.border } : cardBox),
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.inverseChip,
      alignItems: 'center',
      justifyContent: 'center',
      display: swiss ? 'none' : 'flex',
    },
    avatarText: { fontFamily: theme.font.body(700), fontSize: 14, color: c.textOnInverse },
    recipientInfo: { flex: 1, minWidth: 0 },
    recipientName: { fontFamily: theme.font.body(600), fontSize: swiss ? 16 : 15, color: c.textOnInverse },
    recipientPhone: { fontFamily: theme.font.body(400), fontSize: 13, color: c.textOnInverseMuted },
    openChat: {
      minHeight: 44,
      paddingHorizontal: 14,
      borderRadius: lock ? 999 : swiss ? 0 : theme.id === 'cristal' ? 14 : theme.radius.control,
      backgroundColor: c.highlight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    openChatText: { fontFamily: theme.font.body(700), fontSize: 14, color: c.onHighlight },
    opened: { minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
    openedText: { fontFamily: theme.font.body(600), fontSize: swiss ? 13 : 14, color: c.success },
    footer: {
      flexDirection: 'row',
      gap: swiss ? 0 : 10,
      marginHorizontal: swiss ? 20 : 0,
      paddingHorizontal: swiss ? 0 : 24,
      paddingTop: swiss ? 0 : 12,
      ...(swiss ? { borderWidth: 1, borderColor: c.inverseBorder } : {}),
    },
    footerButton: {
      flex: 1,
      minHeight: swiss ? 56 : lock ? 54 : 52,
      borderRadius: swiss ? 0 : lock ? 999 : theme.id === 'cristal' ? 16 : 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    snooze: swiss
      ? {}
      : { borderWidth: 1, borderColor: c.inverseBorder, backgroundColor: theme.id === 'indigo' ? 'transparent' : c.inverseRaised },
    done: swiss
      ? { borderLeftWidth: 1, borderLeftColor: c.inverseBorder }
      : { backgroundColor: lock ? c.primary : c.inverseChip },
    footerText: { fontFamily: theme.font.body(600), fontSize: 15, color: c.textOnInverse, textAlign: 'center' },
    doneText: { color: lock ? c.onPrimary : c.textOnInverse },
  });
}
