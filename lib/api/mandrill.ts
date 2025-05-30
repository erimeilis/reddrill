import mailchimp from '@mailchimp/mailchimp_transactional';

// Define type for Mandrill client
type MandrillApiClient = {
  templates: {
    list: () => Promise<MandrillTemplate[]>;
    info: (params: { name: string }) => Promise<MandrillTemplateInfo>;
    update: (params: {
      name: string;
      code?: string;
      subject?: string;
      from_email?: string;
      from_name?: string;
      text?: string;
      labels?: string[];
    }) => Promise<MandrillTemplate>;
    add: (params: {
      name: string;
      code?: string;
      subject?: string;
      from_email?: string;
      from_name?: string;
      text?: string;
      labels?: string[];
    }) => Promise<MandrillTemplate>;
    delete: (params: { name: string }) => Promise<MandrillTemplate>;
  };
};

// Types for Mandrill API responses
export interface MandrillTemplate {
  slug: string;
  name: string;
  labels: string[];
  code: string;
  subject: string;
  from_email: string;
  from_name: string;
  text: string;
  publish_name: string;
  publish_code: string;
  publish_subject: string;
  publish_from_email: string;
  publish_from_name: string;
  publish_text: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  draft_updated_at: string;
}

export interface MandrillTemplateInfo extends MandrillTemplate {
  publish_code: string;
}

// Mandrill API client
class MandrillClient {
  private client: MandrillApiClient | null = null;
  private apiKey: string | null = null;

  constructor() {
    // Initialize without API key - will be set later
    this.client = null;
  }

  // Initialize the client with an API key
  initialize(apiKey: string) {
    this.apiKey = apiKey;
    this.client = mailchimp(apiKey);
    return this;
  }

  // Check if the client is initialized
  isInitialized(): boolean {
    return !!this.client;
  }

  // Get the current API key
  getApiKey(): string | null {
    return this.apiKey;
  }

  // List all templates
  async listTemplates(): Promise<MandrillTemplate[]> {
    if (!this.isInitialized()) {
      throw new Error('Mandrill client not initialized. Please set API key first.');
    }

    try {
      return await this.client!.templates.list();
    } catch (error) {
      console.error('Error listing templates:', error);
      throw error;
    }
  }

  // Get template info
  async getTemplateInfo(name: string): Promise<MandrillTemplateInfo> {
    if (!this.isInitialized()) {
      throw new Error('Mandrill client not initialized. Please set API key first.');
    }

    try {
      return await this.client!.templates.info({ name });
    } catch (error) {
      console.error(`Error getting template info for ${name}:`, error);
      throw error;
    }
  }

  // Update template
  async updateTemplate(
    name: string, 
    code?: string, 
    subject?: string, 
    fromEmail?: string, 
    fromName?: string, 
    text?: string,
    labels?: string[]
  ): Promise<MandrillTemplate> {
    if (!this.isInitialized()) {
      throw new Error('Mandrill client not initialized. Please set API key first.');
    }

    try {
      return await this.client!.templates.update({
        name,
        code,
        subject,
        from_email: fromEmail,
        from_name: fromName,
        text,
        labels
      });
    } catch (error) {
      console.error(`Error updating template ${name}:`, error);
      throw error;
    }
  }

  // Add template
  async addTemplate(
    name: string, 
    code?: string, 
    subject?: string, 
    fromEmail?: string, 
    fromName?: string, 
    text?: string,
    labels?: string[]
  ): Promise<MandrillTemplate> {
    if (!this.isInitialized()) {
      throw new Error('Mandrill client not initialized. Please set API key first.');
    }

    try {
      return await this.client!.templates.add({
        name,
        code,
        subject,
        from_email: fromEmail,
        from_name: fromName,
        text,
        labels
      });
    } catch (error) {
      console.error(`Error adding template ${name}:`, error);
      throw error;
    }
  }

  // Delete template
  async deleteTemplate(name: string): Promise<MandrillTemplate> {
    if (!this.isInitialized()) {
      throw new Error('Mandrill client not initialized. Please set API key first.');
    }

    try {
      return await this.client!.templates.delete({ name });
    } catch (error) {
      console.error(`Error deleting template ${name}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
const mandrillClient = new MandrillClient();

export default mandrillClient;
