import { cancelScheduledNotification, scheduleNextOccurrence } from '../../shared/notifications/scheduler';
import type { ScheduledMessage } from '../../shared/types';
import * as repository from './repository';

// Wraps the repository so every write keeps the native alarm in sync,
// instead of leaving that up to each call site.
export async function createScheduledMessage(input: Omit<ScheduledMessage, 'id'>): Promise<ScheduledMessage> {
  const message = await repository.createScheduledMessage(input);
  await scheduleNextOccurrence(message);
  return message;
}

export async function updateScheduledMessage(message: ScheduledMessage): Promise<void> {
  await repository.updateScheduledMessage(message);
  await scheduleNextOccurrence(message);
}

export async function deleteScheduledMessage(id: string): Promise<void> {
  await cancelScheduledNotification(id);
  await repository.deleteScheduledMessage(id);
}
