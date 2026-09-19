import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '../../shared/db/client';
import { generateId } from '../../shared/utils/id';
import type { MessageOccurrence, RecipientStatus } from '../../shared/types';

interface OccurrenceRow {
  id: string;
  scheduled_message_id: string;
  fired_at: string;
}

interface OccurrenceRecipientRow {
  contact_id: string;
  status: RecipientStatus;
}

async function getRecipients(db: SQLiteDatabase, occurrenceId: string) {
  const rows = await db.getAllAsync<OccurrenceRecipientRow>(
    'SELECT contact_id, status FROM occurrence_recipients WHERE occurrence_id = ?;',
    occurrenceId
  );
  return rows.map((row) => ({ contactId: row.contact_id, status: row.status }));
}

function mapRow(row: OccurrenceRow, recipients: MessageOccurrence['recipients']): MessageOccurrence {
  return {
    id: row.id,
    scheduledMessageId: row.scheduled_message_id,
    firedAt: row.fired_at,
    recipients,
  };
}

// Called when a scheduled message's alarm fires, snapshotting its current
// recipients as a fresh 'pending' checklist for this occurrence.
export async function createOccurrence(
  scheduledMessageId: string,
  firedAt: string,
  recipientIds: string[]
): Promise<MessageOccurrence> {
  const db = await getDb();
  const id = generateId();
  await db.runAsync(
    'INSERT INTO message_occurrences (id, scheduled_message_id, fired_at) VALUES (?, ?, ?);',
    id,
    scheduledMessageId,
    firedAt
  );
  for (const contactId of recipientIds) {
    await db.runAsync(
      'INSERT INTO occurrence_recipients (occurrence_id, contact_id, status) VALUES (?, ?, ?);',
      id,
      contactId,
      'pending' satisfies RecipientStatus
    );
  }
  return {
    id,
    scheduledMessageId,
    firedAt,
    recipients: recipientIds.map((contactId) => ({ contactId, status: 'pending' })),
  };
}

export async function getOccurrence(id: string): Promise<MessageOccurrence | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<OccurrenceRow>('SELECT * FROM message_occurrences WHERE id = ?;', id);
  if (!row) return null;
  return mapRow(row, await getRecipients(db, row.id));
}

export async function listOccurrencesForMessage(scheduledMessageId: string): Promise<MessageOccurrence[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<OccurrenceRow>(
    'SELECT * FROM message_occurrences WHERE scheduled_message_id = ? ORDER BY fired_at DESC;',
    scheduledMessageId
  );
  const occurrences: MessageOccurrence[] = [];
  for (const row of rows) {
    occurrences.push(mapRow(row, await getRecipients(db, row.id)));
  }
  return occurrences;
}

export async function setRecipientStatus(
  occurrenceId: string,
  contactId: string,
  status: RecipientStatus
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE occurrence_recipients SET status = ? WHERE occurrence_id = ? AND contact_id = ?;',
    status,
    occurrenceId,
    contactId
  );
}
