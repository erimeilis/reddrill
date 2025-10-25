/**
 * TypeScript types for Audit Trail System
 */

import type { MandrillTemplate } from '../api/mandrill';

// Cloudflare D1 Database type
declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    dump(): Promise<ArrayBuffer>;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    exec(query: string): Promise<D1ExecResult>;
  }

  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | null>;
    run<T = unknown>(): Promise<D1Result<T>>;
    all<T = unknown>(): Promise<D1Result<T>>;
    raw<T = unknown>(): Promise<T[]>;
  }

  interface D1Result<T = unknown> {
    results?: T[];
    success: boolean;
    meta: Record<string, unknown>;
    error?: string;
  }

  interface D1ExecResult {
    count: number;
    duration: number;
  }
}

// Operation types
export type AuditOperationType = 'create' | 'update' | 'delete' | 'import' | 'restore';
export type AuditOperationStatus = 'success' | 'failure' | 'partial';

// Audit Log Entry (database row)
export interface AuditLog {
  id: number;
  created_at: string;

  // Operation metadata
  operation_type: AuditOperationType;
  operation_status: AuditOperationStatus;
  operation_id: string | null;

  // Template identification
  template_slug: string | null;
  template_name: string;

  // State snapshots (JSON strings in DB)
  state_before: string | null;
  state_after: string | null;

  // Change details
  changes_summary: string | null;

  // User context
  user_identifier: string | null;

  // Error tracking
  error_message: string | null;
  error_details: string | null;

  // Bulk operation metadata
  bulk_operation: number; // SQLite boolean (0 or 1)
  bulk_total_count: number | null;
  bulk_success_count: number | null;
  bulk_failure_count: number | null;

  // Searchability
  search_text: string | null;
}

// Audit Settings
export interface AuditSettings {
  id: number;
  enabled: number; // SQLite boolean (0 or 1)
  retention_days: number; // -1 = forever
  user_identifier: string | null;
  updated_at: string;
}

// Template state for audit snapshots
export interface AuditTemplateState {
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
  published_at: string | null;
  created_at: string;
  updated_at: string;
  draft_updated_at: string;
}

// Change summary item
export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'removed' | 'modified';
}

// Audit log entry for creation
export interface AuditLogEntry {
  operation_type: AuditOperationType;
  operation_status: AuditOperationStatus;
  operation_id?: string;
  template_slug?: string;
  template_name: string;
  state_before?: AuditTemplateState | null;
  state_after?: AuditTemplateState | null;
  changes_summary?: AuditChange[];
  user_identifier?: string;
  error_message?: string;
  error_details?: any;
}

// Bulk audit log entry
export interface BulkAuditLogEntry extends AuditLogEntry {
  bulk_operation: true;
  bulk_total_count: number;
  bulk_success_count: number;
  bulk_failure_count: number;
  bulk_details?: BulkOperationDetail[];
}

// Bulk operation detail
export interface BulkOperationDetail {
  name: string;
  status: 'success' | 'failure';
  error?: string;
}

// Filter for querying audit logs
export interface AuditLogFilter {
  operation_type?: AuditOperationType;
  template_name?: string;
  date_from?: string;
  date_to?: string;
  status?: AuditOperationStatus;
  limit?: number;
  offset?: number;
  order_by?: 'created_at' | 'template_name' | 'operation_type';
  order_dir?: 'ASC' | 'DESC';
}

// Audit statistics
export interface AuditStats {
  total_logs: number;
  by_operation: Record<AuditOperationType, number>;
  oldest_entry: string | null;
  storage_size_mb: number;
}

// Restore options
export interface RestoreOptions {
  force_overwrite?: boolean;
  rename_if_conflict?: string;
}

// Restore result
export interface RestoreResult {
  success: boolean;
  restored_template?: MandrillTemplate;
  error?: string;
  conflict?: boolean;
}

// Template diff result
export interface TemplateDiff {
  changes: AuditChange[];
  has_changes: boolean;
  summary: string;
}

// Import result (for bulk audit logging)
export interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ template: string; error: string }>;
}
