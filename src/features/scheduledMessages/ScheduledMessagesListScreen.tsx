import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, Copy, EllipsisVertical, Pause, Pencil, Play, Plus, Send, Settings, Trash2 } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useI18n, type I18n } from '../../shared/i18n';
import { computeNextOccurrence } from '../../shared/notifications/computeNextOccurrence';
import { SCREEN_PADDING_X, type Theme } from '../../shared/theme/themes';
import { useTheme, useThemedStyles } from '../../shared/theme/ThemeProvider';
import type { Contact, RecurrenceType, ScheduledMessage } from '../../shared/types';
import { ActionMenu } from '../../shared/ui/ActionMenu';
import { AlarmModeBanner } from '../../shared/ui/AlarmModeBanner';
import { BrandMark, brandColors } from '../../shared/ui/BrandMark';
import { Clock } from '../../shared/ui/Clock';
import { ScreenBackground } from '../../shared/ui/ScreenBackground';
import { PrimaryButton } from '../../shared/ui/Buttons';
import { useDialog } from '../../shared/ui/Dialog';
import { listContacts } from '../contacts/repository';
import { startOccurrenceNow } from './alarmHandler';
import { listOccurrencesForMessage } from './occurrenceRepository';
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

function remainingText(next: Date, now: Date, i18n: I18n): string {
  const minutes = Math.max(1, Math.round((next.getTime() - now.getTime()) / 60000));
  if (minutes < 60) return i18n.t('home.minutes', { n: minutes });
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 || hours >= 6
    ? i18n.t('home.hours', { n: hours })
    : `${i18n.t('home.hours', { n: hours })} ${i18n.t('home.minutes', { n: rest })}`;
}

