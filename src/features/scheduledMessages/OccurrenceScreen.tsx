import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { AlarmClock, Check, ExternalLink } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useI18n } from '../../shared/i18n';
import { scheduleSnooze } from '../../shared/notifications/scheduler';
import { MESSAGE_MAX_LENGTH, type Theme } from '../../shared/theme/themes';
import { useTheme, useThemedStyles } from '../../shared/theme/ThemeProvider';
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

function buildWhatsAppUrl(phoneNumber: string, text: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function OccurrenceScreen({ route }: OccurrenceScreenProps) {
  const { occurrenceId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, formatTime } = useI18n();
  const insets = useSafeAreaInsets();
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
    await Linking.openURL(buildWhatsAppUrl(contact.phoneNumber, message.text));
    await setRecipientStatus(occurrence.id, contact.id, 'confirmed');
    setRecipients((prev) =>
      prev.map((row) => (row.contact.id === contact.id ? { ...row, status: 'confirmed' } : row))
    );
  }

  async function handleCopy() {
    if (!message) return;
    await Clipboard.setStringAsync(message.text);
    Alert.alert(t('occurrence.copied_title'), t('occurrence.copied_body'));
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
      <View style={[styles.container, styles.center]}>
        <Text style={styles.muted}>{t('common.loading')}</Text>
      </View>
    );
  }

  const isLong = message.text.length > MESSAGE_PREVIEW_LIMIT;
  const displayText = expanded || !isLong ? message.text : `${message.text.slice(0, MESSAGE_PREVIEW_LIMIT)}…`;
  const done = recipients.filter((row) => row.status === 'confirmed').length;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.bell}>
            <AlarmClock size={34} color={theme.color.highlight} />
          </View>
          <Text style={styles.heroLabel}>{t('alarm.time_to_send')}</Text>
          <Text style={styles.clock}>{formatTime(new Date(occurrence.firedAt))}</Text>
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
          <Text style={styles.cardLabel}>{t('alarm.send_to_progress', { done, total: recipients.length })}</Text>
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
                  <Text style={styles.openedText}>{t('alarm.opened')}</Text>
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
          <Text style={styles.footerText}>{t('alarm.done')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  const c = theme.color;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.inverse },
    center: { alignItems: 'center', justifyContent: 'center' },
    muted: { fontFamily: theme.font.body(400), color: c.textOnInverseMuted },
    content: { paddingHorizontal: 24, paddingBottom: 24, gap: 28 },
    hero: { alignItems: 'center', gap: 12 },
    bell: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.inverseChip,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
      borderWidth: 10,
      borderColor: 'rgba(245,184,61,0.12)',
    },
    heroLabel: {
      fontFamily: theme.font.body(600),
      fontSize: 14,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: c.textOnInverseMuted,
      textAlign: 'center',
    },
    clock: {
      fontFamily: theme.font.display(theme.clock.weight),
      fontSize: theme.clock.sizeAlarm,
      letterSpacing: -2,
      lineHeight: theme.clock.sizeAlarm + 4,
      color: c.textOnInverse,
    },
    card: { padding: 18, borderRadius: 18, backgroundColor: c.inverseRaised, gap: 10 },
    cardLabel: { fontFamily: theme.font.body(400), fontSize: 13, color: c.textOnInverseMuted },
    messageText: { fontFamily: theme.font.body(400), fontSize: 16, lineHeight: 24, color: c.textOnInverse },
    messageActions: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 4 },
    link: { minHeight: 44, justifyContent: 'center', paddingRight: 14 },
    linkText: { fontFamily: theme.font.body(600), fontSize: 14, color: c.highlight },
    recipients: { gap: 8 },
    recipientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
      paddingLeft: 12,
      paddingRight: 8,
      borderRadius: 14,
      backgroundColor: c.inverseRaised,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.inverseChip,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontFamily: theme.font.body(700), fontSize: 14, color: '#E4E5F1' },
    recipientInfo: { flex: 1, minWidth: 0 },
    recipientName: { fontFamily: theme.font.body(600), fontSize: 15, color: c.textOnInverse },
    recipientPhone: { fontFamily: theme.font.body(400), fontSize: 13, color: c.textOnInverseMuted },
    openChat: {
      minHeight: 44,
      paddingHorizontal: 14,
      borderRadius: theme.radius.control,
      backgroundColor: c.highlight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    openChatText: { fontFamily: theme.font.body(700), fontSize: 14, color: c.onHighlight },
    opened: { minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
    openedText: { fontFamily: theme.font.body(600), fontSize: 14, color: c.success },
    footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 24, paddingTop: 12 },
    footerButton: { flex: 1, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
    snooze: { borderWidth: 1, borderColor: c.inverseBorder },
    done: { backgroundColor: c.inverseChip },
    footerText: { fontFamily: theme.font.body(600), fontSize: 15, color: c.textOnInverse, textAlign: 'center' },
  });
}
