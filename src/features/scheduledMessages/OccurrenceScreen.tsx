import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getContact } from '../contacts/repository';
import type { Contact, MessageOccurrence, RecipientStatus, ScheduledMessage } from '../../shared/types';
import { getOccurrence, setRecipientStatus } from './occurrenceRepository';
import { getScheduledMessage } from './repository';

const MESSAGE_PREVIEW_LIMIT = 180;

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

  async function handleConfirm(contactId: string) {
    if (!occurrence) return;
    await setRecipientStatus(occurrence.id, contactId, 'confirmed');
    setRecipients((prev) =>
      prev.map((row) => (row.contact.id === contactId ? { ...row, status: 'confirmed' } : row))
    );
  }

  async function handleSend(contact: Contact) {
    if (!message) return;
    await Linking.openURL(buildWhatsAppUrl(contact.phoneNumber, message.text));
  }

  async function handleCopy() {
    if (!message) return;
    await Clipboard.setStringAsync(message.text);
    Alert.alert('Copiado', 'El mensaje se copió al portapapeles.');
  }

  async function handleShare() {
    if (!message) return;
    await Share.share({ message: message.text });
  }

  if (!message || !occurrence) {
    return (
      <View style={styles.center}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  const isLong = message.text.length > MESSAGE_PREVIEW_LIMIT;
  const displayText = expanded || !isLong ? message.text : `${message.text.slice(0, MESSAGE_PREVIEW_LIMIT)}…`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.messageCard}>
        <Text style={styles.messageText}>{displayText}</Text>
        <View style={styles.messageActions}>
          {isLong && (
            <TouchableOpacity onPress={() => setExpanded((prev) => !prev)}>
              <Text style={styles.linkText}>{expanded ? 'Ver menos' : 'Ver más'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleCopy}>
            <Text style={styles.linkText}>Copiar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.label}>Destinatarios</Text>
      {recipients.map(({ contact, status }) => (
        <View key={contact.id} style={styles.recipientRow}>
          <View style={styles.recipientInfo}>
            <Text style={styles.recipientName}>{contact.name}</Text>
            <Text style={styles.recipientPhone}>{contact.phoneNumber}</Text>
          </View>
          <TouchableOpacity style={styles.sendButton} onPress={() => handleSend(contact)}>
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkButton, status === 'confirmed' && styles.checkButtonActive]}
            onPress={() => handleConfirm(contact.id)}
          >
            <Text style={[styles.checkButtonText, status === 'confirmed' && styles.checkButtonTextActive]}>✓</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>Compartir por otra app</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageCard: { backgroundColor: '#f2f2f2', borderRadius: 12, padding: 16 },
  messageText: { fontSize: 16, lineHeight: 22 },
  messageActions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  linkText: { color: '#128C7E', fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 20 },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recipientInfo: { flex: 1 },
  recipientName: { fontSize: 15, fontWeight: '500' },
  recipientPhone: { fontSize: 13, color: '#777' },
  sendButton: { backgroundColor: '#25D366', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  sendButtonText: { color: '#fff', fontWeight: '600' },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonActive: { backgroundColor: '#25D366', borderColor: '#25D366' },
  checkButtonText: { color: '#999', fontWeight: '700' },
  checkButtonTextActive: { color: '#fff' },
  shareButton: { backgroundColor: '#eee', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24 },
  shareButtonText: { color: '#333', fontWeight: '600' },
});
