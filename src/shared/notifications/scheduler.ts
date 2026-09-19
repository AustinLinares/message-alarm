import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { ScheduledMessage } from '../types';
import { computeNextOccurrence } from './computeNextOccurrence';
import { clearNotificationLink, getNotificationLink, setNotificationLink } from './notificationLinkRepository';

export const ALARM_CHANNEL_ID = 'alarms';

export function configureNotificationHandling(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function setupAlarmChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
    name: 'Alarmas de mensajes',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelScheduledNotification(scheduledMessageId: string): Promise<void> {
  const notificationId = await getNotificationLink(scheduledMessageId);
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
  await clearNotificationLink(scheduledMessageId);
}

// Cancels whatever is currently scheduled for this message and schedules the
// next valid occurrence, if any (recurring messages get rescheduled every
// time their alarm fires; see alarmHandler.ts).
export async function scheduleNextOccurrence(message: ScheduledMessage, after: Date = new Date()): Promise<void> {
  await cancelScheduledNotification(message.id);
  if (!message.isActive) return;

  const nextFireAt = computeNextOccurrence(message.recurrence, new Date(message.startAt), after);
  if (!nextFireAt) return;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Mensaje programado',
      body: message.text,
      sound: 'default',
      data: { scheduledMessageId: message.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextFireAt,
      channelId: ALARM_CHANNEL_ID,
    },
  });
  await setNotificationLink(message.id, notificationId);
}
