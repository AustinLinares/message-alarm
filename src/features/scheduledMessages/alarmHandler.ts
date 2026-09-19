import { scheduleNextOccurrence } from '../../shared/notifications/scheduler';
import { createOccurrence, listOccurrencesForMessage } from './occurrenceRepository';
import { getScheduledMessage } from './repository';
import type { MessageOccurrence, ScheduledMessage } from '../../shared/types';

// A local notification only reaches JS when the app is alive to receive it
// or the user taps it (which relaunches the app). So occurrences are created
// here, on tap, instead of on a 'received' event that a killed app would miss.
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

async function getOrCreateOccurrence(message: ScheduledMessage): Promise<MessageOccurrence> {
  const occurrences = await listOccurrencesForMessage(message.id);
  const recent = occurrences.find((occurrence) => Date.now() - new Date(occurrence.firedAt).getTime() < DEDUPE_WINDOW_MS);
  if (recent) return recent;
  return createOccurrence(message.id, new Date().toISOString(), message.recipientIds);
}

// Called when the user taps a scheduled message's alarm notification.
// Returns the occurrence id to navigate to, or null if the message was
// deleted after the notification was scheduled.
export async function handleNotificationTap(scheduledMessageId: string): Promise<string | null> {
  const message = await getScheduledMessage(scheduledMessageId);
  if (!message) return null;
  const occurrence = await getOrCreateOccurrence(message);
  await scheduleNextOccurrence(message);
  return occurrence.id;
}
