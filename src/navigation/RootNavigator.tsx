import {
  createNavigationContainerRef,
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useEffect, useMemo } from 'react';
import { AboutScreen } from '../features/about/AboutScreen';
import { handleNotificationTap } from '../features/scheduledMessages/alarmHandler';
import { OccurrenceScreen } from '../features/scheduledMessages/OccurrenceScreen';
import { ScheduledMessageFormScreen } from '../features/scheduledMessages/ScheduledMessageFormScreen';
import { ScheduledMessagesListScreen } from '../features/scheduledMessages/ScheduledMessagesListScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { useTheme } from '../shared/theme/ThemeProvider';

export type RootStackParamList = {
  ScheduledMessagesList: undefined;
  ScheduledMessageForm: { scheduledMessageId?: string; duplicateFromId?: string };
  Occurrence: { occurrenceId: string };
  Settings: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

function readString(data: Record<string, unknown> | undefined, key: string): string | null {
  const value = data?.[key];
  return typeof value === 'string' ? value : null;
}

// Registered inside the container so the ref is already attached by the time
// this effect runs (a cold start from a notification tap needs it right away).
function useNotificationNavigation() {
  useEffect(() => {
    async function openOccurrence(data: Record<string, unknown> | undefined) {
      const scheduledMessageId = readString(data, 'scheduledMessageId');
      if (!scheduledMessageId) return;
      const occurrenceId = await handleNotificationTap(scheduledMessageId, readString(data, 'occurrenceId'));
      if (occurrenceId) {
        navigationRef.navigate('Occurrence', { occurrenceId });
      }
    }

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) void openOccurrence(lastResponse.notification.request.content.data);

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      void openOccurrence(response.notification.request.content.data);
    });
    return () => subscription.remove();
  }, []);
}

function Navigator() {
  const theme = useTheme();
  useNotificationNavigation();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.color.background } }}>
      <Stack.Screen name="ScheduledMessagesList" component={ScheduledMessagesListScreen} />
      <Stack.Screen name="ScheduledMessageForm" component={ScheduledMessageFormScreen} />
      <Stack.Screen name="Occurrence" component={OccurrenceScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const theme = useTheme();
  const navigationTheme = useMemo<NavigationTheme>(() => {
    const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: theme.color.background,
        card: theme.color.surface,
        text: theme.color.text,
        border: theme.color.border,
        primary: theme.color.primary,
      },
    };
  }, [theme]);

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <Navigator />
    </NavigationContainer>
  );
}
