import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import { useTheme } from '../theme/ThemeProvider';

export interface DialogAction {
  label: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
}

interface DialogOptions {
  title: string;
  message?: string;
  actions?: DialogAction[]; // defaults to a single OK button
}

interface DialogApi {
  show: (options: DialogOptions) => void;
}

const DialogContext = createContext<DialogApi | null>(null);

// Themed replacement for Alert.alert. Modals opened inside another <Modal> (the
// contact and template pickers) wrap their content in their own provider so the
// dialog is drawn inside that modal and not behind it.
export function DialogProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const { t } = useI18n();
  const [options, setOptions] = useState<DialogOptions | null>(null);

  const show = useCallback((next: DialogOptions) => setOptions(next), []);
  const api = useMemo<DialogApi>(() => ({ show }), [show]);

  const actions = options?.actions ?? [{ label: t('common.ok') }];
  const cancel = actions.find((action) => action.style === 'cancel');
  const stacked = actions.length > 2;

  function run(action: DialogAction) {
    setOptions(null);
    void action.onPress?.();
  }

  const c = theme.color;
  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal transparent visible={!!options} animationType="fade" statusBarTranslucent onRequestClose={() => setOptions(null)}>
        <Pressable
          accessible={false}
          style={styles.backdrop}
          onPress={() => (cancel ? run(cancel) : actions.length === 1 ? run(actions[0]) : undefined)}
        >
          <Pressable
            accessibilityViewIsModal
            accessibilityRole="alert"
            onPress={() => undefined}
            style={[
              styles.card,
              {
                backgroundColor: c.sheet,
                borderRadius: theme.radius.cardLarge,
                borderWidth: theme.ui.cardBorder,
                borderColor: c.borderStrong,
              },
            ]}
          >
            <Text style={[styles.title, { fontFamily: theme.font.heading(600), color: c.text }]}>
              {theme.ui.uppercase ? options?.title.toUpperCase() : options?.title}
            </Text>
            {options?.message ? (
              <Text style={[styles.message, { fontFamily: theme.font.body(400), color: c.textSecondary }]}>
                {options.message}
              </Text>
            ) : null}
            <View style={[styles.actions, { flexDirection: stacked ? 'column' : 'row' }]}>
              {actions.map((action, index) => {
                const kind = action.style ?? 'default';
                const filled = kind !== 'cancel';
                const background = kind === 'destructive' ? c.danger : c.primary;
                const foreground = kind === 'destructive' ? (theme.mode === 'dark' ? '#0B0B12' : '#FFFFFF') : c.onPrimary;
                return (
                  <Pressable
                    key={`${action.label}-${index}`}
                    accessibilityRole="button"
                    onPress={() => run(action)}
                    style={[
                      styles.button,
                      {
                        borderRadius: theme.ui.buttonRadius === 0 ? 0 : theme.radius.control,
                        backgroundColor: filled ? background : 'transparent',
                        borderWidth: filled ? 0 : 1,
                        borderColor: c.borderStrong,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={2}
                      style={{
                        fontFamily: theme.font.body(filled ? 700 : 600),
                        fontSize: 15,
                        textAlign: 'center',
                        color: filled ? foreground : c.text,
                      }}
                    >
                      {action.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogApi {
  const value = useContext(DialogContext);
  if (!value) throw new Error('useDialog must be used inside <DialogProvider>');
  return value;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,8,20,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, padding: 22, gap: 10 },
  title: { fontSize: 19, lineHeight: 25 },
  message: { fontSize: 15, lineHeight: 22 },
  actions: { gap: 10, marginTop: 14 },
  button: { flex: 1, minHeight: 48, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
});
