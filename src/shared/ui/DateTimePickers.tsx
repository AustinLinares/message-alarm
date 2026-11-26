import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useI18n } from '../i18n';
import type { Theme } from '../theme/themes';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

// Date and time pickers drawn with the app's own themes, replacing the
// system dialogs (which can't follow Suizo / Cristal / Bloqueo).

interface SheetProps {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
  children: ReactNode;
}

function PickerSheet({ visible, title, onCancel, onConfirm, children }: SheetProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useI18n();
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <Pressable accessible={false} style={styles.backdrop} onPress={onCancel}>
        <Pressable accessibilityViewIsModal onPress={() => undefined} style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>
            {theme.ui.uppercase ? title.toUpperCase() : title}
          </Text>
          {children}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={[styles.button, styles.cancelButton]}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onConfirm} style={[styles.button, styles.okButton]}>
              <Text style={styles.okText}>{t('common.ok')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------- Date

interface DatePickerProps {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function DatePickerSheet({ visible, value, onConfirm, onCancel }: DatePickerProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, formatMonthYear, formatLongDay, weekdayShort, firstWeekday } = useI18n();
  const [selected, setSelected] = useState(value);
  const [month, setMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));

  // Start from the current value every time the picker opens.
  useEffect(() => {
    if (!visible) return;
    setSelected(value);
    setMonth(new Date(value.getFullYear(), value.getMonth(), 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const today = new Date();
  const cells = useMemo(() => {
    const offset = (month.getDay() - firstWeekday + 7) % 7;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const total = Math.ceil((offset + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const day = i - offset + 1;
      return day >= 1 && day <= daysInMonth ? new Date(month.getFullYear(), month.getMonth(), day) : null;
    });
  }, [month, firstWeekday]);

  function shiftMonth(delta: number) {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  const header = formatMonthYear(month);
  return (
    <PickerSheet
      visible={visible}
      title={t('picker.date_title')}
      onCancel={onCancel}
      onConfirm={() => {
        const result = new Date(selected);
        onConfirm(result);
      }}
    >
      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('picker.prev_month')}
          onPress={() => shiftMonth(-1)}
          style={styles.monthArrow}
        >
          <ChevronLeft size={22} color={theme.color.text} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.monthLabel}>
          {theme.ui.uppercase ? header.toUpperCase() : header}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('picker.next_month')}
          onPress={() => shiftMonth(1)}
          style={styles.monthArrow}
        >
          <ChevronRight size={22} color={theme.color.text} />
        </Pressable>
      </View>
      <View style={styles.weekRow}>
        {Array.from({ length: 7 }, (_, i) => (
          <Text key={i} style={styles.weekday}>
            {weekdayShort((firstWeekday + i) % 7)}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((cell, i) => {
          if (!cell) return <View key={i} style={styles.cell} />;
          const isSelected = sameDay(cell, selected);
          const isToday = sameDay(cell, today);
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={formatLongDay(cell)}
              onPress={() => setSelected(cell)}
              style={styles.cell}
            >
              <View style={[styles.day, isToday && styles.dayToday, isSelected && styles.daySelected]}>
                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{cell.getDate()}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </PickerSheet>
  );
}

// ---------------------------------------------------------------- Time

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const PAD = ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2);

interface WheelProps {
  items: string[];
  index: number;
  onChange: (index: number) => void;
  label: string;
}

// A snapping column of values; the one in the middle is the selection.
function Wheel({ items, index, onChange, label }: WheelProps) {
  const styles = useThemedStyles(createStyles);
  const listRef = useRef<FlatList<string>>(null);
  const offsetY = useRef(0);
  const inited = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  function commit() {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = null;
    const next = Math.max(0, Math.min(items.length - 1, Math.round(offsetY.current / ITEM_HEIGHT)));
    onChange(next);
  }

  return (
    <View accessibilityLabel={label} style={styles.wheel}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(_, i) => String(i)}
        getItemLayout={(_, i) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * i, index: i })}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: PAD }}
        onLayout={() => {
          if (inited.current) return;
          inited.current = true;
          offsetY.current = index * ITEM_HEIGHT;
          listRef.current?.scrollToOffset({ offset: index * ITEM_HEIGHT, animated: false });
        }}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          offsetY.current = e.nativeEvent.contentOffset.y;
        }}
        onScrollEndDrag={() => {
          // If no fling follows, settle shortly after the finger lifts.
          if (settleTimer.current) clearTimeout(settleTimer.current);
          settleTimer.current = setTimeout(commit, 200);
        }}
        onMomentumScrollBegin={() => {
          if (settleTimer.current) clearTimeout(settleTimer.current);
          settleTimer.current = null;
        }}
        onMomentumScrollEnd={commit}
        renderItem={({ item, index: i }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              offsetY.current = i * ITEM_HEIGHT;
              listRef.current?.scrollToOffset({ offset: i * ITEM_HEIGHT, animated: true });
              onChange(i);
            }}
            style={styles.wheelItem}
          >
            <Text style={[styles.wheelText, i === index && styles.wheelTextSelected]}>{item}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

interface TimePickerProps {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const HOURS_24 = Array.from({ length: 24 }, (_, i) => pad2(i));
const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => pad2(i));
const PERIODS = ['AM', 'PM'];

export function TimePickerSheet({ visible, value, onConfirm, onCancel }: TimePickerProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, uses24h } = useI18n();
  const [hour, setHour] = useState(value.getHours());
  const [minute, setMinute] = useState(value.getMinutes());
  // Wheels read their start position once, so remount them each time it opens.
  const [openCount, setOpenCount] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setHour(value.getHours());
    setMinute(value.getMinutes());
    setOpenCount((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const isPm = hour >= 12;

  return (
    <PickerSheet
      visible={visible}
      title={t('picker.time_title')}
      onCancel={onCancel}
      onConfirm={() => {
        const result = new Date(value);
        result.setHours(hour, minute, 0, 0);
        onConfirm(result);
      }}
    >
      <View style={styles.wheels}>
        <View pointerEvents="none" style={styles.band} />
        {uses24h ? (
          <Wheel key={`h-${openCount}`} label={t('picker.hours')} items={HOURS_24} index={hour} onChange={setHour} />
        ) : (
          <Wheel
            key={`h-${openCount}`}
            label={t('picker.hours')}
            items={HOURS_12}
            index={hour12 - 1}
            onChange={(i) => setHour(((i + 1) % 12) + (isPm ? 12 : 0))}
          />
        )}
        <Text style={styles.colon}>:</Text>
        <Wheel key={`m-${openCount}`} label={t('picker.minutes')} items={MINUTES} index={minute} onChange={setMinute} />
        {!uses24h && (
          <Wheel
            key={`p-${openCount}`}
            label={t('picker.period')}
            items={PERIODS}
            index={isPm ? 1 : 0}
            onChange={(i) => setHour((hour % 12) + (i === 1 ? 12 : 0))}
          />
        )}
      </View>
    </PickerSheet>
  );
}

// ---------------------------------------------------------------- Styles

function createStyles(theme: Theme) {
  const c = theme.color;
  const swiss = theme.ui.ruled;
  const lock = theme.id === 'bloqueo';
  const dayRadius = swiss ? 0 : 20;
  const buttonRadius = theme.ui.buttonRadius === 0 ? 0 : lock ? 999 : theme.radius.control;
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(8,8,20,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
    card: {
      width: '100%',
      maxWidth: 360,
      padding: 20,
      gap: 12,
      backgroundColor: c.sheet,
      borderRadius: theme.radius.cardLarge,
      borderWidth: theme.ui.cardBorder,
      borderColor: c.borderStrong,
    },
    title: { fontFamily: theme.font.heading(swiss ? 800 : 600), fontSize: swiss ? 15 : 19, letterSpacing: swiss ? 0.4 : 0, color: c.text },
    actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
    button: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: buttonRadius, paddingHorizontal: 12 },
    cancelButton: { borderWidth: 1, borderColor: c.borderStrong },
    okButton: { backgroundColor: c.primary },
    cancelText: { fontFamily: theme.font.body(600), fontSize: 15, color: c.text },
    okText: { fontFamily: theme.font.body(700), fontSize: 15, color: c.onPrimary },

    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    monthArrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    monthLabel: { flex: 1, textAlign: 'center', fontFamily: theme.font.body(600), fontSize: 16, color: c.text, textTransform: swiss ? 'none' : 'capitalize' },
    weekRow: { flexDirection: 'row' },
    weekday: { width: `${100 / 7}%`, textAlign: 'center', fontFamily: theme.font.body(600), fontSize: 12, color: c.textMuted, paddingBottom: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center' },
    day: { width: 40, height: 40, borderRadius: dayRadius, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
    dayToday: { borderColor: c.borderStrong },
    daySelected: { backgroundColor: c.primary, borderColor: c.primary },
    dayText: { fontFamily: theme.font.body(500), fontSize: 15, color: c.text },
    dayTextSelected: { fontFamily: theme.font.body(700), color: c.onPrimary },

    wheels: { height: ITEM_HEIGHT * VISIBLE_ROWS, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
    band: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: PAD,
      height: ITEM_HEIGHT,
      backgroundColor: c.surfaceMuted,
      borderRadius: swiss ? 0 : 12,
      borderTopWidth: swiss ? 1 : 0,
      borderBottomWidth: swiss ? 1 : 0,
      borderColor: c.borderStrong,
    },
    wheel: { flex: 1, height: ITEM_HEIGHT * VISIBLE_ROWS },
    wheelItem: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
    wheelText: { fontFamily: theme.font.body(400), fontSize: 20, color: c.textMuted },
    wheelTextSelected: { fontFamily: theme.font.heading(600), fontSize: 26, color: c.text },
    colon: { fontFamily: theme.font.heading(600), fontSize: 26, color: c.text, paddingBottom: 2 },
  });
}
