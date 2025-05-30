import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { MandrillTemplate, MandrillTemplateInfo } from '@/lib/api/mandrill';
import mandrillClient from '@/lib/api/mandrill';
import { getTemplates, saveTemplates, getApiKey, saveApiKey } from '@/lib/storage/indexeddb';

// Define the store state type
interface TemplateState {
  templates: MandrillTemplate[];
  apiKey: string | null;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // Actions
  setApiKey: (apiKey: string) => Promise<void>;
  fetchTemplates: () => Promise<void>;
  getTemplateBySlug: (slug: string) => MandrillTemplate | undefined;
  getTemplateInfo: (name: string) => Promise<MandrillTemplateInfo>;
  updateTemplate: (
    name: string, 
    code?: string, 
    subject?: string, 
    fromEmail?: string, 
    fromName?: string, 
    text?: string,
    labels?: string[]
  ) => Promise<MandrillTemplate>;
  addTemplate: (
    name: string, 
    code?: string, 
    subject?: string, 
    fromEmail?: string, 
    fromName?: string, 
    text?: string,
    labels?: string[]
  ) => Promise<MandrillTemplate>;
  deleteTemplate: (name: string) => Promise<MandrillTemplate>;
  clearApiKey: () => Promise<void>;
}

// Custom storage for IndexedDB using idb-keyval
const indexedDBStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      // For templates, use our existing getTemplates function
      if (name === 'templates-storage') {
        const templates = await getTemplates();
        return templates.length > 0 ? JSON.stringify({ state: { templates } }) : null;
      }
      
      // For API key, use our existing getApiKey function
      if (name === 'api-key') {
        const apiKey = await getApiKey();
        return apiKey ? JSON.stringify({ apiKey }) : null;
      }
      
      // For other items, use idb-keyval
      const value = await get(name);
      return value ? JSON.stringify(value) : null;
    } catch (error) {
      console.error(`Error getting item ${name} from IndexedDB:`, error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const parsed = JSON.parse(value);
      
      // For templates, use our existing saveTemplates function
      if (name === 'templates-storage' && parsed.state?.templates) {
        await saveTemplates(parsed.state.templates);
        return;
      }
      
      // For API key, use our existing saveApiKey function
      if (name === 'api-key' && parsed.apiKey) {
        await saveApiKey(parsed.apiKey);
        return;
      }
      
      // For other items, use idb-keyval
      await set(name, parsed);
    } catch (error) {
      console.error(`Error setting item ${name} in IndexedDB:`, error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch (error) {
      console.error(`Error removing item ${name} from IndexedDB:`, error);
    }
  }
};

// Create the store with persistence
export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: [],
      apiKey: null,
      isConnected: false,
      loading: false,
      error: null,
      lastUpdated: null,
      
      // Set API key and initialize Mandrill client
      setApiKey: async (apiKey: string) => {
        set({ loading: true, error: null });
        
        try {
          mandrillClient.initialize(apiKey);
          
          // Fetch templates after setting API key
          const templates = await mandrillClient.listTemplates();
          
          // Save templates to IndexedDB
          await saveTemplates(templates);
          
          // Save API key to IndexedDB
          await saveApiKey(apiKey);
          
          set({ 
            apiKey, 
            templates, 
            isConnected: true, 
            loading: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error setting API key:', error);
          set({ 
            error: 'Failed to connect to Mandrill API. Please check your API key.', 
            loading: false,
            isConnected: false
          });
        }
      },
      
      // Fetch templates from Mandrill API
      fetchTemplates: async () => {
        const { apiKey } = get();
        
        if (!apiKey) {
          set({ error: 'API key not set. Please set an API key first.' });
          return;
        }
        
        set({ loading: true, error: null });
        
        try {
          // Initialize client if not already
          if (!mandrillClient.isInitialized()) {
            mandrillClient.initialize(apiKey);
          }
          
          const templates = await mandrillClient.listTemplates();
          
          // Save templates to IndexedDB
          await saveTemplates(templates);
          
          set({ 
            templates, 
            loading: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error fetching templates:', error);
          set({ 
            error: 'Failed to fetch templates from Mandrill API.', 
            loading: false 
          });
        }
      },
      
      // Get a template by slug
      getTemplateBySlug: (slug: string) => {
        return get().templates.find(template => template.slug === slug);
      },
      
      // Get template info
      getTemplateInfo: async (name: string) => {
        const { apiKey } = get();
        
        if (!apiKey) {
          throw new Error('API key not set. Please set an API key first.');
        }
        
        if (!mandrillClient.isInitialized()) {
          mandrillClient.initialize(apiKey);
        }
        
        return await mandrillClient.getTemplateInfo(name);
      },
      
      // Update template
      updateTemplate: async (
        name: string, 
        code?: string, 
        subject?: string, 
        fromEmail?: string, 
        fromName?: string, 
        text?: string,
        labels?: string[]
      ) => {
        const { apiKey, fetchTemplates } = get();
        
        if (!apiKey) {
          throw new Error('API key not set. Please set an API key first.');
        }
        
        if (!mandrillClient.isInitialized()) {
          mandrillClient.initialize(apiKey);
        }
        
        const updatedTemplate = await mandrillClient.updateTemplate(
          name, code, subject, fromEmail, fromName, text, labels
        );
        
        // Refresh templates after update
        await fetchTemplates();
        
        return updatedTemplate;
      },
      
      // Add template
      addTemplate: async (
        name: string, 
        code?: string, 
        subject?: string, 
        fromEmail?: string, 
        fromName?: string, 
        text?: string,
        labels?: string[]
      ) => {
        const { apiKey, fetchTemplates } = get();
        
        if (!apiKey) {
          throw new Error('API key not set. Please set an API key first.');
        }
        
        if (!mandrillClient.isInitialized()) {
          mandrillClient.initialize(apiKey);
        }
        
        const newTemplate = await mandrillClient.addTemplate(
          name, code, subject, fromEmail, fromName, text, labels
        );
        
        // Refresh templates after adding
        await fetchTemplates();
        
        return newTemplate;
      },
      
      // Delete template
      deleteTemplate: async (name: string) => {
        const { apiKey, fetchTemplates } = get();
        
        if (!apiKey) {
          throw new Error('API key not set. Please set an API key first.');
        }
        
        if (!mandrillClient.isInitialized()) {
          mandrillClient.initialize(apiKey);
        }
        
        const deletedTemplate = await mandrillClient.deleteTemplate(name);
        
        // Refresh templates after deletion
        await fetchTemplates();
        
        return deletedTemplate;
      },
      
      // Clear API key (for logout)
      clearApiKey: async () => {
        await del('api-key');
        set({ apiKey: null, isConnected: false, templates: [] });
      }
    }),
    {
      name: 'templates-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({ 
        templates: state.templates,
        apiKey: state.apiKey,
        isConnected: state.isConnected,
        lastUpdated: state.lastUpdated
      }),
    }
  )
);