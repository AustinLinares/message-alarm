import { useEffect, useMemo, useState } from 'react';
import { Alert, SectionList, StyleSheet, Text, TouchableOpacity, View, type AlertButton } from 'react-native';
import * as Contacts from 'expo-contacts';

export interface PickedContact {
  name: string;
  phoneNumber: string;
}

interface DeviceContact {
  id: string;
  name: string;
  phoneNumbers: string[];
}

interface ContactPickerProps {
  onConfirm: (contacts: PickedContact[]) => void;
  onCancel: () => void;
}

export function ContactPicker({ onConfirm, onCancel }: ContactPickerProps) {
  const [status, setStatus] = useState<'loading' | 'denied' | 'ready'>('loading');
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [selected, setSelected] = useState<Map<string, PickedContact>>(new Map());

  useEffect(() => {
    (async () => {
      const { status: permissionStatus } = await Contacts.requestPermissionsAsync();
      if (permissionStatus !== 'granted') {
        setStatus('denied');
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
        sort: Contacts.SortTypes.FirstName,
      });
      const withPhones: DeviceContact[] = data
        .filter((contact) => contact.name && contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map((contact) => ({
          id: contact.id ?? contact.name!,
          name: contact.name!,
          phoneNumbers: (contact.phoneNumbers ?? [])
            .map((phone) => phone.number)
            .filter((number): number is string => !!number),
        }));
      setContacts(withPhones);
      setStatus('ready');
    })();
  }, []);

  const sections = useMemo(() => {
    const groups = new Map<string, DeviceContact[]>();
    for (const contact of contacts) {
      const letter = contact.name.charAt(0).toUpperCase() || '#';
      groups.set(letter, [...(groups.get(letter) ?? []), contact]);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, data]) => ({ title, data }));
  }, [contacts]);

  function selectNumber(contact: DeviceContact, phoneNumber: string) {
    setSelected((prev) => new Map(prev).set(contact.id, { name: contact.name, phoneNumber }));
  }

  function toggleContact(contact: DeviceContact) {
    if (selected.has(contact.id)) {
      setSelected((prev) => {
        const next = new Map(prev);
        next.delete(contact.id);
        return next;
      });
      return;
    }
    if (contact.phoneNumbers.length === 1) {
      selectNumber(contact, contact.phoneNumbers[0]);
      return;
    }
    const buttons: AlertButton[] = [
      ...contact.phoneNumbers.map((number) => ({
        text: number,
        onPress: () => selectNumber(contact, number),
      })),
      { text: 'Cancelar', style: 'cancel' as const },
    ];
    Alert.alert(contact.name, 'Este contacto tiene varios números. Elige cuál usar:', buttons);
  }

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <Text>Cargando contactos…</Text>
      </View>
    );
  }

  if (status === 'denied') {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          Necesitamos permiso para acceder a tus contactos y poder elegir destinatarios.
        </Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
          <Text style={styles.secondaryButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          return (
            <TouchableOpacity style={styles.row} onPress={() => toggleContact(item)}>
              <View style={[styles.checkbox, isSelected && styles.checkboxChecked]} />
              <Text style={styles.rowText}>{item.name}</Text>
            </TouchableOpacity>
          );
        }}
      />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
          <Text style={styles.secondaryButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, selected.size === 0 && styles.buttonDisabled]}
          disabled={selected.size === 0}
          onPress={() => onConfirm(Array.from(selected.values()))}
        >
          <Text style={styles.primaryButtonText}>Agregar seleccionados ({selected.size})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  message: { textAlign: 'center', fontSize: 15, color: '#333' },
  sectionHeader: {
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 16,
    paddingVertical: 4,
    fontWeight: '600',
    color: '#666',
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  rowText: { fontSize: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#999' },
  checkboxChecked: { backgroundColor: '#25D366', borderColor: '#25D366' },
  footer: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  primaryButton: { flex: 1, backgroundColor: '#25D366', borderRadius: 8, padding: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  secondaryButton: { flex: 1, backgroundColor: '#eee', borderRadius: 8, padding: 14, alignItems: 'center' },
  secondaryButtonText: { color: '#333', fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
});
