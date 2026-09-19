import { File, Paths } from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import * as Sharing from 'expo-sharing';
import { buildBackupPayload, isBackupPayload, restoreFromBackupPayload } from '../../shared/db/backup';
import { scheduleNextOccurrence } from '../../shared/notifications/scheduler';
import { listScheduledMessages } from '../scheduledMessages/repository';

export async function exportBackup(): Promise<void> {
  const payload = await buildBackupPayload();
  const fileName = `message-alarm-backup-${payload.exportedAt.replace(/[:.]/g, '-')}.json`;
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(payload, null, 2));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri);
  }
}

export type ImportResult = 'imported' | 'canceled' | 'invalid';

export async function importBackup(): Promise<ImportResult> {
  const picked = await File.pickFileAsync({ mimeTypes: 'application/json' });
  if (picked.canceled) return 'canceled';

  const raw = await picked.result.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return 'invalid';
  }
  if (!isBackupPayload(parsed)) return 'invalid';

  await restoreFromBackupPayload(parsed);

  // Old native notification ids are gone with the restore; reschedule from
  // the imported (now current) scheduled messages instead of trusting them.
  await Notifications.cancelAllScheduledNotificationsAsync();
  const messages = await listScheduledMessages();
  for (const message of messages) {
    await scheduleNextOccurrence(message);
  }

  return 'imported';
}
