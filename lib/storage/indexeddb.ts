// IndexedDB utility for caching API key and templates
import { MandrillTemplate } from '@/lib/api/mandrill';

// Define database name and version
const DB_NAME = 'mandrillManager';
const DB_VERSION = 1;

// Define object store names
const STORES = {
  SETTINGS: 'settings',
  TEMPLATES: 'templates'
};

// Define keys for settings store
const SETTINGS_KEYS = {
  API_KEY: 'apiKey'
};

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

// Initialize the database
async function initDB(): Promise<IDBDatabase | null> {
  // Return null if not in browser environment
  if (!isBrowser) {
    console.warn('IndexedDB is not available in this environment');
    return null;
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event);
      reject('Error opening IndexedDB');
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS);
      }

      // Create templates store with slug as key
      if (!db.objectStoreNames.contains(STORES.TEMPLATES)) {
        const templatesStore = db.createObjectStore(STORES.TEMPLATES, { keyPath: 'slug' });
        templatesStore.createIndex('name', 'name', { unique: false });
        templatesStore.createIndex('updated_at', 'updated_at', { unique: false });
      }
    };
  });
}

// Save API key
export async function saveApiKey(apiKey: string): Promise<void> {
  try {
    const db = await initDB();

    // If db is null (not in browser), just return
    if (!db) {
      console.warn('Cannot save API key: IndexedDB not available');
      return;
    }

    const transaction = db.transaction(STORES.SETTINGS, 'readwrite');
    const store = transaction.objectStore(STORES.SETTINGS);

    store.put(apiKey, SETTINGS_KEYS.API_KEY);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = (event) => {
        console.error('Error saving API key:', event);
        reject('Error saving API key');
      };
    });
  } catch (error) {
    console.error('IndexedDB error:', error);
    throw error;
  }
}

// Get API key
export async function getApiKey(): Promise<string | null> {
  try {
    const db = await initDB();

    // If db is null (not in browser), return null
    if (!db) {
      console.warn('Cannot get API key: IndexedDB not available');
      return null;
    }

    const transaction = db.transaction(STORES.SETTINGS, 'readonly');
    const store = transaction.objectStore(STORES.SETTINGS);

    const request = store.get(SETTINGS_KEYS.API_KEY);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result || null);
      };

      request.onerror = (event) => {
        console.error('Error getting API key:', event);
        reject('Error getting API key');
      };
    });
  } catch (error) {
    console.error('IndexedDB error:', error);
    return null;
  }
}

// Save templates
export async function saveTemplates(templates: MandrillTemplate[]): Promise<void> {
  try {
    const db = await initDB();

    // If db is null (not in browser), just return
    if (!db) {
      console.warn('Cannot save templates: IndexedDB not available');
      return;
    }

    const transaction = db.transaction(STORES.TEMPLATES, 'readwrite');
    const store = transaction.objectStore(STORES.TEMPLATES);

    // Clear existing templates
    store.clear();

    // Add new templates
    templates.forEach(template => {
      store.add(template);
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = (event) => {
        console.error('Error saving templates:', event);
        reject('Error saving templates');
      };
    });
  } catch (error) {
    console.error('IndexedDB error:', error);
    throw error;
  }
}

// Get templates
export async function getTemplates(): Promise<MandrillTemplate[]> {
  try {
    const db = await initDB();

    // If db is null (not in browser), return empty array
    if (!db) {
      console.warn('Cannot get templates: IndexedDB not available');
      return [];
    }

    const transaction = db.transaction(STORES.TEMPLATES, 'readonly');
    const store = transaction.objectStore(STORES.TEMPLATES);

    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result || []);
      };

      request.onerror = (event) => {
        console.error('Error getting templates:', event);
        reject('Error getting templates');
      };
    });
  } catch (error) {
    console.error('IndexedDB error:', error);
    return [];
  }
}

// Get last updated timestamp
export async function getLastUpdated(): Promise<string | null> {
  try {
    const db = await initDB();

    // If db is null (not in browser), return null
    if (!db) {
      console.warn('Cannot get last updated timestamp: IndexedDB not available');
      return null;
    }

    const transaction = db.transaction(STORES.SETTINGS, 'readonly');
    const store = transaction.objectStore(STORES.SETTINGS);

    const request = store.get('lastUpdated');

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result || null);
      };

      request.onerror = (event) => {
        console.error('Error getting last updated timestamp:', event);
        reject('Error getting last updated timestamp');
      };
    });
  } catch (error) {
    console.error('IndexedDB error:', error);
    return null;
  }
}

// Save last updated timestamp
export async function saveLastUpdated(): Promise<void> {
  try {
    const db = await initDB();

    // If db is null (not in browser), just return
    if (!db) {
      console.warn('Cannot save last updated timestamp: IndexedDB not available');
      return;
    }

    const transaction = db.transaction(STORES.SETTINGS, 'readwrite');
    const store = transaction.objectStore(STORES.SETTINGS);

    store.put(new Date().toISOString(), 'lastUpdated');

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = (event) => {
        console.error('Error saving last updated timestamp:', event);
        reject('Error saving last updated timestamp');
      };
    });
  } catch (error) {
    console.error('IndexedDB error:', error);
    throw error;
  }
}

// Clear API key (for logout)
export async function clearApiKey(): Promise<void> {
  try {
    const db = await initDB();

    // If db is null (not in browser), just return
    if (!db) {
      console.warn('Cannot clear API key: IndexedDB not available');
      return;
    }

    const transaction = db.transaction(STORES.SETTINGS, 'readwrite');
    const store = transaction.objectStore(STORES.SETTINGS);

    store.delete(SETTINGS_KEYS.API_KEY);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = (event) => {
        console.error('Error clearing API key:', event);
        reject('Error clearing API key');
      };
    });
  } catch (error) {
    console.error('IndexedDB error:', error);
    throw error;
  }
}
