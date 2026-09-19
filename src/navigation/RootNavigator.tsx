import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { handleNotificationTap } from '../features/scheduledMessages/alarmHandler';
import { CreateScheduledMessageScreen } from '../features/scheduledMessages/CreateScheduledMessageScreen';
import { OccurrenceScreen } from '../features/scheduledMessages/OccurrenceScreen';

export type RootStackParamList = {
  CreateScheduledMessage: undefined;
  Occurrence: { occurrenceId: string };
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

function Navigator() {
  useNotificationNavigation();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CreateScheduledMessage"
        component={CreateScheduledMessageScreen}
        options={{ title: 'Nuevo mensaje' }}
      />
      <Stack.Screen name="Occurrence" component={OccurrenceScreen} options={{ title: 'Enviar mensaje' }} />
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
