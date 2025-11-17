import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set as idbSet, del } from 'idb-keyval';
import mandrillClient, { type MandrillTemplate } from '@/lib/api/mandrill';

// Simple hash function for API key
function hashApiKey(apiKey: string): string {
  let hash = 0;
  for (let i = 0; i < apiKey.length; i++) {
    const char = apiKey.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Define the store state
interface MandrillState {
  apiKey: string | null;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  hydrated: boolean;

  // Templates cache
  cachedTemplates: MandrillTemplate[] | null;
  cacheKey: string | null;
  cacheTimestamp: number | null;

  // Actions
  setApiKey: (apiKey: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
  testConnection: () => Promise<void>;
  setCachedTemplates: (templates: MandrillTemplate[]) => void;
  getCachedTemplates: () => MandrillTemplate[] | null;
}

// Simple IndexedDB storage adapter using idb-keyval
const storage = {
  getItem: async (name: string): Promise<string | null> => {
    // Skip storage operations during SSR
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const value = await get(name);
      return value || null;
    } catch (error) {
      console.error(`Error getting item ${name} from IndexedDB:`, error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    // Skip storage operations during SSR
    if (typeof window === 'undefined') {
      return;
    }

    try {
      await idbSet(name, value);
    } catch (error) {
      console.error(`Error setting item ${name} in IndexedDB:`, error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    // Skip storage operations during SSR
    if (typeof window === 'undefined') {
      return;
    }

    try {
      await del(name);
    } catch (error) {
      console.error(`Error removing item ${name} from IndexedDB:`, error);
    }
  }
};

// Create the store with persistence
export const useMandrillStore = create<MandrillState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      isConnected: false,
      loading: false,
      error: null,
      lastUpdated: null,
      hydrated: false,

      // Templates cache
      cachedTemplates: null,
      cacheKey: null,
      cacheTimestamp: null,

      // Get cached templates if they match current API key
      getCachedTemplates: () => {
        const state = get();
        if (!state.apiKey) return null;

        const currentCacheKey = hashApiKey(state.apiKey);

        // Only return cache if it matches the current API key
        if (state.cacheKey === currentCacheKey && state.cachedTemplates) {
          return state.cachedTemplates;
        }

        return null;
      },

      // Set cached templates for current API key
      setCachedTemplates: (templates: MandrillTemplate[]) => {
        const state = get();
        if (!state.apiKey) return;

        const cacheKey = hashApiKey(state.apiKey);

        set({
          cachedTemplates: templates,
          cacheKey,
          cacheTimestamp: Date.now()
        });
      },

      // Test connection with existing API key (via API route)
      testConnection: async () => {
        const { apiKey } = get();
        if (!apiKey) {
          set({ isConnected: false, loading: false });
          return;
        }

        set({ loading: true, error: null });

        try {
          // Test via API route to avoid CORS
          const response = await fetch('/api/mandrill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiKey,
              action: 'validate'
            })
          });

          const result = await response.json();

          if (response.ok && result.success) {
            set({
              isConnected: true,
              loading: false,
              error: null
            });
          } else {
            set({
              isConnected: false,
              loading: false,
              error: null // Don't show error on background test
            });
          }
        } catch (error) {
          console.error('Connection test failed:', error);
          set({
            isConnected: false,
            loading: false,
            error: null // Don't show error on background test
          });
        }
      },

      // Set API key and validate via API route (avoids CORS issues)
      setApiKey: async (apiKey: string) => {
        // Clear any existing state first
        set({
          apiKey: null,
          isConnected: false,
          loading: true,
          error: null
        });

        try {
          // Call API route to validate key (server-side, no CORS issues)
          const response = await fetch('/api/mandrill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiKey,
              action: 'validate'
            })
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to validate API key');
          }

          // Initialize client for future use
          mandrillClient.initialize(apiKey);

          // Only set the API key if validation succeeded
          set({
            apiKey,
            isConnected: true,
            loading: false,
            error: null,
            lastUpdated: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error setting API key:', error);

          const errorMessage = error instanceof Error
            ? error.message
            : 'Invalid API key. Please check your Mandrill API key and try again.';

          // Ensure state is completely cleared on failure
          set({
            apiKey: null,
            isConnected: false,
            loading: false,
            error: errorMessage,
            lastUpdated: null
          });

          // Throw error so caller knows connection failed
          throw new Error(errorMessage);
        }
      },

      // Clear API key (but keep cached templates for next login!)
      clearApiKey: async () => {
        set({
          apiKey: null,
          isConnected: false,
          error: null,
          lastUpdated: null,
          // DON'T clear cached templates - they're keyed by API key hash
          // When user logs back in with same key, cache will be available instantly
        });
      }
    }),
    {
      name: 'mandrill-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        apiKey: state.apiKey,
        lastUpdated: state.lastUpdated,
        cachedTemplates: state.cachedTemplates,
        cacheKey: state.cacheKey,
        cacheTimestamp: state.cacheTimestamp
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, test connection with existing stored API key
        if (state) {
          state.hydrated = true;

          // Test connection with existing stored API key
          if (state.apiKey) {
            state.testConnection();
          }
        }
      }
    }
  )
);
