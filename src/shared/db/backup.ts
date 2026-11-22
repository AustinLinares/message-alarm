import { loadSettings, sanitizeSettings, type AppSettings } from '../settings/repository';
import { getDb } from './client';

interface ContactRow {
  id: string;
  name: string;
  phone_number: string;
}

interface MessageTemplateRow {
  id: string;
  name: string;
  text: string;
}

interface ScheduledMessageRow {
  id: string;
  text: string;
  template_id: string | null;
  start_at: string;
  recurrence_type: string;
  recurrence_days_of_week: string | null;
  is_active: number;
}

interface ScheduledMessageRecipientRow {
  scheduled_message_id: string;
  contact_id: string;
}

interface MessageOccurrenceRow {
  id: string;
  scheduled_message_id: string;
  fired_at: string;
}

interface OccurrenceRecipientRow {
  occurrence_id: string;
  contact_id: string;
  status: string;
}

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  contacts: ContactRow[];
  messageTemplates: MessageTemplateRow[];
  scheduledMessages: ScheduledMessageRow[];
  scheduledMessageRecipients: ScheduledMessageRecipientRow[];
  messageOccurrences: MessageOccurrenceRow[];
  occurrenceRecipients: OccurrenceRecipientRow[];
  // Added after v1 shipped. Optional so files exported by older app versions
  // still import (they simply don't carry preferences).
  settings?: Partial<AppSettings>;
}

export async function buildBackupPayload(): Promise<BackupPayload> {
  const db = await getDb();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    contacts: await db.getAllAsync<ContactRow>('SELECT * FROM contacts;'),
    messageTemplates: await db.getAllAsync<MessageTemplateRow>('SELECT * FROM message_templates;'),
    scheduledMessages: await db.getAllAsync<ScheduledMessageRow>('SELECT * FROM scheduled_messages;'),
    scheduledMessageRecipients: await db.getAllAsync<ScheduledMessageRecipientRow>(
      'SELECT * FROM scheduled_message_recipients;'
    ),
    messageOccurrences: await db.getAllAsync<MessageOccurrenceRow>('SELECT * FROM message_occurrences;'),
    occurrenceRecipients: await db.getAllAsync<OccurrenceRecipientRow>('SELECT * FROM occurrence_recipients;'),
    settings: await loadSettings(),
  };
}

export function isBackupPayload(value: unknown): value is BackupPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<BackupPayload>;
  return (
    payload.version === 1 &&
    Array.isArray(payload.contacts) &&
    Array.isArray(payload.messageTemplates) &&
    Array.isArray(payload.scheduledMessages) &&
    Array.isArray(payload.scheduledMessageRecipients) &&
    Array.isArray(payload.messageOccurrences) &&
    Array.isArray(payload.occurrenceRecipients)
  );
}

// Replaces all local data with the backup's. Native alarms are not restored
// here — scheduled_message_notifications is wiped since the old native
// notification ids are meaningless after a restore; callers must reschedule
// (see features/settings/backupService.ts).
export async function restoreFromBackupPayload(payload: BackupPayload): Promise<void> {
  const db = await getDb();
  // Missing settings (older backup) keep the current preferences untouched.
  const restoredSettings = payload.settings ? sanitizeSettings(payload.settings, await loadSettings()) : null;
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync(
      [
        'DELETE FROM occurrence_recipients;',
        'DELETE FROM message_occurrences;',
        'DELETE FROM scheduled_message_recipients;',
        'DELETE FROM scheduled_message_notifications;',
        'DELETE FROM scheduled_messages;',
        'DELETE FROM message_templates;',
        'DELETE FROM contacts;',
      ].join('\n')
    );

    for (const row of payload.contacts) {
      await txn.runAsync('INSERT INTO contacts (id, name, phone_number) VALUES (?, ?, ?);', [
        row.id,
        row.name,
        row.phone_number,
      ]);
    }
    for (const row of payload.messageTemplates) {
      await txn.runAsync('INSERT INTO message_templates (id, name, text) VALUES (?, ?, ?);', [
        row.id,
        row.name,
        row.text,
      ]);
    }
    for (const row of payload.scheduledMessages) {
      await txn.runAsync(
        `INSERT INTO scheduled_messages
          (id, text, template_id, start_at, recurrence_type, recurrence_days_of_week, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [row.id, row.text, row.template_id, row.start_at, row.recurrence_type, row.recurrence_days_of_week, row.is_active]
      );
    }
    for (const row of payload.scheduledMessageRecipients) {
      await txn.runAsync(
        'INSERT INTO scheduled_message_recipients (scheduled_message_id, contact_id) VALUES (?, ?);',
        [row.scheduled_message_id, row.contact_id]
      );
    }
    for (const row of payload.messageOccurrences) {
      await txn.runAsync('INSERT INTO message_occurrences (id, scheduled_message_id, fired_at) VALUES (?, ?, ?);', [
        row.id,
        row.scheduled_message_id,
        row.fired_at,
      ]);
    }
    for (const row of payload.occurrenceRecipients) {
      await txn.runAsync(
        'INSERT INTO occurrence_recipients (occurrence_id, contact_id, status) VALUES (?, ?, ?);',
        [row.occurrence_id, row.contact_id, row.status]
      );
    }
    if (restoredSettings) {
      for (const [key, value] of Object.entries(restoredSettings)) {
        await txn.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);', [key, JSON.stringify(value)]);
      }
    }
  });
}
