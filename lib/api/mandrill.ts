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
  tags: {
    list: () => Promise<MandrillTag[]>;
    info: (params: { tag: string }) => Promise<MandrillTagInfo>;
    delete: (params: { tag: string }) => Promise<{ tag: string; deleted: boolean }>;
  };
  senders: {
    list: () => Promise<MandrillSender[]>;
    info: (params: { address: string }) => Promise<MandrillSenderInfo>;
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

export interface MandrillTag {
  tag: string;
  reputation: number;
  sent: number;
  hard_bounces: number;
  soft_bounces: number;
  rejects: number;
  complaints: number;
  unsubs: number;
  opens: number;
  clicks: number;
  unique_opens: number;
  unique_clicks: number;
}

export interface MandrillTagInfo extends MandrillTag {
  stats: {
    today: MandrillTagStats;
    last_7_days: MandrillTagStats;
    last_30_days: MandrillTagStats;
    last_60_days: MandrillTagStats;
    last_90_days: MandrillTagStats;
  };
}

export interface MandrillTagStats {
  sent: number;
  hard_bounces: number;
  soft_bounces: number;
  rejects: number;
  complaints: number;
  unsubs: number;
  opens: number;
  clicks: number;
  unique_opens: number;
  unique_clicks: number;
}

export interface MandrillSender {
  address: string;
  created_at: string;
  sent: number;
  hard_bounces: number;
  soft_bounces: number;
  rejects: number;
  complaints: number;
  unsubs: number;
  opens: number;
  clicks: number;
  unique_opens: number;
  unique_clicks: number;
}

export interface MandrillSenderInfo extends MandrillSender {
  stats: {
    today: MandrillSenderStats;
    last_7_days: MandrillSenderStats;
    last_30_days: MandrillSenderStats;
    last_60_days: MandrillSenderStats;
    last_90_days: MandrillSenderStats;
  };
  dkim: {
    signed_by: string | null;
    valid: boolean;
  };
  spf: {
    valid: boolean;
    valid_with_dkim: boolean;
  };
}

export interface MandrillSenderStats {
  sent: number;
  hard_bounces: number;
  soft_bounces: number;
  rejects: number;
  complaints: number;
  unsubs: number;
  opens: number;
  clicks: number;
  unique_opens: number;
  unique_clicks: number;
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
    this.client = mailchimp(apiKey) as MandrillApiClient;
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
      const result = await this.client!.templates.list();

      // The Mandrill client doesn't throw on 401 errors, it returns undefined or error objects
      // We need to check if the result is valid
      if (result === undefined || result === null) {
        throw new Error('Invalid API key - received no response from Mandrill');
      }

      // Check if it's an error response object (not an array)
      if (typeof result === 'object' && !Array.isArray(result)) {
        throw new Error('Invalid API key - Mandrill API rejected the request');
      }

      return result;
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

  // List all tags
  async listTags(): Promise<MandrillTag[]> {
    if (!this.isInitialized()) {
      throw new Error('Mandrill client not initialized. Please set API key first.');
    }

    try {
      return await this.client!.tags.list();
    } catch (error) {
      console.error('Error listing tags:', error);
      throw error;
    }
  }

  // Get tag info
  async getTagInfo(tag: string): Promise<MandrillTagInfo> {
    if (!this.isInitialized()) {
      throw new Error('Mandrill client not initialized. Please set API key first.');
    }

    try {
      return await this.client!.tags.info({ tag });
    } catch (error) {
      console.error(`Error getting tag info for ${tag}:`, error);
      throw error;
    }
  }

  // Delete tag
  async deleteTag(tag: string): Promise<{ tag: string; deleted: boolean }> {
    if (!this.isInitialized()) {
      throw new Error('Mandrill client not initialized. Please set API key first.');
    }

    try {
      return await this.client!.tags.delete({ tag });
    } catch (error) {
      console.error(`Error deleting tag ${tag}:`, error);
      throw error;
    }
  }

  // List all senders
  async listSenders(): Promise<MandrillSender[]> {
    if (!this.isInitialized()) {
      throw new Error('Mandrill client not initialized. Please set API key first.');
    }

    try {
      return await this.client!.senders.list();
    } catch (error) {
      console.error('Error listing senders:', error);
      throw error;
    }
  }

  // Get sender info
  async getSenderInfo(address: string): Promise<MandrillSenderInfo> {
    if (!this.isInitialized()) {
      throw new Error('Mandrill client not initialized. Please set API key first.');
    }

    try {
      return await this.client!.senders.info({ address });
    } catch (error) {
      console.error(`Error getting sender info for ${address}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
const mandrillClient = new MandrillClient();

export default mandrillClient;
