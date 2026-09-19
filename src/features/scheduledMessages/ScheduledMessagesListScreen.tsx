import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { computeNextOccurrence } from '../../shared/notifications/computeNextOccurrence';
import { DAY_LABELS } from '../../shared/dayLabels';
import type { ScheduledMessage } from '../../shared/types';
import { listScheduledMessages } from './repository';
import { deleteScheduledMessage, updateScheduledMessage } from './service';

function describeRecurrence(message: ScheduledMessage): string {
  if (message.recurrence.type === 'none') return 'Una vez';
  if (message.recurrence.type === 'daily') return 'Diaria';
  const days = (message.recurrence.daysOfWeek ?? []).map((day) => DAY_LABELS[day]).join(', ');
  return `Semanal (${days})`;
}

function describeNextRun(message: ScheduledMessage): string {
  if (!message.isActive) return 'Pausado';
  const next = computeNextOccurrence(message.recurrence, new Date(message.startAt), new Date());
  if (!next) return 'Sin próxima fecha';
  return next.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export function ScheduledMessagesListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);

  const load = useCallback(async () => {
    setMessages(await listScheduledMessages());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function handleToggleActive(message: ScheduledMessage, isActive: boolean) {
    await updateScheduledMessage({ ...message, isActive });
    void load();
  }

  function handleDelete(message: ScheduledMessage) {
    Alert.alert('Eliminar mensaje', '¿Eliminar este mensaje programado?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteScheduledMessage(message.id);
          void load();
        },
      },
    ]);
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={messages}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aún no tienes mensajes programados.</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('ScheduledMessageForm', {})}
          >
            <Text style={styles.primaryButtonText}>Crear el primero</Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardInfo}
            onPress={() => navigation.navigate('ScheduledMessageForm', { scheduledMessageId: item.id })}
          >
            <Text style={styles.cardText} numberOfLines={1}>
              {item.text}
            </Text>
            <Text style={styles.cardMeta}>
              {describeRecurrence(item)} · {describeNextRun(item)} · {item.recipientIds.length} destinatario(s)
            </Text>
          </TouchableOpacity>
          <Switch value={item.isActive} onValueChange={(value) => handleToggleActive(item, value)} />
          <TouchableOpacity onPress={() => handleDelete(item)}>
            <Text style={styles.deleteText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 60 },
  emptyText: { color: '#999', fontSize: 15 },
  primaryButton: { backgroundColor: '#25D366', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardInfo: { flex: 1 },
  cardText: { fontSize: 15, fontWeight: '600' },
  cardMeta: { fontSize: 12, color: '#777', marginTop: 2 },
  deleteText: { color: '#d33', fontWeight: '600', fontSize: 13 },
});
