/**
 * IndexedDB utilities for translation settings storage
 * Stores provider settings and translation cache client-side
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TranslationSettingsDB extends DBSchema {
  'translation-providers': {
    key: string; // provider name
    value: {
      provider: string;
      apiKey?: string;
      apiEndpoint?: string;
      projectId?: string;
      isActive: boolean;
      isPrimary: boolean;
      priority: number;
      updatedAt: string;
    };
  };
  'translation-cache': {
    key: string; // hash of source+lang
    value: {
      sourceHash: string;
      sourceLang: string;
      targetLang: string;
      provider: string;
      translatedText: string;
      createdAt: string;
    };
    indexes: { 'by-lang': [string, string] };
  };
}

let db: IDBPDatabase<TranslationSettingsDB> | null = null;

export async function getTranslationDB() {
  if (db) return db;

  db = await openDB<TranslationSettingsDB>('translation-settings', 1, {
    upgrade(db) {
      // Providers store
      if (!db.objectStoreNames.contains('translation-providers')) {
        db.createObjectStore('translation-providers', { keyPath: 'provider' });
      }

      // Cache store
      if (!db.objectStoreNames.contains('translation-cache')) {
        const cacheStore = db.createObjectStore('translation-cache', {
          keyPath: 'sourceHash'
        });
        cacheStore.createIndex('by-lang', ['sourceLang', 'targetLang']);
      }
    }
  });

  return db;
}

// Provider settings operations
export async function saveProviderSettings(settings: {
  provider: string;
  apiKey?: string;
  apiEndpoint?: string;
  projectId?: string;
  isPrimary?: boolean;
}) {
  const db = await getTranslationDB();

  // If setting as primary, unset others
  if (settings.isPrimary) {
    const allProviders = await db.getAll('translation-providers');
    for (const p of allProviders) {
      if (p.provider !== settings.provider) {
        await db.put('translation-providers', { ...p, isPrimary: false });
      }
    }
  }

  await db.put('translation-providers', {
    provider: settings.provider,
    apiKey: settings.apiKey,
    apiEndpoint: settings.apiEndpoint,
    projectId: settings.projectId,
    isActive: true,
    isPrimary: settings.isPrimary ?? false,
    priority: 0,
    updatedAt: new Date().toISOString()
  });
}

export async function getProviderSettings(provider: string) {
  const db = await getTranslationDB();
  return await db.get('translation-providers', provider);
}

export async function getAllProviders() {
  const db = await getTranslationDB();
  return await db.getAll('translation-providers');
}

export async function getPrimaryProvider() {
  const db = await getTranslationDB();
  const allProviders = await db.getAll('translation-providers');
  const primary = allProviders.find(p => p.isPrimary) || allProviders[0];

  // Default to Cloudflare if no provider is configured
  if (!primary) {
    return {
      provider: 'cloudflare',
      isActive: true,
      isPrimary: true,
      priority: 0,
      updatedAt: new Date().toISOString()
    };
  }

  return primary;
}

export async function setPrimaryProvider(provider: string) {
  const db = await getTranslationDB();

  // Unset all other providers as primary
  const allProviders = await db.getAll('translation-providers');
  for (const p of allProviders) {
    await db.put('translation-providers', { ...p, isPrimary: p.provider === provider });
  }
}

export async function deleteProvider(provider: string) {
  const db = await getTranslationDB();
  await db.delete('translation-providers', provider);
}

// Translation cache operations
export async function getCachedTranslation(
  sourceHash: string
): Promise<string | null> {
  const db = await getTranslationDB();
  const cached = await db.get('translation-cache', sourceHash);
  return cached?.translatedText ?? null;
}

export async function cacheTranslation(
  sourceHash: string,
  sourceLang: string,
  targetLang: string,
  provider: string,
  translatedText: string
) {
  const db = await getTranslationDB();
  await db.put('translation-cache', {
    sourceHash,
    sourceLang,
    targetLang,
    provider,
    translatedText,
    createdAt: new Date().toISOString()
  });
}

// Utility function to create hash for caching
export function createSourceHash(text: string, sourceLang: string, targetLang: string): string {
  // Simple hash function - in production, use a proper hash library
  const str = `${text}|${sourceLang}|${targetLang}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}
