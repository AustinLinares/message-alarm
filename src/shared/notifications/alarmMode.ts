import { listScheduledMessages } from '../../features/scheduledMessages/repository';
import { loadSettings, saveSettings } from '../settings/repository';
import { scheduleNextOccurrence } from './scheduler';

// Persists the choice, then re-schedules every pending alarm: a notification
// keeps the channel it was scheduled on, so existing ones must be replaced.
export async function applyAlarmMode(enabled: boolean): Promise<void> {
  await saveSettings({ ...(await loadSettings()), alarmMode: enabled });
  const messages = await listScheduledMessages();
  for (const message of messages) {
    await scheduleNextOccurrence(message);
  }
}
