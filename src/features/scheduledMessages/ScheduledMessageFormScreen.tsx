import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { AlarmClock, Calendar, LayoutGrid, Plus, UserPlus, X } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContactPicker, type PickedContact } from '../contacts/ContactPicker';
import { isSameNumber } from '../contacts/phoneNumbers';
import { createContact, getContact } from '../contacts/repository';
import { TemplatePicker } from '../templates/TemplatePicker';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useI18n } from '../../shared/i18n';
import { computeNextOccurrence } from '../../shared/notifications/computeNextOccurrence';
import { MESSAGE_MAX_LENGTH, SCREEN_PADDING_X, type Theme } from '../../shared/theme/themes';
import { useTheme, useThemedStyles } from '../../shared/theme/ThemeProvider';
import { PrimaryButton } from '../../shared/ui/Buttons';
import { DialogProvider, useDialog } from '../../shared/ui/Dialog';
import { Clock } from '../../shared/ui/Clock';
import { ScreenBackground } from '../../shared/ui/ScreenBackground';
import { TopBar } from '../../shared/ui/TopBar';
import type { Contact, MessageTemplate, RecurrenceType } from '../../shared/types';
import { getScheduledMessage } from './repository';
import { createScheduledMessage, updateScheduledMessage } from './service';

const MESSAGE_LIMIT = MESSAGE_MAX_LENGTH;
const REPEAT_OPTIONS: { type: RecurrenceType; key: string }[] = [
  { type: 'none', key: 'repeat.once' },
  { type: 'daily', key: 'repeat.daily' },
  { type: 'weekly', key: 'repeat.weekly' },
];

function mergeDate(base: Date, datePart: Date): Date {
  const next = new Date(base);
  next.setFullYear(datePart.getFullYear(), datePart.getMonth(), datePart.getDate());
  return next;
}

function mergeTime(base: Date, timePart: Date): Date {
  const next = new Date(base);
  next.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  return next;
}

