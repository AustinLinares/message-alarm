import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { migrate } from './schema';

const DB_NAME = 'message-alarm.db';

let dbPromise: Promise<SQLiteDatabase> | null = null;

// Single shared connection, opened and migrated once per app lifetime.
export function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(DB_NAME).then(async (db) => {
      await migrate(db);
      return db;
    });
  }
  return dbPromise;
}
