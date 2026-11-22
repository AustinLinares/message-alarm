import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Copy, EllipsisVertical, Pause, Pencil, Play, Plus, Send, Settings, Trash2 } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useI18n, type I18n } from '../../shared/i18n';
import { computeNextOccurrence } from '../../shared/notifications/computeNextOccurrence';
import { SCREEN_PADDING_X, type Theme } from '../../shared/theme/themes';
import { useTheme, useThemedStyles } from '../../shared/theme/ThemeProvider';
import type { Contact, RecurrenceType, ScheduledMessage } from '../../shared/types';
import { ActionMenu } from '../../shared/ui/ActionMenu';
import { BrandMark } from '../../shared/ui/BrandMark';
import { PrimaryButton } from '../../shared/ui/Buttons';
import { listContacts } from '../contacts/repository';
import { startOccurrenceNow } from './alarmHandler';
import { listScheduledMessages } from './repository';
import { deleteScheduledMessage, updateScheduledMessage } from './service';

type Filter = 'all' | RecurrenceType;
const FILTERS: Filter[] = ['all', 'none', 'daily', 'weekly'];
const FILTER_KEYS: Record<Filter, string> = {
  all: 'home.filter_all',
  none: 'filter.once',
  daily: 'filter.daily',
  weekly: 'filter.weekly',
};
const REPEAT_KEYS: Record<RecurrenceType, string> = {
  none: 'repeat.once',
  daily: 'repeat.daily',
  weekly: 'repeat.weekly',
};

interface Item {
  message: ScheduledMessage;
  next: Date | null;
  names: string[];
}

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function describeRemaining(next: Date, now: Date, i18n: I18n): string {
  const minutes = Math.max(1, Math.round((next.getTime() - now.getTime()) / 60000));
  const time =
    minutes < 60
      ? i18n.t('home.minutes', { n: minutes })
      : i18n.t('home.hours', { n: Math.floor(minutes / 60) });
  return i18n.t('home.today_in', { time });
}

function describeWhen(item: Item, now: Date, i18n: I18n): string {
  if (item.next && sameDay(item.next, now)) return describeRemaining(item.next, now, i18n);
  if (item.next) return i18n.formatDay(item.next);
  return i18n.t('home.no_next');
}

function rowDayLabel(item: Item, now: Date, i18n: I18n): string {
  if (!item.message.isActive) return i18n.t('home.paused');
  if (item.message.recurrence.type === 'daily') return i18n.t('home.day_every');
  if (!item.next) return i18n.t('home.no_next');
  if (sameDay(item.next, now)) return i18n.t('home.day_today');
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(item.next, tomorrow)) return i18n.t('home.day_tomorrow');
  return i18n.formatDay(item.next);
}

