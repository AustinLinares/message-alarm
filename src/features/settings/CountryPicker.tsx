import { Check, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COUNTRY_AUTO, COUNTRY_NONE, countryName, resolveCountry, sortedCountries } from '../../shared/countries';
import { useI18n } from '../../shared/i18n';
import type { Theme } from '../../shared/theme/themes';
import { useTheme, useThemedStyles } from '../../shared/theme/ThemeProvider';
import { ScreenBackground } from '../../shared/ui/ScreenBackground';
import { TopBar } from '../../shared/ui/TopBar';

interface CountryPickerProps {
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

interface Item {
  value: string;
  title: string;
  detail?: string;
}

// Accent- and case-insensitive, so "peru" finds "Perú".
const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function CountryPicker({ selected, onSelect, onClose }: CountryPickerProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const items = useMemo<Item[]>(() => {
    const auto = resolveCountry(COUNTRY_AUTO);
    const special: Item[] = [
      {
        value: COUNTRY_AUTO,
        title: t('country.auto'),
        detail: auto ? `${countryName(auto, locale)} (+${auto.code})` : undefined,
      },
      { value: COUNTRY_NONE, title: t('country.none') },
    ];
    const countries = sortedCountries(locale).map((country) => ({
      value: country.iso,
      title: countryName(country, locale),
      detail: `+${country.code}`,
    }));
    const q = fold(query.trim());
    if (!q) return [...special, ...countries];
    return countries.filter((item) => fold(item.title).includes(q) || item.detail!.includes(q));
  }, [query, locale, t]);

  return (
    <ScreenBackground>
      <TopBar title={t('country.title')} onBack={onClose} />
      <View style={styles.searchBox}>
        <Search size={18} color={theme.color.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={t('country.search_placeholder')}
          placeholderTextColor={theme.color.textMuted}
          accessibilityLabel={t('country.search_placeholder')}
          autoCorrect={false}
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
      <FlatList
        data={items}
        keyExtractor={(item) => item.value}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        ListEmptyComponent={<Text style={styles.empty}>{t('contacts.no_results')}</Text>}
        renderItem={({ item }) => {
          const isSelected = item.value === selected;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              onPress={() => onSelect(item.value)}
              style={styles.row}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                {item.detail ? <Text style={styles.rowDetail}>{item.detail}</Text> : null}
              </View>
              {isSelected && <Check size={20} color={theme.color.primary} strokeWidth={2.6} />}
            </Pressable>
          );
        }}
      />
    </ScreenBackground>
  );
}

function createStyles(theme: Theme) {
  const c = theme.color;
  return StyleSheet.create({
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 48,
      marginHorizontal: 20,
      marginTop: 8,
      marginBottom: 10,
      paddingHorizontal: 14,
      borderRadius: theme.id === 'bloqueo' ? 999 : theme.radius.input,
      borderWidth: 1,
      borderColor: theme.ui.ruled ? c.borderStrong : c.border,
      backgroundColor: c.surface,
    },
    searchInput: { flex: 1, fontFamily: theme.font.body(400), fontSize: 15, color: c.text, paddingVertical: 10 },
    searchClear: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceMuted },
    row: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    rowText: { flex: 1, gap: 2 },
    rowTitle: { fontFamily: theme.font.body(500), fontSize: 16, color: c.text },
    rowDetail: { fontFamily: theme.font.body(400), fontSize: 13, color: c.textMuted },
    empty: { textAlign: 'center', marginTop: 40, fontFamily: theme.font.body(400), fontSize: 15, color: c.textSecondary },
  });
}
