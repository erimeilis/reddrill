import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set as idbSet, del } from 'idb-keyval';
import type { TreeViewMode } from '@/lib/utils/template-tree';

// Define the store state
interface SettingsState {
  // Theme
  theme: 'light' | 'dark';

  // UI Preferences
  sidebarCollapsed: boolean;
  compactMode: boolean;

  // View Preferences
  viewMode: 'table' | 'tree';
  treeMode: TreeViewMode;
  treeExpansions: Record<string, boolean>; // Persisted tree expansion state

  // Last used items (for quick access)
  lastUsedTemplates: string[]; // slugs

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  setViewMode: (mode: 'table' | 'tree') => void;
  setTreeMode: (mode: TreeViewMode) => void;
  setTreeExpansions: (expansions: Record<string, boolean>) => void;
  addLastUsedTemplate: (slug: string) => void;
  clearLastUsedTemplates: () => void;
  setInitialized: () => void;
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

// Detect system theme preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Create the store with persistence
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default values
      theme: getSystemTheme(),
      sidebarCollapsed: false,
      compactMode: false,
      viewMode: 'tree',
      treeMode: 'label-theme-locale',
      treeExpansions: {},
      lastUsedTemplates: [],

      // Set theme
      setTheme: (theme: 'light' | 'dark') => {
        // Update DOM class for Tailwind dark mode
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
        set({ theme });
      },

      // Set sidebar collapsed state
      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },

      // Set compact mode
      setCompactMode: (compact: boolean) => {
        set({ compactMode: compact });
      },

      // Set view mode
      setViewMode: (mode: 'table' | 'tree') => {
        set({ viewMode: mode });
      },

      // Set tree mode
      setTreeMode: (mode: TreeViewMode) => {
        set({ treeMode: mode });
      },

      // Set tree expansions
      setTreeExpansions: (expansions: Record<string, boolean>) => {
        set({ treeExpansions: expansions });
      },

      // Add a template to last used (max 10, newest first)
      addLastUsedTemplate: (slug: string) => {
        set((state) => {
          const filtered = state.lastUsedTemplates.filter(s => s !== slug);
          const updated = [slug, ...filtered].slice(0, 10);
          return { lastUsedTemplates: updated };
        });
      },

      // Clear last used templates
      clearLastUsedTemplates: () => {
        set({ lastUsedTemplates: [] });
      },

      // Set initialized (for initial load)
      setInitialized: () => {
        // This is called after hydration to ensure theme is applied
        set((state) => {
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', state.theme === 'dark');
          }
          return state;
        });
      }
    }),
    {
      name: 'user-settings',
      storage: createJSONStorage(() => storage),
      // Persist everything except initialization state
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        compactMode: state.compactMode,
        viewMode: state.viewMode,
        treeMode: state.treeMode,
        treeExpansions: state.treeExpansions,
        lastUsedTemplates: state.lastUsedTemplates
      })
    }
  )
);