export function ScheduledMessageFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ScheduledMessageForm'>>();
  const scheduledMessageId = route.params?.scheduledMessageId;
  const duplicateFromId = route.params?.duplicateFromId;
  const sourceId = scheduledMessageId ?? duplicateFromId;
  const isEditing = !!scheduledMessageId;
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const dialog = useDialog();
  const i18n = useI18n();
  const { t } = i18n;

  const [loading, setLoading] = useState(!!sourceId);
  const [text, setText] = useState('');
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [recipients, setRecipients] = useState<Contact[]>([]);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [startAt, setStartAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sourceId) return;
    (async () => {
      const message = await getScheduledMessage(sourceId);
      if (!message) {
        setLoading(false);
        return;
      }
      const loadedRecipients = await Promise.all(message.recipientIds.map((id) => getContact(id)));
      setText(message.text);
      setTemplateId(message.templateId);
      setRecipients(loadedRecipients.filter((contact): contact is Contact => contact !== null));
      // A duplicate starts at the original's next ring (or now, if it already passed).
      setStartAt(
        isEditing
          ? new Date(message.startAt)
          : (computeNextOccurrence(message.recurrence, new Date(message.startAt), new Date()) ?? new Date())
      );
      setRecurrenceType(message.recurrence.type);
      setDaysOfWeek(message.recurrence.daysOfWeek ?? []);
      setLoading(false);
    })();
  }, [sourceId, isEditing]);

  function hasPhoneNumber(phoneNumber: string): boolean {
    return recipients.some((recipient) => isSameNumber(recipient.phoneNumber, phoneNumber));
  }

  async function addManualRecipient() {
    const phoneNumber = manualPhone.trim();
    if (!phoneNumber) return;
    if (hasPhoneNumber(phoneNumber)) {
      setManualName('');
      setManualPhone('');
      return;
    }
    const contact = await createContact({ name: manualName.trim() || phoneNumber, phoneNumber });
    setRecipients((prev) => [...prev, contact]);
    setManualName('');
    setManualPhone('');
  }

  async function handleContactsPicked(picked: PickedContact[]) {
    setShowContactPicker(false);
    const newOnes = picked.filter((contact) => !hasPhoneNumber(contact.phoneNumber));
    const created = await Promise.all(newOnes.map((contact) => createContact(contact)));
    setRecipients((prev) => [...prev, ...created]);
  }

  function removeRecipient(id: string) {
    setRecipients((prev) => prev.filter((recipient) => recipient.id !== id));
  }

  function handleTemplateSelected(template: MessageTemplate) {
    setShowTemplatePicker(false);
    setText(template.text.slice(0, MESSAGE_LIMIT));
    setTemplateId(template.id);
  }

  function toggleDayOfWeek(day: number) {
    setDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  async function handleSave() {
    if (!text.trim()) {
      dialog.show({ title: t('compose.missing_message_title'), message: t('compose.missing_message_body') });
      return;
    }
    if (recipients.length === 0) {
      dialog.show({ title: t('compose.missing_recipients_title'), message: t('compose.missing_recipients_body') });
      return;
    }
    if (recurrenceType === 'weekly' && daysOfWeek.length === 0) {
      dialog.show({ title: t('compose.missing_days_title'), message: t('compose.missing_days_body') });
      return;
    }

    const recurrence = { type: recurrenceType, daysOfWeek: recurrenceType === 'weekly' ? daysOfWeek : undefined };
    const recipientIds = recipients.map((recipient) => recipient.id);

    setSaving(true);
    try {
      if (isEditing && scheduledMessageId) {
        await updateScheduledMessage({
          id: scheduledMessageId,
          text: text.trim(),
          templateId,
          recipientIds,
          startAt: startAt.toISOString(),
          recurrence,
          isActive: true,
        });
      } else {
        await createScheduledMessage({
          text: text.trim(),
          templateId,
          recipientIds,
          startAt: startAt.toISOString(),
          recurrence,
          isActive: true,
        });
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{t('common.loading')}</Text>
      </View>
    );
  }

  const title = isEditing ? t('compose.edit_title') : t('compose.title');
  const saveLabel = saving ? t('compose.saving') : isEditing ? t('compose.save_changes') : t('compose.schedule');

  const upper = (text: string) => (theme.ui.uppercase ? text.toUpperCase() : text);
  const clockSize = { indigo: 52, suizo: 84, cristal: 72, bloqueo: 96 }[theme.id];

  return (
    <ScreenBackground>
      <TopBar title={title} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.ringsCard}>
          <View style={styles.capsRow}>
            {theme.ui.ruled && <View style={styles.dot} />}
            <Text style={styles.sectionCaps}>{upper(t('compose.rings_at'))}</Text>
          </View>
          <View style={styles.timeRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('compose.change_time', { time: i18n.formatTime(startAt) })}
              onPress={() => setShowTimePicker(true)}
            >
              <Clock time={i18n.formatTime(startAt)} size={clockSize} color={theme.color.text} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('compose.change_date')}
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
            >
              <Calendar size={18} color={theme.color.text} />
              <Text style={styles.dateButtonText}>{upper(i18n.formatDay(startAt))}</Text>
            </Pressable>
          </View>
          <View accessibilityRole="radiogroup" style={styles.segmented}>
            {REPEAT_OPTIONS.map(({ type, key }) => {
              const selected = recurrenceType === type;
              return (
                <Pressable
                  key={type}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => setRecurrenceType(type)}
                  style={[styles.segment, selected && styles.segmentSelected]}
                >
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{upper(t(key))}</Text>
                </Pressable>
              );
            })}
          </View>
          {recurrenceType === 'weekly' && (
            <View accessibilityLabel={t('compose.repeat_days')} style={styles.daysRow}>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const selected = daysOfWeek.includes(day);
                return (
                  <Pressable
                    key={day}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    onPress={() => toggleDayOfWeek(day)}
                    style={[styles.dayButton, selected && styles.dayButtonSelected]}
                  >
                    <Text style={[styles.dayButtonText, selected && styles.dayButtonTextSelected]}>
                      {i18n.weekdayShort(day)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={startAt}
            mode="date"
            themeVariant={theme.mode}
            positiveButton={{ label: t('common.ok'), textColor: theme.color.primary }}
            negativeButton={{ label: t('common.cancel'), textColor: theme.color.textMuted }}
            onChange={(_event, selected) => {
              setShowDatePicker(false);
              if (selected) setStartAt((prev) => mergeDate(prev, selected));
            }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={startAt}
            mode="time"
            themeVariant={theme.mode}
            positiveButton={{ label: t('common.ok'), textColor: theme.color.primary }}
            negativeButton={{ label: t('common.cancel'), textColor: theme.color.textMuted }}
            onChange={(_event, selected) => {
              setShowTimePicker(false);
              if (selected) setStartAt((prev) => mergeTime(prev, selected));
            }}
          />
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{upper(t('compose.message'))}</Text>
            <Pressable accessibilityRole="button" onPress={() => setShowTemplatePicker(true)} style={styles.templatesButton}>
              <LayoutGrid size={16} color={theme.ui.ruled ? theme.color.text : theme.color.primary} />
              <Text style={styles.templatesText}>{t('compose.templates')}</Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.textArea}
            multiline
            maxLength={MESSAGE_LIMIT}
            placeholder={t('compose.placeholder')}
            placeholderTextColor={theme.color.textMuted}
            value={text}
            onChangeText={(value) => {
              setText(value);
              setTemplateId(undefined);
            }}
          />
          <Text style={styles.counter}>{t('compose.counter', { n: theme.ui.ruled ? String(text.length).padStart(3, '0') : text.length })}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{upper(t('compose.recipients'))}</Text>
          {recipients.length > 0 && (
            <View style={styles.chips}>
              {recipients.map((recipient) => (
                <View key={recipient.id} style={styles.chip}>
                  <Text style={styles.chipText} numberOfLines={1}>
                    {recipient.name === recipient.phoneNumber
                      ? recipient.phoneNumber
                      : `${recipient.name} · ${recipient.phoneNumber}`}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('compose.remove_recipient', { name: recipient.name })}
                    onPress={() => removeRecipient(recipient.id)}
                    hitSlop={8}
                    style={styles.chipRemove}
                  >
                    <X size={14} color={theme.color.textMuted} strokeWidth={2.4} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          <TextInput
            style={[styles.input, styles.nameInput]}
            accessibilityLabel={t('compose.name_optional')}
            placeholder={t('compose.name_optional')}
            placeholderTextColor={theme.color.textMuted}
            value={manualName}
            onChangeText={setManualName}
          />
          <View style={styles.manualRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              accessibilityLabel={t('compose.number')}
              placeholder={t('compose.number')}
              placeholderTextColor={theme.color.textMuted}
              keyboardType="phone-pad"
              value={manualPhone}
              onChangeText={setManualPhone}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('compose.add_recipient')}
              onPress={addManualRecipient}
              style={styles.addButton}
            >
              <Plus size={20} color={theme.id === 'indigo' ? theme.color.textOnInverse : theme.color.onPrimary} strokeWidth={2.4} />
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={() => setShowContactPicker(true)} style={styles.pickContacts}>
            <UserPlus size={18} color={theme.color.text} />
            <Text style={styles.pickContactsText}>{t('compose.pick_contacts')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label={saveLabel}
          onPress={handleSave}
          disabled={saving}
          icon={<AlarmClock size={20} color={theme.color.onPrimary} strokeWidth={2.2} />}
        />
      </View>

      <Modal visible={showContactPicker} animationType="slide" onRequestClose={() => setShowContactPicker(false)}>
        <DialogProvider>
          <ContactPicker onConfirm={handleContactsPicked} onCancel={() => setShowContactPicker(false)} />
        </DialogProvider>
      </Modal>
      <Modal visible={showTemplatePicker} animationType="slide" onRequestClose={() => setShowTemplatePicker(false)}>
        <DialogProvider>
          <TemplatePicker onSelect={handleTemplateSelected} onClose={() => setShowTemplatePicker(false)} />
        </DialogProvider>
      </Modal>
    </ScreenBackground>
  );
}

function createStyles(theme: Theme) {
  const c = theme.color;
  const swiss = theme.ui.ruled;
  const caps = theme.ui.uppercase;
  const boxed = { borderWidth: theme.ui.cardBorder, borderColor: c.border };
  const field = swiss
    ? ({
        borderWidth: 0,
        borderBottomWidth: 1,
        borderBottomColor: c.borderStrong,
        backgroundColor: 'transparent',
      } as const)
    : ({ borderWidth: 1, borderColor: c.border, backgroundColor: c.surface } as const);
  const fieldText = { color: c.text, fontFamily: theme.font.body(400), fontSize: 15 } as const;
  const segRadius = theme.id === 'indigo' ? 14 : theme.ui.buttonRadius;
  const segInner = theme.id === 'indigo' ? 10 : theme.ui.buttonRadius;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background },
    muted: { fontFamily: theme.font.body(400), color: c.textMuted },
    content: { paddingHorizontal: SCREEN_PADDING_X, paddingTop: 8, paddingBottom: 140, gap: swiss ? 16 : 22 },
    ringsCard: swiss
      ? { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.borderStrong, gap: 12 }
      : { padding: 18, borderRadius: theme.radius.cardLarge, backgroundColor: c.surface, gap: 14, ...boxed },
    capsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent },
    sectionCaps: {
      fontFamily: theme.font.body(600),
      fontSize: 13,
      letterSpacing: 0.6,
      textTransform: caps ? 'uppercase' : theme.id === 'indigo' ? 'uppercase' : 'none',
      color: swiss ? c.text : c.textMuted,
    },
    timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
    dateButton: {
      minHeight: 44,
      paddingHorizontal: 14,
      borderRadius: theme.id === 'bloqueo' ? 999 : theme.radius.control,
      borderWidth: 1,
      borderColor: c.borderStrong,
      backgroundColor: c.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 1,
    },
    dateButtonText: { fontFamily: theme.font.body(600), fontSize: 14, color: c.text, flexShrink: 1 },
    segmented: {
      flexDirection: 'row',
      gap: swiss ? 0 : 4,
      padding: swiss ? 0 : 4,
      borderRadius: segRadius,
      backgroundColor: c.surfaceMuted,
      borderWidth: theme.id === 'indigo' ? 0 : 1,
      borderColor: c.borderStrong,
    },
    segment: {
      flex: 1,
      minHeight: swiss ? 44 : 40,
      borderRadius: segInner,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    segmentSelected: {
      backgroundColor: c.segmentSelected,
      ...(theme.id === 'indigo'
        ? { shadowColor: '#14162B', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 }
        : {}),
    },
    segmentText: { fontFamily: theme.font.body(500), fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    segmentTextSelected: { fontFamily: theme.font.body(700), color: c.onSegmentSelected },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dayButton: {
      width: 40,
      height: 40,
      borderRadius: swiss ? 0 : 20,
      backgroundColor: c.surfaceMuted,
      borderWidth: swiss ? 1 : 0,
      borderColor: c.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayButtonSelected: { backgroundColor: c.primary },
    dayButtonText: { fontFamily: theme.font.body(600), fontSize: 14, color: c.textSecondary },
    dayButtonTextSelected: { color: c.onPrimary },
    section: { gap: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    sectionTitle: {
      fontFamily: theme.font.body(600),
      fontSize: caps ? 13 : 15,
      letterSpacing: caps ? 0.6 : 0,
      color: theme.id === 'bloqueo' ? c.textSecondary : c.text,
    },
    templatesButton: {
      minHeight: 36,
      paddingHorizontal: 12,
      borderRadius: theme.id === 'indigo' ? 10 : theme.id === 'suizo' ? 0 : 999,
      backgroundColor: c.primarySoft,
      borderWidth: theme.id === 'indigo' ? 0 : 1,
      borderColor: c.borderStrong,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    templatesText: { fontFamily: theme.font.body(600), fontSize: 14, color: swiss ? c.text : c.primary },
    textArea: {
      ...field,
      ...fieldText,
      borderRadius: swiss ? 0 : theme.id === 'bloqueo' ? 24 : theme.id === 'cristal' ? 18 : theme.radius.card,
      paddingHorizontal: swiss ? 0 : 16,
      paddingVertical: swiss ? 12 : 14,
      minHeight: 96,
      lineHeight: 22,
      textAlignVertical: 'top',
    },
    counter: { alignSelf: 'flex-end', fontFamily: theme.font.body(swiss ? 600 : 400), fontSize: 12, color: c.textMuted },
    chips: { flexDirection: swiss ? 'column' : 'row', flexWrap: 'wrap', gap: swiss ? 0 : 8 },
    chip: swiss
      ? {
          minHeight: 48,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        }
      : {
          minHeight: 36,
          maxWidth: '100%',
          paddingLeft: 12,
          paddingRight: 4,
          borderRadius: theme.radius.chip,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.surface,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
    chipText: { fontFamily: theme.font.body(400), fontSize: swiss ? 15 : 14, color: c.text, flexShrink: 1 },
    chipRemove: {
      width: swiss ? 44 : 28,
      height: swiss ? 44 : 28,
      borderRadius: 14,
      backgroundColor: swiss ? 'transparent' : c.surfaceMuted,
      alignItems: swiss ? 'flex-end' : 'center',
      justifyContent: 'center',
    },
    manualRow: { flexDirection: 'row', gap: swiss ? 0 : 8, alignItems: 'center', ...(swiss ? { borderWidth: 1, borderColor: c.borderStrong } : {}) },
    nameInput: swiss ? { borderWidth: 1, borderColor: c.borderStrong } : {},
    input: {
      ...(swiss ? { backgroundColor: 'transparent', borderWidth: 0 } : field),
      ...fieldText,
      height: 48,
      paddingHorizontal: swiss ? 12 : 14,
      borderRadius: theme.id === 'bloqueo' ? 999 : theme.radius.input,
    },
    addButton: {
      width: 48,
      height: 48,
      borderRadius: theme.id === 'bloqueo' ? 999 : theme.radius.input,
      backgroundColor: theme.id === 'indigo' ? c.inverse : c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickContacts: {
      minHeight: 44,
      borderRadius: theme.id === 'bloqueo' ? 999 : theme.radius.control,
      borderWidth: swiss ? 0 : 1,
      borderBottomWidth: 1,
      borderStyle: swiss ? 'solid' : 'dashed',
      borderColor: swiss ? c.border : c.borderDashed,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: swiss ? 'space-between' : 'center',
      paddingHorizontal: swiss ? 0 : 0,
      gap: 8,
    },
    pickContactsText: { fontFamily: theme.font.body(600), fontSize: 14, color: c.text },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: SCREEN_PADDING_X,
      paddingTop: 16,
      backgroundColor: c.background,
      borderTopWidth: swiss ? 0 : 1,
      borderTopColor: c.divider,
    },
  });
}
