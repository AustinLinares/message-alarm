import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '../../shared/db/client';
import { generateId } from '../../shared/utils/id';
import type { RecurrenceType, ScheduledMessage } from '../../shared/types';
import { sanitizeWhatsAppApp } from '../../shared/whatsapp';

interface ScheduledMessageRow {
  id: string;
  text: string;
  template_id: string | null;
  start_at: string;
  recurrence_type: RecurrenceType;
  recurrence_days_of_week: string | null;
  is_active: number;
  whatsapp_app: string | null;
}

function mapRow(row: ScheduledMessageRow, recipientIds: string[]): ScheduledMessage {
  return {
    id: row.id,
    text: row.text,
    templateId: row.template_id ?? undefined,
    recipientIds,
    startAt: row.start_at,
    recurrence: {
      type: row.recurrence_type,
      daysOfWeek: row.recurrence_days_of_week ? JSON.parse(row.recurrence_days_of_week) : undefined,
    },
    isActive: row.is_active === 1,
    whatsappApp: sanitizeWhatsAppApp(row.whatsapp_app),
  };
}

async function getRecipientIds(db: SQLiteDatabase, scheduledMessageId: string): Promise<string[]> {
  const rows = await db.getAllAsync<{ contact_id: string }>(
    'SELECT contact_id FROM scheduled_message_recipients WHERE scheduled_message_id = ?;',
    scheduledMessageId
  );
  return rows.map((row) => row.contact_id);
}

async function replaceRecipients(
  db: SQLiteDatabase,
  scheduledMessageId: string,
  recipientIds: string[]
): Promise<void> {
  await db.runAsync(
    'DELETE FROM scheduled_message_recipients WHERE scheduled_message_id = ?;',
    scheduledMessageId
  );
  for (const contactId of recipientIds) {
    await db.runAsync(
      'INSERT INTO scheduled_message_recipients (scheduled_message_id, contact_id) VALUES (?, ?);',
      scheduledMessageId,
      contactId
    );
  }
}

export async function createScheduledMessage(input: Omit<ScheduledMessage, 'id'>): Promise<ScheduledMessage> {
  const db = await getDb();
  const id = generateId();
  await db.runAsync(
    `INSERT INTO scheduled_messages
      (id, text, template_id, start_at, recurrence_type, recurrence_days_of_week, is_active, whatsapp_app)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    id,
    input.text,
    input.templateId ?? null,
    input.startAt,
    input.recurrence.type,
    input.recurrence.daysOfWeek ? JSON.stringify(input.recurrence.daysOfWeek) : null,
    input.isActive ? 1 : 0,
    input.whatsappApp
  );
  await replaceRecipients(db, id, input.recipientIds);
  return { id, ...input };
}

export async function listScheduledMessages(): Promise<ScheduledMessage[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ScheduledMessageRow>('SELECT * FROM scheduled_messages ORDER BY start_at;');
  const messages: ScheduledMessage[] = [];
  for (const row of rows) {
    messages.push(mapRow(row, await getRecipientIds(db, row.id)));
  }
  return messages;
}

export async function getScheduledMessage(id: string): Promise<ScheduledMessage | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ScheduledMessageRow>('SELECT * FROM scheduled_messages WHERE id = ?;', id);
  if (!row) return null;
  return mapRow(row, await getRecipientIds(db, row.id));
}

export async function updateScheduledMessage(message: ScheduledMessage): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE scheduled_messages
     SET text = ?, template_id = ?, start_at = ?, recurrence_type = ?, recurrence_days_of_week = ?, is_active = ?, whatsapp_app = ?
     WHERE id = ?;`,
    message.text,
    message.templateId ?? null,
    message.startAt,
    message.recurrence.type,
    message.recurrence.daysOfWeek ? JSON.stringify(message.recurrence.daysOfWeek) : null,
    message.isActive ? 1 : 0,
    message.whatsappApp,
    message.id
  );
  await replaceRecipients(db, message.id, message.recipientIds);
}

export async function deleteScheduledMessage(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM scheduled_messages WHERE id = ?;', id);
}
