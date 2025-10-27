/**
 * Audited Mandrill Client Wrapper
 * Wraps MandrillClient to provide transparent audit logging
 */

import type { Database } from '../db/client';
import type { MandrillTemplate } from './mandrill';
import { logTemplateCreate, logTemplateUpdate, logTemplateDelete } from '../services/audit-service';
import { hashApiKey } from '../db/audit-db';

/**
 * Wrapper class that adds audit logging to MandrillClient operations
 * All audit operations are non-blocking - errors don't fail main operations
 */
export class AuditedMandrillClient {
  private apiKeyHash: Promise<string>;

  constructor(
    private mandrillClient: any,
    private db: Database,
    apiKey: string,
    private userContext?: string
  ) {
    this.apiKeyHash = hashApiKey(apiKey);
  }

  /**
   * Pass-through method for template listing (no audit needed)
   */
  async listTemplates(): Promise<MandrillTemplate[]> {
    return this.mandrillClient.listTemplates();
  }

  /**
   * Pass-through method for template info (no audit needed)
   */
  async getTemplateInfo(name: string): Promise<MandrillTemplate> {
    return this.mandrillClient.getTemplateInfo(name);
  }

  /**
   * Add template with audit logging
   */
  async addTemplate(
    name: string,
    code?: string,
    subject?: string,
    fromEmail?: string,
    fromName?: string,
    text?: string,
    labels?: string[]
  ): Promise<MandrillTemplate> {
    // Execute main operation
    const result = await this.mandrillClient.addTemplate(
      name,
      code,
      subject,
      fromEmail,
      fromName,
      text,
      labels
    );

    // Log creation (non-blocking - don't await)
    this.apiKeyHash.then(hash =>
      logTemplateCreate(this.db, hash, result, this.userContext)
    ).catch((error) => {
      console.error('Audit logging failed for template creation:', error);
    });

    return result;
  }

  /**
   * Update template with audit logging
   */
  async updateTemplate(
    name: string,
    code?: string,
    subject?: string,
    fromEmail?: string,
    fromName?: string,
    text?: string,
    labels?: string[]
  ): Promise<MandrillTemplate> {
    // Fetch before state (needed for audit)
    let beforeState: MandrillTemplate | null = null;
    try {
      beforeState = await this.mandrillClient.getTemplateInfo(name);
    } catch (error) {
      console.error('Failed to fetch template before state:', error);
      // Continue with update even if we can't get before state
    }

    // Execute main operation
    const result = await this.mandrillClient.updateTemplate(
      name,
      code,
      subject,
      fromEmail,
      fromName,
      text,
      labels
    );

    // Log update (non-blocking - don't await)
    if (beforeState) {
      this.apiKeyHash.then(hash =>
        logTemplateUpdate(
          this.db,
          hash,
          beforeState,
          result,
          this.userContext
        )
      ).catch((error) => {
        console.error('Audit logging failed for template update:', error);
      });
    }

    return result;
  }

  /**
   * Delete template with audit logging
   */
  async deleteTemplate(name: string): Promise<MandrillTemplate> {
    // Fetch before state (needed for audit)
    let beforeState: MandrillTemplate | null = null;
    try {
      beforeState = await this.mandrillClient.getTemplateInfo(name);
    } catch (error) {
      console.error('Failed to fetch template before state:', error);
      // Continue with delete even if we can't get before state
    }

    // Execute main operation
    const result = await this.mandrillClient.deleteTemplate(name);

    // Log deletion (non-blocking - don't await)
    if (beforeState) {
      this.apiKeyHash.then(hash =>
        logTemplateDelete(this.db, hash, beforeState, this.userContext)
      ).catch((error) => {
        console.error('Audit logging failed for template deletion:', error);
      });
    }

    return result;
  }

  /**
   * Pass-through methods for tags (no audit needed)
   */
  async listTags() {
    return this.mandrillClient.listTags();
  }

  async getTagInfo(tag: string) {
    return this.mandrillClient.getTagInfo(tag);
  }

  async deleteTag(tag: string) {
    return this.mandrillClient.deleteTag(tag);
  }

  /**
   * Pass-through methods for senders (no audit needed)
   */
  async listSenders() {
    return this.mandrillClient.listSenders();
  }

  async getSenderInfo(address: string) {
    return this.mandrillClient.getSenderInfo(address);
  }

  /**
   * Set user context for audit logs
   */
  setUserContext(userContext: string) {
    this.userContext = userContext;
  }

  /**
   * Get user context
   */
  getUserContext(): string | undefined {
    return this.userContext;
  }

  /**
   * Check if the underlying client is initialized
   */
  isInitialized(): boolean {
    return this.mandrillClient.isInitialized();
  }

  /**
   * Get the API key from the underlying client
   */
  getApiKey(): string | null {
    return this.mandrillClient.getApiKey();
  }
}

/**
 * Factory function to create an audited Mandrill client
 */
export function createAuditedClient(
  mandrillClient: any,
  db: Database,
  apiKey: string,
  userContext?: string
): AuditedMandrillClient {
  return new AuditedMandrillClient(mandrillClient, db, apiKey, userContext);
}
