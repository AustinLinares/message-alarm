import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { translate } from '../i18n';
import { loadSettings } from '../settings/repository';
import type { ScheduledMessage } from '../types';
import { computeNextOccurrence } from './computeNextOccurrence';
import { clearNotificationLink, getNotificationLink, setNotificationLink } from './notificationLinkRepository';

// Plain notification sound (default). The "stream" channel plays on Android's
// alarm audio stream instead; it is used when the user turns on alarm mode.
export const ALARM_CHANNEL_ID = 'alarms';
export const ALARM_STREAM_CHANNEL_ID = 'alarms-stream';

async function currentChannelId(): Promise<string> {
  return (await loadSettings()).alarmMode ? ALARM_STREAM_CHANNEL_ID : ALARM_CHANNEL_ID;
}

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
    name: translate('notification.channel'),
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
  // Channel audio settings can't be changed once created, hence a second channel.
  await Notifications.setNotificationChannelAsync(ALARM_STREAM_CHANNEL_ID, {
    name: translate('notification.channel_alarm'),
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    vibrationPattern: [0, 500, 250, 500],
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

  const channelId = await currentChannelId();
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: translate('notification.title'),
      body: message.text,
      sound: 'default',
      data: { scheduledMessageId: message.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextFireAt,
      channelId,
    },
  });
  await setNotificationLink(message.id, notificationId);
}

export const SNOOZE_MINUTES = 10;

// One-off reminder that reopens the same occurrence. It is not linked to the
// message's regular alarm, so editing or pausing the message doesn't cancel it.
export async function scheduleSnooze(message: ScheduledMessage, occurrenceId: string): Promise<void> {
  const channelId = await currentChannelId();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: translate('notification.title'),
      body: message.text,
      sound: 'default',
      data: { scheduledMessageId: message.id, occurrenceId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(Date.now() + SNOOZE_MINUTES * 60 * 1000),
      channelId,
    },
  });
}