function describeRemaining(next: Date, now: Date, i18n: I18n): string {
  return i18n.t('home.today_in', { time: remainingText(next, now, i18n) });
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
  const dialog = useDialog();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [menuFor, setMenuFor] = useState<Item | null>(null);
  const [sentToday, setSentToday] = useState({ done: 0, total: 0 });
  const now = new Date();

  const load = useCallback(async () => {
    const [messages, contacts] = await Promise.all([listScheduledMessages(), listContacts()]);
    const byId = new Map<string, Contact>(contacts.map((contact) => [contact.id, contact]));
    const current = new Date();
    let done = 0;
    let total = 0;
    for (const message of messages) {
      for (const occurrence of await listOccurrencesForMessage(message.id)) {
        if (!sameDay(new Date(occurrence.firedAt), current)) continue;
        total += occurrence.recipients.length;
        done += occurrence.recipients.filter((recipient) => recipient.status === 'confirmed').length;
      }
    }
    setSentToday({ done, total });
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
    dialog.show({
      title: t('home.delete_title'),
      message: t('home.delete_body'),
      actions: [
        { label: t('common.cancel'), style: 'cancel' },
        {
          label: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteScheduledMessage(item.message.id);
            void load();
          },
        },
      ],
    });
  }

  const isLock = theme.id === 'bloqueo';
  const isSwiss = theme.ui.ruled;
  const brandPalette = brandColors(theme);
  const upper = (text: string) => (theme.ui.uppercase ? text.toUpperCase() : text);

  const nextTo = nextItem
    ? nextItem.names.length > 2
      ? t('home.to_people', { names: nextItem.names.slice(0, 2).join(', '), count: nextItem.names.length - 2 })
      : t('home.to_names', { names: nextItem.names.join(', ') })
    : '';

  const settingsButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('a11y.settings')}
      onPress={() => navigation.navigate('Settings')}
      style={[styles.iconButton, theme.id === 'cristal' && styles.glassCircle]}
    >
      <Settings size={22} color={theme.color.text} />
    </Pressable>
  );

  const hero = nextItem && (
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        <View style={styles.heroLabelRow}>
          {isSwiss && <View style={styles.dot} />}
          <Text style={styles.heroLabel} numberOfLines={2}>
            {isSwiss
              ? upper(`${t('home.next').split(' ')[0]} · ${describeWhen(nextItem, now, i18n)}`)
              : upper(t('home.next'))}
          </Text>
        </View>
        <View style={styles.heroChip}>
          <Text style={styles.heroChipText}>{upper(t(REPEAT_KEYS[nextItem.message.recurrence.type]))}</Text>
        </View>
      </View>
      <View style={styles.heroTime}>
        <Clock time={i18n.formatTime(nextItem.next!)} size={theme.clock.sizeHero} color={theme.hero.text} />
        {!isSwiss && (
          <Text style={styles.heroWhen} numberOfLines={2}>
            {describeWhen(nextItem, now, i18n)}
          </Text>
        )}
      </View>
      <Text style={styles.heroText} numberOfLines={3}>
        {nextItem.message.text}
      </Text>
      <View style={styles.heroBottom}>
        <Text style={styles.heroTo} numberOfLines={2}>
          {nextTo}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => handleSendNow(nextItem)} style={styles.sendNow}>
          <Text style={styles.sendNowText}>{t('home.send_now')}</Text>
          <Send size={18} color={theme.hero.onAction} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );

  // Lock-screen theme: giant clock, stats and the next alarm as a notification card.
  const lockHeader = (
    <View style={[styles.lock, { paddingTop: insets.top + 36 }]}>
      <Text style={styles.lockDate}>{i18n.formatLongDay(now)}</Text>
      <Clock
        time={i18n.formatTime(nextItem?.next ?? now)}
        size={theme.clock.sizeHero}
        color={theme.color.text}
      />
      {nextItem?.next && (
        <Text style={styles.lockCountdown}>
          {t('home.lock_countdown', { time: remainingText(nextItem.next, now, i18n) })}
        </Text>
      )}
      <View style={styles.lockStats}>
        <View style={styles.lockStat}>
          <Text style={styles.lockStatLabel}>{t('home.lock_today')}</Text>
          <Text style={styles.lockStatValue}>
            {(() => {
              const count = items.filter((item) => item.next && sameDay(item.next, now)).length;
              return count === 1 ? t('home.lock_alarm_one') : t('home.lock_alarms', { count });
            })()}
          </Text>
        </View>
        <View style={styles.lockStat}>
          <Text style={styles.lockStatLabel}>{t('home.lock_sent')}</Text>
          <Text style={styles.lockStatValue}>{t('home.lock_of', sentToday)}</Text>
        </View>
      </View>
      {nextItem && (
        <Pressable accessibilityRole="button" onPress={() => handleSendNow(nextItem)} style={styles.lockCard}>
          <View style={styles.lockCardIcon}>
            <Bell size={20} color="#0C0A11" />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <View style={styles.lockCardTop}>
              <Text style={styles.lockCardApp}>{t('app.name').toUpperCase()}</Text>
              <Text style={styles.lockCardApp}>{t('home.lock_now')}</Text>
            </View>
            <Text style={styles.lockCardTitle} numberOfLines={1}>
              {nextItem.message.text}
            </Text>
            <Text style={styles.lockCardBody} numberOfLines={2}>
              {t('home.lock_tap_to_send', { names: namesShort(nextItem.names) })}
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );

  const header = (
    <View>
      {isLock ? (
        lockHeader
      ) : (
        <>
          <View style={[styles.header, { paddingTop: insets.top + (isSwiss ? 16 : 20) }]}>
            {isSwiss ? (
              <Text style={styles.swissBrand}>{t('app.name').toUpperCase()}</Text>
            ) : (
              <View style={styles.brand}>
                <View style={styles.brandTile}>
                  <BrandMark size={24} body={brandPalette.body} bells={brandPalette.bells} lines={brandPalette.lines} />
                </View>
                <Text style={styles.brandName}>{t('app.name')}</Text>
              </View>
            )}
            {settingsButton}
          </View>
          {hero}
        </>
      )}

      <AlarmModeBanner />

      <View style={styles.listHeader}>
        <Text accessibilityRole="header" style={styles.listTitle}>
          {upper(t('home.scheduled'))}
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
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={[styles.filterText, selected && styles.filterTextSelected]}
              >
                {t(FILTER_KEYS[value])}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <ScreenBackground>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.message.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120, flexGrow: 1 }}
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
        renderItem={({ item }) => {
          const time = (
            <Text style={styles.rowClock}>{i18n.formatTime(item.next ?? new Date(item.message.startAt))}</Text>
          );
          const info = (
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.message.text}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {namesShort(item.names)} · {t(REPEAT_KEYS[item.message.recurrence.type])}
              </Text>
            </View>
          );
          const menuButton = (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.more_options')}
              onPress={() => setMenuFor(item)}
              style={styles.iconButton}
            >
              <EllipsisVertical size={20} color={theme.color.textMuted} />
            </Pressable>
          );
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('ScheduledMessageForm', { scheduledMessageId: item.message.id })}
              style={[styles.row, !item.message.isActive && styles.rowPaused]}
            >
              {isLock ? (
                <>
                  {info}
                  {time}
                </>
              ) : (
                <>
                  <View style={styles.rowTime}>
                    {time}
                    <Text style={styles.rowDay} numberOfLines={1}>
                      {upper(rowDayLabel(item, now, i18n))}
                    </Text>
                  </View>
                  {info}
                </>
              )}
              {menuButton}
            </Pressable>
          );
        }}
      />

      {isLock ? (
        <View style={[styles.lockBar, { bottom: insets.bottom + 34 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('a11y.settings')}
            onPress={() => navigation.navigate('Settings')}
            style={styles.lockRound}
          >
            <Settings size={24} color={theme.color.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home.new_message')}
            onPress={() => navigation.navigate('ScheduledMessageForm', {})}
            style={styles.lockRound}
          >
            <Plus size={26} color={theme.color.text} strokeWidth={2.2} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('ScheduledMessageForm', {})}
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
        >
          <Text style={styles.fabText}>{t('home.new_message')}</Text>
          <Plus size={20} color={isSwiss ? theme.color.text : theme.color.onPrimary} strokeWidth={2.4} />
        </Pressable>
      )}

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
    </ScreenBackground>
  );
}

