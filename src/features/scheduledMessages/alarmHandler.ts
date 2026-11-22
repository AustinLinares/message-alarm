import { scheduleNextOccurrence } from '../../shared/notifications/scheduler';
import { createOccurrence, getOccurrence, listOccurrencesForMessage } from './occurrenceRepository';
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
// deleted after the notification was scheduled. A snoozed notification carries
// the occurrence it came from, so reopening it keeps the recipients' progress.
export async function handleNotificationTap(
  scheduledMessageId: string,
  snoozedOccurrenceId?: string | null
): Promise<string | null> {
  const message = await getScheduledMessage(scheduledMessageId);
  if (!message) return null;
  if (snoozedOccurrenceId && (await getOccurrence(snoozedOccurrenceId))) return snoozedOccurrenceId;
  const occurrence = await getOrCreateOccurrence(message);
  await scheduleNextOccurrence(message);
  return occurrence.id;
}

// "Send now" from the home screen: opens the alarm screen immediately without
// touching the message's regular schedule.
export async function startOccurrenceNow(scheduledMessageId: string): Promise<string | null> {
  const message = await getScheduledMessage(scheduledMessageId);
  if (!message) return null;
  return (await getOrCreateOccurrence(message)).id;
}
