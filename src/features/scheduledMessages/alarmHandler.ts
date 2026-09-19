import * as Notifications from 'expo-notifications';
import { scheduleNextOccurrence } from '../../shared/notifications/scheduler';
import { createOccurrence } from './occurrenceRepository';
import { getScheduledMessage } from './repository';

async function handleAlarmFired(scheduledMessageId: string): Promise<void> {
  const message = await getScheduledMessage(scheduledMessageId);
  if (!message) return;
  await createOccurrence(message.id, new Date().toISOString(), message.recipientIds);
  await scheduleNextOccurrence(message);
}

// Fires while the app process is alive (foreground or backgrounded), which
// covers this MVP; see SPEC.md for the Android/iOS background delivery caveats.
export function registerAlarmListener(): () => void {
  const subscription = Notifications.addNotificationReceivedListener((event) => {
    const scheduledMessageId = event.request.content.data?.scheduledMessageId;
    if (typeof scheduledMessageId === 'string') {
      void handleAlarmFired(scheduledMessageId);
    }
  });
  return () => subscription.remove();
}
