import type { SQLiteDatabase } from 'expo-sqlite';

// Snapshots of picked contacts (see SPEC.md "Selección de contactos") — not
// synced back to the system address book.
const CREATE_CONTACTS = `
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL
);
`;

const CREATE_MESSAGE_TEMPLATES = `
CREATE TABLE IF NOT EXISTS message_templates (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  text TEXT NOT NULL
);
`;

const CREATE_SCHEDULED_MESSAGES = `
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id TEXT PRIMARY KEY NOT NULL,
  text TEXT NOT NULL,
  template_id TEXT REFERENCES message_templates(id) ON DELETE SET NULL,
  start_at TEXT NOT NULL,
  recurrence_type TEXT NOT NULL DEFAULT 'none',
  recurrence_days_of_week TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);
`;

const CREATE_SCHEDULED_MESSAGE_RECIPIENTS = `
CREATE TABLE IF NOT EXISTS scheduled_message_recipients (
  scheduled_message_id TEXT NOT NULL REFERENCES scheduled_messages(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  PRIMARY KEY (scheduled_message_id, contact_id)
);
`;

// One row per alarm firing, so a recurring message's checklist resets each time.
const CREATE_MESSAGE_OCCURRENCES = `
CREATE TABLE IF NOT EXISTS message_occurrences (
  id TEXT PRIMARY KEY NOT NULL,
  scheduled_message_id TEXT NOT NULL REFERENCES scheduled_messages(id) ON DELETE CASCADE,
  fired_at TEXT NOT NULL
);
`;

const CREATE_OCCURRENCE_RECIPIENTS = `
CREATE TABLE IF NOT EXISTS occurrence_recipients (
  occurrence_id TEXT NOT NULL REFERENCES message_occurrences(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  PRIMARY KEY (occurrence_id, contact_id)
);
`;

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(
    [
      CREATE_CONTACTS,
      CREATE_MESSAGE_TEMPLATES,
      CREATE_SCHEDULED_MESSAGES,
      CREATE_SCHEDULED_MESSAGE_RECIPIENTS,
      CREATE_MESSAGE_OCCURRENCES,
      CREATE_OCCURRENCE_RECIPIENTS,
    ].join('\n')
  );
}
