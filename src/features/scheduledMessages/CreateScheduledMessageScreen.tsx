import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ContactPicker, type PickedContact } from '../contacts/ContactPicker';
import { createContact } from '../contacts/repository';
import { TemplatePicker } from '../templates/TemplatePicker';
import type { Contact, MessageTemplate, RecurrenceType } from '../../shared/types';
import { createScheduledMessage } from './service';

const MESSAGE_LIMIT = 180;
const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

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

export function CreateScheduledMessageScreen() {
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

  function resetForm() {
    setText('');
    setTemplateId(undefined);
    setRecipients([]);
    setStartAt(new Date());
    setRecurrenceType('none');
    setDaysOfWeek([]);
  }

  async function handleSave() {
    if (!text.trim()) {
      Alert.alert('Falta el mensaje', 'Escribe el texto que quieres programar.');
      return;
    }
    if (recipients.length === 0) {
      Alert.alert('Faltan destinatarios', 'Agrega al menos un contacto o número.');
      return;
    }
    if (recurrenceType === 'weekly' && daysOfWeek.length === 0) {
      Alert.alert('Falta la repetición', 'Elige al menos un día de la semana.');
      return;
    }

    setSaving(true);
    try {
      await createScheduledMessage({
        text: text.trim(),
        templateId,
        recipientIds: recipients.map((recipient) => recipient.id),
        startAt: startAt.toISOString(),
        recurrence: {
          type: recurrenceType,
          daysOfWeek: recurrenceType === 'weekly' ? daysOfWeek : undefined,
        },
        isActive: true,
      });
      Alert.alert('Listo', 'Mensaje programado creado.');
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Mensaje</Text>
        <TouchableOpacity onPress={() => setShowTemplatePicker(true)}>
          <Text style={styles.secondaryLinkText}>Elegir plantilla</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.textArea}
        multiline
        maxLength={MESSAGE_LIMIT}
        placeholder="Escribe el mensaje que quieres enviar..."
        value={text}
        onChangeText={(value) => {
          setText(value);
          setTemplateId(undefined);
        }}
      />
      <Text style={styles.counter}>
        {text.length}/{MESSAGE_LIMIT}
      </Text>

      <Text style={styles.label}>Destinatarios</Text>
      {recipients.map((recipient) => (
        <View key={recipient.id} style={styles.recipientRow}>
          <Text style={styles.recipientText}>
            {recipient.name} · {recipient.phoneNumber}
          </Text>
          <TouchableOpacity onPress={() => removeRecipient(recipient.id)}>
            <Text style={styles.removeText}>Quitar</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.manualRow}>
        <TextInput
          style={[styles.input, styles.manualNameInput]}
          placeholder="Nombre (opcional)"
          value={manualName}
          onChangeText={setManualName}
        />
        <TextInput
          style={[styles.input, styles.manualPhoneInput]}
          placeholder="Número"
          keyboardType="phone-pad"
          value={manualPhone}
          onChangeText={setManualPhone}
        />
        <TouchableOpacity style={styles.addButton} onPress={addManualRecipient}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowContactPicker(true)}>
        <Text style={styles.secondaryButtonText}>Elegir de contactos</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Fecha y hora</Text>
      <View style={styles.dateTimeRow}>
        <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateTimeButtonText}>{startAt.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)}>
          <Text style={styles.dateTimeButtonText}>
            {startAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
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

      <Text style={styles.label}>Repetición</Text>
      <View style={styles.segmented}>
        {(['none', 'daily', 'weekly'] as RecurrenceType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.segment, recurrenceType === type && styles.segmentActive]}
            onPress={() => setRecurrenceType(type)}
          >
            <Text style={[styles.segmentText, recurrenceType === type && styles.segmentTextActive]}>
              {type === 'none' ? 'Una vez' : type === 'daily' ? 'Diaria' : 'Semanal'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {recurrenceType === 'weekly' && (
        <View style={styles.daysRow}>
          {DAY_LABELS.map((label, day) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayButton, daysOfWeek.includes(day) && styles.dayButtonActive]}
              onPress={() => toggleDayOfWeek(day)}
            >
              <Text style={[styles.dayButtonText, daysOfWeek.includes(day) && styles.dayButtonTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.primaryButton, saving && styles.buttonDisabled]}
        disabled={saving}
        onPress={handleSave}
      >
        <Text style={styles.primaryButtonText}>{saving ? 'Guardando...' : 'Guardar mensaje programado'}</Text>
      </TouchableOpacity>

      <Modal visible={showContactPicker} animationType="slide" onRequestClose={() => setShowContactPicker(false)}>
        <ContactPicker onConfirm={handleContactsPicked} onCancel={() => setShowContactPicker(false)} />
      </Modal>
      <Modal visible={showTemplatePicker} animationType="slide" onRequestClose={() => setShowTemplatePicker(false)}>
        <TemplatePicker onSelect={handleTemplateSelected} onClose={() => setShowTemplatePicker(false)} />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 24, gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  secondaryLinkText: { color: '#128C7E', fontWeight: '600', fontSize: 13 },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  counter: { alignSelf: 'flex-end', color: '#999', fontSize: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 },
  recipientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recipientText: { fontSize: 15 },
  removeText: { color: '#d33', fontSize: 13 },
  manualRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  manualNameInput: { flex: 1 },
  manualPhoneInput: { flex: 1 },
  addButton: {
    backgroundColor: '#25D366',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  dateTimeRow: { flexDirection: 'row', gap: 8 },
  dateTimeButton: { flex: 1, backgroundColor: '#f2f2f2', borderRadius: 8, padding: 12, alignItems: 'center' },
  dateTimeButtonText: { fontSize: 15, fontWeight: '500' },
  segmented: { flexDirection: 'row', backgroundColor: '#f2f2f2', borderRadius: 8, padding: 4 },
  segment: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  segmentActive: { backgroundColor: '#fff' },
  segmentText: { color: '#666', fontWeight: '500' },
  segmentTextActive: { color: '#111' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: { backgroundColor: '#25D366' },
  dayButtonText: { color: '#666', fontWeight: '600' },
  dayButtonTextActive: { color: '#fff' },
  primaryButton: { backgroundColor: '#25D366', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: { backgroundColor: '#eee', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  secondaryButtonText: { color: '#333', fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
});
