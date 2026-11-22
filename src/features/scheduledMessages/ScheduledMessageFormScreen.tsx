import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { AlarmClock, Calendar, LayoutGrid, Plus, UserPlus, X } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContactPicker, type PickedContact } from '../contacts/ContactPicker';
import { createContact, getContact } from '../contacts/repository';
import { TemplatePicker } from '../templates/TemplatePicker';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useI18n } from '../../shared/i18n';
import { computeNextOccurrence } from '../../shared/notifications/computeNextOccurrence';
import { MESSAGE_MAX_LENGTH, SCREEN_PADDING_X, type Theme } from '../../shared/theme/themes';
import { useTheme, useThemedStyles } from '../../shared/theme/ThemeProvider';
import { PrimaryButton } from '../../shared/ui/Buttons';
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
    return recipients.some((recipient) => recipient.phoneNumber === phoneNumber);
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
      Alert.alert(t('compose.missing_message_title'), t('compose.missing_message_body'));
      return;
    }
    if (recipients.length === 0) {
      Alert.alert(t('compose.missing_recipients_title'), t('compose.missing_recipients_body'));
      return;
    }
    if (recurrenceType === 'weekly' && daysOfWeek.length === 0) {
      Alert.alert(t('compose.missing_days_title'), t('compose.missing_days_body'));
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

  return (
    <View style={styles.container}>
      <TopBar title={title} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.ringsCard}>
          <Text style={styles.sectionCaps}>{t('compose.rings_at')}</Text>
          <View style={styles.timeRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('compose.change_time', { time: i18n.formatTime(startAt) })}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.bigTime}>{i18n.formatTime(startAt)}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('compose.change_date')}
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
            >
              <Calendar size={18} color={theme.color.text} />
              <Text style={styles.dateButtonText}>{i18n.formatDay(startAt)}</Text>
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
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{t(key)}</Text>
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
            onChange={(_event, selected) => {
              setShowTimePicker(false);
              if (selected) setStartAt((prev) => mergeTime(prev, selected));
            }}
          />
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('compose.message')}</Text>
            <Pressable accessibilityRole="button" onPress={() => setShowTemplatePicker(true)} style={styles.templatesButton}>
              <LayoutGrid size={16} color={theme.color.primary} />
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
          <Text style={styles.counter}>{t('compose.counter', { n: text.length })}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('compose.recipients')}</Text>
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
          <View style={styles.manualRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              accessibilityLabel={t('compose.name_optional')}
              placeholder={t('compose.name_optional')}
              placeholderTextColor={theme.color.textMuted}
              value={manualName}
              onChangeText={setManualName}
            />
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
              <Plus size={20} color={theme.color.textOnInverse} strokeWidth={2.4} />
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
        <ContactPicker onConfirm={handleContactsPicked} onCancel={() => setShowContactPicker(false)} />
      </Modal>
      <Modal visible={showTemplatePicker} animationType="slide" onRequestClose={() => setShowTemplatePicker(false)}>
        <TemplatePicker onSelect={handleTemplateSelected} onClose={() => setShowTemplatePicker(false)} />
      </Modal>
    </View>
  );
}

function createStyles(theme: Theme) {
  const c = theme.color;
  const field = {
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    color: c.text,
    fontFamily: theme.font.body(400),
    fontSize: 15,
  } as const;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background },
    muted: { fontFamily: theme.font.body(400), color: c.textMuted },
    content: { paddingHorizontal: SCREEN_PADDING_X, paddingTop: 8, paddingBottom: 140, gap: 22 },
    ringsCard: { padding: 18, borderRadius: theme.radius.cardLarge, backgroundColor: c.surface, gap: 14 },
    sectionCaps: {
      fontFamily: theme.font.body(600),
      fontSize: 13,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: c.textMuted,
    },
    timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    bigTime: {
      fontFamily: theme.font.display(theme.clock.weight),
      fontSize: 52,
      letterSpacing: theme.clock.letterSpacing,
      color: c.text,
      lineHeight: 58,
    },
    dateButton: {
      minHeight: 44,
      paddingHorizontal: 14,
      borderRadius: theme.radius.control,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 1,
    },
    dateButtonText: { fontFamily: theme.font.body(600), fontSize: 14, color: c.text, flexShrink: 1 },
    segmented: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, backgroundColor: c.surfaceMuted },
    segment: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    segmentSelected: {
      backgroundColor: c.surface,
      shadowColor: '#14162B',
      shadowOpacity: 0.12,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    segmentText: { fontFamily: theme.font.body(500), fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    segmentTextSelected: { fontFamily: theme.font.body(700), color: c.text },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dayButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayButtonSelected: { backgroundColor: c.primary },
    dayButtonText: { fontFamily: theme.font.body(600), fontSize: 14, color: c.textSecondary },
    dayButtonTextSelected: { color: c.onPrimary },
    section: { gap: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    sectionTitle: { fontFamily: theme.font.body(600), fontSize: 15, color: c.text },
    templatesButton: {
      minHeight: 36,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: c.primarySoft,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    templatesText: { fontFamily: theme.font.body(600), fontSize: 14, color: c.primary },
    textArea: {
      ...field,
      borderRadius: theme.radius.card,
      paddingHorizontal: 16,
      paddingVertical: 14,
      minHeight: 96,
      lineHeight: 22,
      textAlignVertical: 'top',
    },
    counter: { alignSelf: 'flex-end', fontFamily: theme.font.body(400), fontSize: 12, color: c.textMuted },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
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
    chipText: { fontFamily: theme.font.body(400), fontSize: 14, color: c.text, flexShrink: 1 },
    chipRemove: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    manualRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    input: { ...field, height: 48, paddingHorizontal: 14, borderRadius: theme.radius.input },
    addButton: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.input,
      backgroundColor: c.inverse,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickContacts: {
      minHeight: 44,
      borderRadius: theme.radius.control,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.borderDashed,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
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
      borderTopWidth: 1,
      borderTopColor: c.divider,
    },
  });
}