function namesShort(names: string[]): string {
  return names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2}` : '');
}

export function ScheduledMessagesListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const i18n = useI18n();
  const { t } = i18n;
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [menuFor, setMenuFor] = useState<Item | null>(null);
  const now = new Date();

  const load = useCallback(async () => {
    const [messages, contacts] = await Promise.all([listScheduledMessages(), listContacts()]);
    const byId = new Map<string, Contact>(contacts.map((contact) => [contact.id, contact]));
    const current = new Date();
    setItems(
      messages.map((message) => ({
        message,
        next: message.isActive
          ? computeNextOccurrence(message.recurrence, new Date(message.startAt), current)
          : null,
        names: message.recipientIds.map((id) => byId.get(id)?.name).filter((name): name is string => !!name),
      }))
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const nextItem = useMemo(
    () =>
      items
        .filter((item) => item.next)
        .sort((a, b) => a.next!.getTime() - b.next!.getTime())[0] ?? null,
    [items]
  );

  const visible = useMemo(() => {
    const filtered = filter === 'all' ? items : items.filter((item) => item.message.recurrence.type === filter);
    // Upcoming first, then paused / finished ones.
    return [...filtered].sort((a, b) => (a.next?.getTime() ?? Infinity) - (b.next?.getTime() ?? Infinity));
  }, [items, filter]);

  async function handleSendNow(item: Item) {
    const occurrenceId = await startOccurrenceNow(item.message.id);
    if (occurrenceId) navigation.navigate('Occurrence', { occurrenceId });
  }

  async function handleToggleActive(item: Item) {
    await updateScheduledMessage({ ...item.message, isActive: !item.message.isActive });
    void load();
  }

  function handleDelete(item: Item) {
    Alert.alert(t('home.delete_title'), t('home.delete_body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteScheduledMessage(item.message.id);
          void load();
        },
      },
    ]);
  }

  const header = (
    <View>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.brand}>
          <View style={styles.brandTile}>
            <BrandMark size={24} body="#FFFFFF" bells={theme.color.highlight} lines={theme.color.primary} />
          </View>
          <Text style={styles.brandName}>{t('app.name')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('a11y.settings')}
          onPress={() => navigation.navigate('Settings')}
          style={styles.iconButton}
        >
          <Settings size={22} color={theme.color.text} />
        </Pressable>
      </View>

      {nextItem && (
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>{t('home.next')}</Text>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipText}>{t(REPEAT_KEYS[nextItem.message.recurrence.type])}</Text>
            </View>
          </View>
          <View style={styles.heroTime}>
            <Text style={styles.heroClock}>{i18n.formatTime(nextItem.next!)}</Text>
            <Text style={styles.heroWhen} numberOfLines={2}>
              {describeWhen(nextItem, now, i18n)}
            </Text>
          </View>
          <Text style={styles.heroText} numberOfLines={3}>
            {nextItem.message.text}
          </Text>
          <View style={styles.heroBottom}>
            <Text style={styles.heroTo} numberOfLines={2}>
              {nextItem.names.length > 2
                ? t('home.to_people', { names: nextItem.names.slice(0, 2).join(', '), count: nextItem.names.length - 2 })
                : t('home.to_names', { names: nextItem.names.join(', ') })}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => handleSendNow(nextItem)}
              style={styles.sendNow}
            >
              <Send size={18} color={theme.color.onHighlight} strokeWidth={2.2} />
              <Text style={styles.sendNowText}>{t('home.send_now')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.listHeader}>
        <Text accessibilityRole="header" style={styles.listTitle}>
          {t('home.scheduled')}
        </Text>
        <Text style={styles.listCount}>
          {items.length === 1 ? t('home.count_one') : t('home.count_messages', { count: items.length })}
        </Text>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((value) => {
          const selected = filter === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setFilter(value)}
              style={[styles.filter, selected && styles.filterSelected]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{t(FILTER_KEYS[value])}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.message.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{items.length === 0 ? t('home.empty') : t('home.filter_empty')}</Text>
            {items.length === 0 && (
              <PrimaryButton
                label={t('home.create_first')}
                onPress={() => navigation.navigate('ScheduledMessageForm', {})}
                style={{ alignSelf: 'stretch' }}
              />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('ScheduledMessageForm', { scheduledMessageId: item.message.id })}
            style={[styles.row, !item.message.isActive && styles.rowPaused]}
          >
            <View style={styles.rowTime}>
              <Text style={styles.rowClock}>
                {i18n.formatTime(item.next ?? new Date(item.message.startAt))}
              </Text>
              <Text style={styles.rowDay} numberOfLines={1}>
                {rowDayLabel(item, now, i18n)}
              </Text>
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.message.text}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {namesShort(item.names)} · {t(REPEAT_KEYS[item.message.recurrence.type])}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.more_options')}
              onPress={() => setMenuFor(item)}
              style={styles.iconButton}
            >
              <EllipsisVertical size={20} color={theme.color.textMuted} />
            </Pressable>
          </Pressable>
        )}
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('ScheduledMessageForm', {})}
        style={[styles.fab, { bottom: insets.bottom + 28 }]}
      >
        <Plus size={20} color={theme.color.onPrimary} strokeWidth={2.4} />
        <Text style={styles.fabText}>{t('home.new_message')}</Text>
      </Pressable>

      <ActionMenu
        visible={!!menuFor}
        onClose={() => setMenuFor(null)}
        items={
          menuFor
            ? [
                {
                  key: 'edit',
                  label: t('menu.edit'),
                  icon: <Pencil size={20} color={theme.color.text} />,
                  onPress: () =>
                    navigation.navigate('ScheduledMessageForm', { scheduledMessageId: menuFor.message.id }),
                },
                {
                  key: 'duplicate',
                  label: t('menu.duplicate'),
                  icon: <Copy size={20} color={theme.color.text} />,
                  onPress: () => navigation.navigate('ScheduledMessageForm', { duplicateFromId: menuFor.message.id }),
                },
                {
                  key: 'toggle',
                  label: menuFor.message.isActive ? t('home.pause') : t('home.resume'),
                  icon: menuFor.message.isActive ? (
                    <Pause size={20} color={theme.color.text} />
                  ) : (
                    <Play size={20} color={theme.color.text} />
                  ),
                  onPress: () => void handleToggleActive(menuFor),
                },
                {
                  key: 'delete',
                  label: t('menu.delete'),
                  icon: <Trash2 size={20} color={theme.color.danger} />,
                  destructive: true,
                  onPress: () => handleDelete(menuFor),
                },
              ]
            : []
        }
      />
    </View>
  );
}

function createStyles(theme: Theme) {
  const c = theme.color;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SCREEN_PADDING_X,
      paddingBottom: 8,
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
    brandTile: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandName: { fontFamily: theme.font.display(700), fontSize: 20, letterSpacing: -0.2, color: c.text, flexShrink: 1 },
    iconButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    hero: {
      marginHorizontal: SCREEN_PADDING_X,
      marginTop: 12,
      padding: 20,
      borderRadius: theme.radius.hero,
      backgroundColor: c.inverse,
      gap: 14,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    heroLabel: {
      fontFamily: theme.font.body(600),
      fontSize: 13,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: c.textOnInverseMuted,
      flexShrink: 1,
    },
    heroChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: c.inverseChip },
    heroChipText: { fontFamily: theme.font.body(600), fontSize: 12, color: '#E4E5F1' },
    heroTime: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
    heroClock: {
      fontFamily: theme.font.display(theme.clock.weight),
      fontSize: theme.clock.sizeHero,
      letterSpacing: theme.clock.letterSpacing,
      color: c.textOnInverse,
      lineHeight: theme.clock.sizeHero + 4,
    },
    heroWhen: { fontFamily: theme.font.body(400), fontSize: 15, color: c.textOnInverseMuted, flexShrink: 1 },
    heroText: { fontFamily: theme.font.body(400), fontSize: 15, lineHeight: 22, color: '#E4E5F1' },
    heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    heroTo: { flex: 1, fontFamily: theme.font.body(400), fontSize: 13, color: c.textOnInverseMuted },
    sendNow: {
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: theme.radius.control,
      backgroundColor: c.highlight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sendNowText: { fontFamily: theme.font.body(700), fontSize: 15, color: c.onHighlight },
    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SCREEN_PADDING_X,
      paddingTop: 24,
      paddingBottom: 10,
    },
    listTitle: { fontFamily: theme.font.display(600), fontSize: 20, color: c.text },
    listCount: { fontFamily: theme.font.body(400), fontSize: 14, color: c.textMuted },
    filters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: SCREEN_PADDING_X,
      paddingBottom: 12,
    },
    filter: {
      minHeight: 36,
      paddingHorizontal: 14,
      borderRadius: theme.radius.chip,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      justifyContent: 'center',
    },
    filterSelected: { backgroundColor: c.inverse, borderColor: c.inverse },
    filterText: { fontFamily: theme.font.body(500), fontSize: 14, color: c.text },
    filterTextSelected: { fontFamily: theme.font.body(600), color: c.textOnInverse },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginHorizontal: SCREEN_PADDING_X,
      marginBottom: 10,
      paddingVertical: 14,
      paddingLeft: 16,
      paddingRight: 8,
      borderRadius: theme.radius.card,
      backgroundColor: c.surface,
    },
    rowPaused: { opacity: 0.6 },
    rowTime: { minWidth: 58, alignItems: 'flex-start' },
    rowClock: {
      fontFamily: theme.font.display(theme.clock.weight),
      fontSize: theme.clock.sizeList,
      letterSpacing: -0.4,
      color: c.text,
    },
    rowDay: { fontFamily: theme.font.body(400), fontSize: 12, color: c.textMuted },
    rowInfo: { flex: 1, minWidth: 0, gap: 4 },
    rowTitle: { fontFamily: theme.font.body(600), fontSize: 15, color: c.text },
    rowMeta: { fontFamily: theme.font.body(400), fontSize: 13, color: c.textMuted },
    empty: { alignItems: 'center', gap: 16, paddingTop: 40, paddingHorizontal: SCREEN_PADDING_X },
    emptyText: { fontFamily: theme.font.body(400), fontSize: 15, color: c.textMuted, textAlign: 'center' },
    fab: {
      position: 'absolute',
      right: SCREEN_PADDING_X,
      minHeight: 56,
      paddingHorizontal: 22,
      borderRadius: 18,
      backgroundColor: c.primary,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      shadowColor: '#14162B',
      shadowOpacity: 0.22,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    fabText: { fontFamily: theme.font.body(700), fontSize: 16, color: c.onPrimary },
  });
}
