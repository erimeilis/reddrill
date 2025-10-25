/**
 * IndexedDB utilities for test scenario storage
 */

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'reddrill-test-scenarios';
const DB_VERSION = 1;
const STORE_NAME = 'scenarios';

export interface TestScenario {
  id?: number;
  templateSlug: string;
  name: string;
  description?: string;
  mergeVars: Record<string, string>;
  globalVars: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('templateSlug', 'templateSlug', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveScenario(scenario: Omit<TestScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const db = await getDB();
  const now = Date.now();
  const id = await db.add(STORE_NAME, {
    ...scenario,
    createdAt: now,
    updatedAt: now,
  });
  return id as number;
}

export async function updateScenario(scenario: TestScenario): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, {
    ...scenario,
    updatedAt: Date.now(),
  });
}

export async function deleteScenario(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function getScenario(id: number): Promise<TestScenario | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function getScenariosByTemplate(templateSlug: string): Promise<TestScenario[]> {
  const db = await getDB();
  const index = db.transaction(STORE_NAME).store.index('templateSlug');
  return index.getAll(templateSlug);
}

export async function getAllScenarios(): Promise<TestScenario[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}
