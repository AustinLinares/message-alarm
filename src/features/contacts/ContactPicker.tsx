import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react-native';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../../shared/i18n';
import { type Theme } from '../../shared/theme/themes';
import { useTheme, useThemedStyles } from '../../shared/theme/ThemeProvider';
import { PrimaryButton, SecondaryButton } from '../../shared/ui/Buttons';
import { useDialog } from '../../shared/ui/Dialog';
import { ScreenBackground } from '../../shared/ui/ScreenBackground';
// SDK 57 moved the old contacts API to `expo-contacts/legacy`; the same calls on the
// root entry now throw at runtime.
import * as Contacts from 'expo-contacts/legacy';

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
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const dialog = useDialog();
  const [status, setStatus] = useState<'loading' | 'denied' | 'error' | 'ready'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [selected, setSelected] = useState<Map<string, PickedContact>>(new Map());

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    (async () => {
      try {
        const { status: permissionStatus } = await Contacts.requestPermissionsAsync();
        if (cancelled) return;
        if (permissionStatus !== 'granted') {
          setStatus('denied');
          return;
        }
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
          sort: Contacts.SortTypes.FirstName,
        });
        if (cancelled) return;
        const withPhones: DeviceContact[] = data
          .filter((contact) => contact.name && contact.phoneNumbers && contact.phoneNumbers.length > 0)
          .map((contact) => ({
            id: contact.id ?? contact.name!,
            name: contact.name!,
            // The same number often appears more than once on a contact.
            phoneNumbers: Array.from(
              new Set(
                (contact.phoneNumbers ?? [])
                  .map((phone) => phone.number)
                  .filter((number): number is string => !!number)
              )
            ),
          }));
        setContacts(withPhones);
        setStatus('ready');
      } catch {
        // Without this the screen would sit on "loading" forever when reading fails.
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

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
    dialog.show({
      title: contact.name,
      message: t('contacts.multiple_body'),
      actions: [
        ...contact.phoneNumbers.map((number) => ({
          label: number,
          onPress: () => selectNumber(contact, number),
        })),
        { label: t('common.cancel'), style: 'cancel' as const },
      ],
    });
  }

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>{t('contacts.loading')}</Text>
      </View>
    );
  }

  if (status === 'denied' || status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>{status === 'denied' ? t('contacts.permission') : t('contacts.error')}</Text>
        {status === 'error' && (
          <PrimaryButton label={t('contacts.retry')} onPress={() => setAttempt((n) => n + 1)} style={{ alignSelf: 'stretch' }} />
        )}
        <SecondaryButton label={t('a11y.back')} onPress={onCancel} />
      </View>
    );
  }

  return (
    <ScreenBackground style={{ paddingTop: insets.top }}>
      <SectionList
        ListEmptyComponent={<Text style={[styles.message, { marginTop: 40 }]}>{t('contacts.empty')}</Text>}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              style={styles.row}
              onPress={() => toggleContact(item)}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                {isSelected && <Check size={14} color={theme.color.onPrimary} strokeWidth={3} />}
              </View>
              <Text style={styles.rowText}>{item.name}</Text>
            </Pressable>
          );
        }}
      />
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <SecondaryButton label={t('common.cancel')} onPress={onCancel} style={{ flex: 1, minHeight: 56 }} />
        <PrimaryButton
          label={t('contacts.add_selected', { n: selected.size })}
          disabled={selected.size === 0}
          onPress={() => onConfirm(Array.from(selected.values()))}
          style={{ flex: 2 }}
        />
      </View>
    </ScreenBackground>
  );
}

function createStyles(theme: Theme) {
  const c = theme.color;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, backgroundColor: c.background },
    message: { textAlign: 'center', fontFamily: theme.font.body(400), fontSize: 15, color: c.textSecondary },
    sectionHeader: {
      backgroundColor: c.surfaceMuted,
      paddingHorizontal: 20,
      paddingVertical: 6,
      fontFamily: theme.font.body(600),
      color: c.textMuted,
    },
    row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 14 },
    rowText: { fontFamily: theme.font.body(500), fontSize: 16, color: c.text, flexShrink: 1 },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: c.chevron,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: { backgroundColor: c.primary, borderColor: c.primary },
    footer: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: c.divider,
      backgroundColor: c.background,
    },
  });
}
