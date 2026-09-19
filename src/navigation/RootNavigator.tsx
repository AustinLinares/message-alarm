import { createNavigationContainerRef, NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { handleNotificationTap } from '../features/scheduledMessages/alarmHandler';
import { OccurrenceScreen } from '../features/scheduledMessages/OccurrenceScreen';
import { ScheduledMessageFormScreen } from '../features/scheduledMessages/ScheduledMessageFormScreen';
import { ScheduledMessagesListScreen } from '../features/scheduledMessages/ScheduledMessagesListScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';

export type RootStackParamList = {
  ScheduledMessagesList: undefined;
  ScheduledMessageForm: { scheduledMessageId?: string };
  Occurrence: { occurrenceId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

function extractScheduledMessageId(data: Record<string, unknown> | undefined): string | null {
  return typeof data?.scheduledMessageId === 'string' ? data.scheduledMessageId : null;
}

// Registered inside the container so the ref is already attached by the time
// this effect runs (a cold start from a notification tap needs it right away).
function useNotificationNavigation() {
  useEffect(() => {
    async function openOccurrence(scheduledMessageId: string) {
      const occurrenceId = await handleNotificationTap(scheduledMessageId);
      if (occurrenceId) {
        navigationRef.navigate('Occurrence', { occurrenceId });
      }
    }

    const lastResponse = Notifications.getLastNotificationResponse();
    const coldStartId = extractScheduledMessageId(lastResponse?.notification.request.content.data);
    if (coldStartId) void openOccurrence(coldStartId);

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const scheduledMessageId = extractScheduledMessageId(response.notification.request.content.data);
      if (scheduledMessageId) void openOccurrence(scheduledMessageId);
    });
    return () => subscription.remove();
  }, []);
}

function HeaderLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={{ color: '#128C7E', fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function ListHeaderActions() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <>
      <HeaderLink label="+ Nuevo" onPress={() => navigation.navigate('ScheduledMessageForm', {})} />
      <HeaderLink label="Ajustes" onPress={() => navigation.navigate('Settings')} />
    </>
  );
}

function Navigator() {
  useNotificationNavigation();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ScheduledMessagesList"
        component={ScheduledMessagesListScreen}
        options={{
          title: 'Mensajes programados',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <ListHeaderActions />
            </View>
          ),
        }}
      />
      <Stack.Screen name="ScheduledMessageForm" component={ScheduledMessageFormScreen} />
      <Stack.Screen name="Occurrence" component={OccurrenceScreen} options={{ title: 'Enviar mensaje' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes' }} />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Navigator />
    </NavigationContainer>
  );
}
