import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../../shared/i18n';
import { MESSAGE_MAX_LENGTH, type Theme } from '../../shared/theme/themes';
import { useTheme, useThemedStyles } from '../../shared/theme/ThemeProvider';
import { PrimaryButton, SecondaryButton } from '../../shared/ui/Buttons';
import type { MessageTemplate } from '../../shared/types';
import { createTemplate, deleteTemplate, listTemplates, updateTemplate } from './repository';

interface TemplatePickerProps {
  onSelect: (template: MessageTemplate) => void;
  onClose: () => void;
}

type Mode = { kind: 'list' } | { kind: 'form'; editing: MessageTemplate | null };

export function TemplatePicker({ onSelect, onClose }: TemplatePickerProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const [name, setName] = useState('');
  const [text, setText] = useState('');

  async function refresh() {
    setTemplates(await listTemplates());
  }

  useEffect(() => {
    void refresh();
  }, []);

  function openForm(editing: MessageTemplate | null) {
    setName(editing?.name ?? '');
    setText(editing?.text ?? '');
    setMode({ kind: 'form', editing });
  }

  async function handleSaveTemplate() {
    if (!name.trim() || !text.trim()) {
      Alert.alert(t('templates.missing_title'), t('templates.missing_body'));
      return;
    }
    if (mode.kind === 'form' && mode.editing) {
      await updateTemplate({ id: mode.editing.id, name: name.trim(), text: text.trim() });
    } else {
      await createTemplate({ name: name.trim(), text: text.trim() });
    }
    await refresh();
    setMode({ kind: 'list' });
  }

  function handleDeleteTemplate(template: MessageTemplate) {
    Alert.alert(t('templates.delete_title'), t('templates.delete_body', { name: template.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteTemplate(template.id);
          await refresh();
        },
      },
    ]);
  }

  const container = [styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }];

  if (mode.kind === 'form') {
    return (
      <View style={container}>
        <Text style={styles.label}>{t('templates.name')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('templates.name_placeholder')}
          placeholderTextColor={theme.color.textMuted}
        />
        <Text style={styles.label}>{t('compose.message')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={text}
          onChangeText={setText}
          maxLength={MESSAGE_MAX_LENGTH}
          multiline
          placeholder={t('templates.message_placeholder')}
          placeholderTextColor={theme.color.textMuted}
        />
        <View style={styles.footer}>
          <SecondaryButton label={t('common.cancel')} onPress={() => setMode({ kind: 'list' })} style={{ flex: 1, minHeight: 56 }} />
          <PrimaryButton label={t('common.save')} onPress={handleSaveTemplate} style={{ flex: 1 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={container}>
      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('templates.empty')}</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable accessibilityRole="button" style={styles.rowInfo} onPress={() => onSelect(item)}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowPreview} numberOfLines={1}>
                {item.text}
              </Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => openForm(item)} style={styles.action}>
              <Text style={styles.linkText}>{t('menu.edit')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => handleDeleteTemplate(item)} style={styles.action}>
              <Text style={styles.deleteText}>{t('common.delete')}</Text>
            </Pressable>
          </View>
        )}
      />
      <View style={styles.footer}>
        <SecondaryButton label={t('common.close')} onPress={onClose} style={{ flex: 1, minHeight: 56 }} />
        <PrimaryButton label={t('templates.new')} onPress={() => openForm(null)} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  const c = theme.color;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, paddingHorizontal: 20 },
    label: { fontFamily: theme.font.body(600), fontSize: 15, color: c.text, marginTop: 14 },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      color: c.text,
      fontFamily: theme.font.body(400),
      fontSize: 15,
      borderRadius: theme.radius.input,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginTop: 6,
    },
    textArea: { minHeight: 110, textAlignVertical: 'top', lineHeight: 22 },
    emptyText: { textAlign: 'center', fontFamily: theme.font.body(400), color: c.textMuted, marginTop: 40 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    rowInfo: { flex: 1, minHeight: 44, justifyContent: 'center' },
    rowName: { fontFamily: theme.font.body(600), fontSize: 15, color: c.text },
    rowPreview: { fontFamily: theme.font.body(400), fontSize: 13, color: c.textMuted, marginTop: 2 },
    action: { minHeight: 44, minWidth: 44, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
    linkText: { fontFamily: theme.font.body(600), color: c.primary },
    deleteText: { fontFamily: theme.font.body(600), color: c.danger },
    footer: { flexDirection: 'row', gap: 12, paddingTop: 16, marginTop: 'auto' },
  });
}
