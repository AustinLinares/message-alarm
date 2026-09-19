import { getDb } from '../../shared/db/client';
import { generateId } from '../../shared/utils/id';
import type { MessageTemplate } from '../../shared/types';

interface MessageTemplateRow {
  id: string;
  name: string;
  text: string;
}

function mapRow(row: MessageTemplateRow): MessageTemplate {
  return { id: row.id, name: row.name, text: row.text };
}

export async function createTemplate(input: Omit<MessageTemplate, 'id'>): Promise<MessageTemplate> {
  const db = await getDb();
  const id = generateId();
  await db.runAsync(
    'INSERT INTO message_templates (id, name, text) VALUES (?, ?, ?);',
    id,
    input.name,
    input.text
  );
  return { id, ...input };
}

export async function listTemplates(): Promise<MessageTemplate[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MessageTemplateRow>('SELECT * FROM message_templates ORDER BY name;');
  return rows.map(mapRow);
}

export async function getTemplate(id: string): Promise<MessageTemplate | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<MessageTemplateRow>('SELECT * FROM message_templates WHERE id = ?;', id);
  return row ? mapRow(row) : null;
}

export async function updateTemplate(template: MessageTemplate): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE message_templates SET name = ?, text = ? WHERE id = ?;',
    template.name,
    template.text,
    template.id
  );
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM message_templates WHERE id = ?;', id);
}
