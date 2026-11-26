import { useEffect, useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react-native';
import { Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../../shared/i18n';
import { type Theme } from '../../shared/theme/themes';
import { useTheme, useThemedStyles } from '../../shared/theme/ThemeProvider';
import { PrimaryButton, SecondaryButton } from '../../shared/ui/Buttons';
import { useDialog } from '../../shared/ui/Dialog';
import { KeyboardAvoider, useKeyboardVisible } from '../../shared/ui/KeyboardAvoider';
import { ScreenBackground } from '../../shared/ui/ScreenBackground';
import { digitsOf, isMobileLabel, mergePhoneNumbers, type PhoneEntry } from './phoneNumbers';
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
  phones: PhoneEntry[];
}

// "José" must match "jose".
function fold(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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
  const keyboardVisible = useKeyboardVisible();
  const dialog = useDialog();
  const [status, setStatus] = useState<'loading' | 'denied' | 'error' | 'ready'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
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
            // One entry per real number: formats of the same number are merged.
            phones: mergePhoneNumbers(
              (contact.phoneNumbers ?? [])
                .filter((phone): phone is typeof phone & { number: string } => !!phone.number)
                .map((phone) => ({ number: phone.number, label: phone.label }))
            ),
          }));
        setContacts(withPhones.filter((contact) => contact.phones.length > 0));
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
    const text = fold(query.trim());
    const digits = digitsOf(query);
    const visible = text
      ? contacts.filter(
          (contact) =>
            fold(contact.name).includes(text) ||
            (digits.length >= 2 && contact.phones.some((phone) => digitsOf(phone.number).includes(digits)))
        )
      : contacts;
    const groups = new Map<string, DeviceContact[]>();
    for (const contact of visible) {
      const letter = contact.name.charAt(0).toUpperCase() || '#';
      groups.set(letter, [...(groups.get(letter) ?? []), contact]);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, data]) => ({ title, data }));
  }, [contacts, query]);

  function labelOf(label?: string): string {
    if (!label) return '';
    if (isMobileLabel(label)) return t('contacts.label_mobile');
    if (/home|casa/i.test(label)) return t('contacts.label_home');
    if (/work|trabajo|oficina/i.test(label)) return t('contacts.label_work');
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

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
    if (contact.phones.length === 1) {
      selectNumber(contact, contact.phones[0].number);
      return;
    }
    dialog.show({
      title: contact.name,
      message: t('contacts.multiple_body'),
      actions: [
        ...contact.phones.map((phone) => ({
          label: phone.label ? `${labelOf(phone.label)} · ${phone.number}` : phone.number,
          onPress: () => selectNumber(contact, phone.number),
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
      <KeyboardAvoider>
      <View style={styles.searchBox}>
        <Search size={18} color={theme.color.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={t('contacts.search_placeholder')}
          placeholderTextColor={theme.color.textMuted}
          accessibilityLabel={t('contacts.search_placeholder')}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('contacts.search_clear')}
            onPress={() => setQuery('')}
            hitSlop={8}
            style={styles.searchClear}
          >
            <X size={16} color={theme.color.textMuted} strokeWidth={2.4} />
          </Pressable>
        )}
      </View>
      <SectionList
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={[styles.message, { marginTop: 40 }]}>
            {query ? t('contacts.no_results') : t('contacts.empty')}
          </Text>
        }
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
      <View style={[styles.footer, { paddingBottom: keyboardVisible ? 16 : insets.bottom + 16 }]}>
        <SecondaryButton label={t('common.cancel')} onPress={onCancel} style={{ flex: 1, minHeight: 56 }} />
        <PrimaryButton
          label={t('contacts.add_selected', { n: selected.size })}
          disabled={selected.size === 0}
          onPress={() => onConfirm(Array.from(selected.values()))}
          style={{ flex: 2 }}
        />
      </View>
      </KeyboardAvoider>
    </ScreenBackground>
  );
}

function createStyles(theme: Theme) {
  const c = theme.color;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, backgroundColor: c.background },
    message: { textAlign: 'center', fontFamily: theme.font.body(400), fontSize: 15, color: c.textSecondary },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 48,
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 10,
      paddingHorizontal: 14,
      borderRadius: theme.id === 'bloqueo' ? 999 : theme.radius.input,
      borderWidth: 1,
      borderColor: theme.ui.ruled ? c.borderStrong : c.border,
      backgroundColor: c.surface,
    },
    searchInput: { flex: 1, fontFamily: theme.font.body(400), fontSize: 15, color: c.text, paddingVertical: 10 },
    searchClear: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceMuted },
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
