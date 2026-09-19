import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { MessageTemplate } from '../../shared/types';
import { createTemplate, deleteTemplate, listTemplates, updateTemplate } from './repository';

interface TemplatePickerProps {
  onSelect: (template: MessageTemplate) => void;
  onClose: () => void;
}

type Mode = { kind: 'list' } | { kind: 'form'; editing: MessageTemplate | null };

export function TemplatePicker({ onSelect, onClose }: TemplatePickerProps) {
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
      Alert.alert('Faltan datos', 'Escribe un nombre y el texto de la plantilla.');
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
    Alert.alert('Eliminar plantilla', `¿Eliminar "${template.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteTemplate(template.id);
          await refresh();
        },
      },
    ]);
  }

  if (mode.kind === 'form') {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej. Recordatorio de pago" />
        <Text style={styles.label}>Mensaje</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Escribe el mensaje de la plantilla..."
        />
        <View style={styles.footer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setMode({ kind: 'list' })}>
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveTemplate}>
            <Text style={styles.primaryButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Aún no tienes plantillas.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TouchableOpacity style={styles.rowInfo} onPress={() => onSelect(item)}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowPreview} numberOfLines={1}>
                {item.text}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openForm(item)}>
              <Text style={styles.linkText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteTemplate(item)}>
              <Text style={styles.deleteText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
          <Text style={styles.secondaryButtonText}>Cerrar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={() => openForm(null)}>
          <Text style={styles.primaryButtonText}>+ Nueva plantilla</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginTop: 4 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600' },
  rowPreview: { fontSize: 13, color: '#777', marginTop: 2 },
  linkText: { color: '#128C7E', fontWeight: '600' },
  deleteText: { color: '#d33', fontWeight: '600' },
  footer: { flexDirection: 'row', gap: 12, paddingTop: 16, marginTop: 'auto' },
  primaryButton: { flex: 1, backgroundColor: '#25D366', borderRadius: 8, padding: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { flex: 1, backgroundColor: '#eee', borderRadius: 8, padding: 14, alignItems: 'center' },
  secondaryButtonText: { color: '#333', fontWeight: '600' },
});
