import { getDb } from '../db/client';

export async function setNotificationLink(scheduledMessageId: string, notificationId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO scheduled_message_notifications (scheduled_message_id, notification_id)
     VALUES (?, ?)
     ON CONFLICT(scheduled_message_id) DO UPDATE SET notification_id = excluded.notification_id;`,
    scheduledMessageId,
    notificationId
  );
}

export async function getNotificationLink(scheduledMessageId: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ notification_id: string }>(
    'SELECT notification_id FROM scheduled_message_notifications WHERE scheduled_message_id = ?;',
    scheduledMessageId
  );
  return row?.notification_id ?? null;
}

export async function clearNotificationLink(scheduledMessageId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'DELETE FROM scheduled_message_notifications WHERE scheduled_message_id = ?;',
    scheduledMessageId
  );
}