function createStyles(theme: Theme) {
  const c = theme.color;
  const swiss = theme.ui.ruled;
  const upper = theme.ui.uppercase ? ('uppercase' as const) : ('none' as const);
  const cardBorder = { borderWidth: theme.ui.cardBorder, borderColor: c.border };
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: swiss ? SCREEN_PADDING_X : 0,
      paddingHorizontal: swiss ? 0 : SCREEN_PADDING_X,
      paddingBottom: swiss ? 6 : 8,
      borderBottomWidth: swiss ? 1 : 0,
      borderBottomColor: c.borderStrong,
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
    brandName: { fontFamily: theme.font.heading(700), fontSize: 20, letterSpacing: -0.2, color: c.text, flexShrink: 1 },
    swissBrand: { fontFamily: theme.font.heading(800), fontSize: 15, letterSpacing: 0.4, color: c.text },
    iconButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    glassCircle: { borderRadius: 22, backgroundColor: c.surface, ...cardBorder, borderWidth: 1 },
    hero: {
      marginHorizontal: SCREEN_PADDING_X,
      marginTop: swiss ? 0 : 12,
      padding: swiss ? 0 : 20,
      paddingVertical: swiss ? 22 : 20,
      borderRadius: theme.radius.hero,
      backgroundColor: theme.hero.background,
      borderWidth: theme.hero.border === 'transparent' ? 0 : 1,
      borderColor: theme.hero.border,
      borderBottomWidth: swiss ? 1 : theme.hero.border === 'transparent' ? 0 : 1,
      borderBottomColor: swiss ? c.borderStrong : theme.hero.border,
      gap: swiss ? 8 : 14,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    heroLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent },
    heroLabel: {
      fontFamily: theme.font.body(600),
      fontSize: swiss ? 13 : 13,
      letterSpacing: 0.6,
      textTransform: swiss ? 'none' : 'uppercase',
      color: swiss ? theme.hero.text : theme.hero.muted,
      flexShrink: 1,
    },
    heroChip: {
      paddingHorizontal: swiss ? 8 : 10,
      paddingVertical: swiss ? 3 : 4,
      borderRadius: swiss ? 0 : 999,
      backgroundColor: theme.hero.chip,
      borderWidth: swiss ? 1 : 0,
      borderColor: c.borderStrong,
    },
    heroChipText: { fontFamily: theme.font.body(600), fontSize: swiss ? 13 : 12, letterSpacing: swiss ? 0.6 : 0, color: theme.hero.chipText },
    heroTime: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
    heroWhen: { fontFamily: theme.font.body(400), fontSize: 15, color: theme.hero.muted, flexShrink: 1 },
    heroText: { fontFamily: theme.font.body(400), fontSize: 15, lineHeight: 22, color: swiss ? theme.hero.muted : theme.hero.text, opacity: swiss ? 1 : 0.92 },
    heroBottom: {
      flexDirection: swiss ? 'column' : 'row',
      alignItems: swiss ? 'stretch' : 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    heroTo: { flex: swiss ? 0 : 1, fontFamily: theme.font.body(400), fontSize: swiss ? 14 : 13, color: theme.hero.muted },
    sendNow: {
      minHeight: swiss ? 54 : 44,
      paddingHorizontal: swiss ? 18 : 16,
      borderRadius: swiss ? 0 : theme.id === 'cristal' ? 16 : theme.radius.control,
      backgroundColor: theme.hero.action,
      flexDirection: swiss ? 'row-reverse' : 'row-reverse',
      alignItems: 'center',
      justifyContent: swiss ? 'space-between' : 'center',
      gap: 8,
    },
    sendNowText: { fontFamily: theme.font.body(700), fontSize: swiss ? 16 : 15, color: theme.hero.onAction },
    listHeader: {
      flexDirection: 'row',
      alignItems: swiss ? 'baseline' : 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SCREEN_PADDING_X,
      paddingTop: swiss ? 18 : 24,
      paddingBottom: swiss ? 6 : 10,
    },
    listTitle: {
      fontFamily: swiss ? theme.font.body(600) : theme.font.heading(600),
      fontSize: swiss ? 13 : 20,
      letterSpacing: swiss ? 0.6 : 0,
      color: c.text,
    },
    listCount: { fontFamily: theme.font.body(400), fontSize: swiss ? 13 : 14, color: c.textMuted },
    // One row of equal-width pills that never wraps; labels shrink instead.
    filters: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      gap: swiss ? 0 : 6,
      marginHorizontal: SCREEN_PADDING_X,
      marginBottom: 12,
      borderWidth: swiss ? 1 : 0,
      borderColor: c.borderStrong,
    },
    filter: {
      flex: 1,
      minWidth: 0,
      minHeight: swiss ? 40 : 36,
      paddingHorizontal: 6,
      borderRadius: theme.radius.chip,
      borderWidth: swiss ? 0 : 1,
      borderColor: c.border,
      backgroundColor: swiss ? 'transparent' : c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterSelected: { backgroundColor: c.selected, borderColor: c.selected },
    filterText: { fontFamily: theme.font.body(500), fontSize: 13, color: c.text, textAlign: 'center' },
    filterTextSelected: { fontFamily: theme.font.body(600), color: c.onSelected },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: swiss ? 14 : theme.id === 'bloqueo' ? 12 : 14,
      marginHorizontal: SCREEN_PADDING_X,
      marginBottom: swiss ? 0 : theme.id === 'bloqueo' ? 8 : 10,
      minHeight: swiss ? 62 : undefined,
      paddingVertical: swiss ? 0 : 12,
      paddingLeft: swiss ? 0 : 16,
      paddingRight: swiss ? 0 : 8,
      borderRadius: swiss ? 0 : theme.radius.card,
      backgroundColor: swiss ? 'transparent' : c.surface,
      ...(swiss ? { borderBottomWidth: 1, borderBottomColor: c.border } : cardBorder),
    },
    rowPaused: { opacity: 0.6 },
    rowTime: { minWidth: swiss ? 72 : 64, alignItems: 'flex-start' },
    rowClock: {
      fontFamily: theme.font.display(theme.clock.weight),
      fontSize: theme.clock.sizeList,
      letterSpacing: swiss ? -1 : -0.4,
      color: c.text,
    },
    rowDay: { fontFamily: theme.font.body(swiss ? 600 : 400), fontSize: 12, color: c.textMuted },
    rowInfo: { flex: 1, minWidth: 0, gap: 3 },
    rowTitle: { fontFamily: theme.font.body(600), fontSize: 15, color: c.text },
    rowMeta: { fontFamily: theme.font.body(400), fontSize: 13, color: c.textMuted },
    empty: { alignItems: 'center', gap: 16, paddingTop: 40, paddingHorizontal: SCREEN_PADDING_X },
    emptyText: { fontFamily: theme.font.body(400), fontSize: 15, color: c.textMuted, textAlign: 'center' },
    fab: {
      position: 'absolute',
      right: SCREEN_PADDING_X,
      left: swiss ? SCREEN_PADDING_X : undefined,
      minHeight: 56,
      paddingHorizontal: swiss ? 18 : 22,
      borderRadius: swiss ? 0 : 18,
      backgroundColor: swiss ? c.background : c.primary,
      borderWidth: swiss ? 1 : 0,
      borderColor: c.borderStrong,
      flexDirection: swiss ? 'row' : 'row-reverse',
      alignItems: 'center',
      justifyContent: swiss ? 'space-between' : 'center',
      gap: 8,
      ...(swiss
        ? {}
        : {
            shadowColor: theme.id === 'cristal' ? '#5EE6F0' : '#14162B',
            shadowOpacity: theme.id === 'cristal' ? 0.25 : 0.22,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }),
    },
    fabText: { fontFamily: theme.font.body(swiss ? 600 : 700), fontSize: 16, color: swiss ? c.text : c.onPrimary },

    lock: { alignItems: 'center', gap: 12, paddingHorizontal: SCREEN_PADDING_X, paddingBottom: 8 },
    lockDate: { fontFamily: theme.font.body(600), fontSize: 17, color: c.textSecondary, textTransform: 'capitalize' },
    lockCountdown: { fontFamily: theme.font.body(400), fontSize: 14, color: c.textMuted },
    lockStats: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
    lockStat: { flex: 1, borderRadius: 22, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: c.surface, ...cardBorder },
    lockStatLabel: { fontFamily: theme.font.body(400), fontSize: 12, color: c.textMuted },
    lockStatValue: { fontFamily: theme.font.display(800), fontSize: 21, color: c.text },
    lockCard: {
      width: '100%',
      flexDirection: 'row',
      gap: 12,
      padding: 14,
      borderRadius: 24,
      backgroundColor: theme.hero.background,
      borderWidth: 1,
      borderColor: theme.hero.border,
      marginTop: 6,
    },
    lockCardIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: '#FF6B8B', alignItems: 'center', justifyContent: 'center' },
    lockCardTop: { flexDirection: 'row', justifyContent: 'space-between' },
    lockCardApp: { fontFamily: theme.font.body(400), fontSize: 12, letterSpacing: 0.4, color: c.textMuted },
    lockCardTitle: { fontFamily: theme.font.body(700), fontSize: 15, color: c.text },
    lockCardBody: { fontFamily: theme.font.body(400), fontSize: 14, color: c.textSecondary },
    lockBar: { position: 'absolute', left: 32, right: 32, flexDirection: 'row', justifyContent: 'space-between' },
    lockRound: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
