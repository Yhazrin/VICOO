/**
 * Vicoo Storage
 */

import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'vicoo';
const DB_VERSION = 1;

let db: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('notes')) {
        database.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!database.objectStoreNames.contains('cache')) {
        database.createObjectStore('cache', { keyPath: 'key' });
      }
    }
  });

  return db;
}

export async function saveNote<T>(note: T): Promise<void> {
  const database = await getDB();
  await database.put('notes', note);
}

export async function getNote<T>(id: string): Promise<T | undefined> {
  const database = await getDB();
  return database.get('notes', id);
}

export async function getAllNotes<T>(): Promise<T[]> {
  const database = await getDB();
  return database.getAll('notes');
}

export async function deleteNote(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('notes', id);
}

export async function saveSetting(key: string, value: any): Promise<void> {
  const database = await getDB();
  await database.put('settings', { key, value });
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const database = await getDB();
  const result = await database.get('settings', key);
  return result?.value;
}

export async function clearCache(): Promise<void> {
  const database = await getDB();
  await database.clear('cache');
}

export default {
  saveNote,
  getNote,
  getAllNotes,
  deleteNote,
  saveSetting,
  getSetting,
  clearCache
};
