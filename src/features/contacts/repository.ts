import { getDb } from '../../shared/db/client';
import { generateId } from '../../shared/utils/id';
import type { Contact } from '../../shared/types';

interface ContactRow {
  id: string;
  name: string;
  phone_number: string;
}

function mapRow(row: ContactRow): Contact {
  return { id: row.id, name: row.name, phoneNumber: row.phone_number };
}

export async function createContact(input: Omit<Contact, 'id'>): Promise<Contact> {
  const db = await getDb();
  const id = generateId();
  await db.runAsync(
    'INSERT INTO contacts (id, name, phone_number) VALUES (?, ?, ?);',
    id,
    input.name,
    input.phoneNumber
  );
  return { id, ...input };
}

export async function listContacts(): Promise<Contact[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ContactRow>('SELECT * FROM contacts ORDER BY name;');
  return rows.map(mapRow);
}

export async function getContact(id: string): Promise<Contact | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ContactRow>('SELECT * FROM contacts WHERE id = ?;', id);
  return row ? mapRow(row) : null;
}

export async function updateContact(contact: Contact): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE contacts SET name = ?, phone_number = ? WHERE id = ?;',
    contact.name,
    contact.phoneNumber,
    contact.id
  );
}

export async function deleteContact(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM contacts WHERE id = ?;', id);
}
