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

// Links a scheduled message to the single native notification currently
// scheduled for it, so it can be cancelled/replaced when edited or deleted.
const CREATE_SCHEDULED_MESSAGE_NOTIFICATIONS = `
CREATE TABLE IF NOT EXISTS scheduled_message_notifications (
  scheduled_message_id TEXT PRIMARY KEY NOT NULL REFERENCES scheduled_messages(id) ON DELETE CASCADE,
  notification_id TEXT NOT NULL
);
`;

// Local-only app preferences (theme, gradient...). Included in the backup.
const CREATE_APP_SETTINGS = `
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
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
      CREATE_SCHEDULED_MESSAGE_NOTIFICATIONS,
      CREATE_APP_SETTINGS,
    ].join('\n')
  );
  await addColumnIfMissing(db, 'scheduled_messages', 'whatsapp_app', "TEXT NOT NULL DEFAULT 'auto'");
}

// Lightweight migrations for databases created by older versions.
async function addColumnIfMissing(db: SQLiteDatabase, table: string, column: string, definition: string) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table});`);
  if (columns.some((c) => c.name === column)) return;
  await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
}
