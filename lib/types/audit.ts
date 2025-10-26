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
  createdAt: string;

  // Operation metadata
  operationType: AuditOperationType;
  operationStatus: AuditOperationStatus;
  operationId: string | null;

  // Template identification
  templateSlug: string | null;
  templateName: string;

  // State snapshots (JSON strings in DB)
  stateBefore: string | null;
  stateAfter: string | null;

  // Change details
  changesSummary: string | null;

  // User context
  userIdentifier: string | null;

  // Error tracking
  errorMessage: string | null;
  errorDetails: string | null;

  // Bulk operation metadata
  bulkOperation: number; // SQLite boolean (0 or 1)
  bulkTotalCount: number | null;
  bulkSuccessCount: number | null;
  bulkFailureCount: number | null;

  // Searchability
  searchText: string | null;
}

// Audit Settings
export interface AuditSettings {
  id: number;
  enabled: number; // SQLite boolean (0 or 1)
  retentionDays: number; // -1 = forever
  userIdentifier: string | null;
  updatedAt: string;
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
  operationType: AuditOperationType;
  operationStatus: AuditOperationStatus;
  operationId?: string;
  templateSlug?: string;
  templateName: string;
  stateBefore?: AuditTemplateState | null;
  stateAfter?: AuditTemplateState | null;
  changesSummary?: AuditChange[];
  userIdentifier?: string;
  errorMessage?: string;
  errorDetails?: any;
}

// Bulk audit log entry
export interface BulkAuditLogEntry extends AuditLogEntry {
  bulkOperation: true;
  bulkTotalCount: number;
  bulkSuccessCount: number;
  bulkFailureCount: number;
  bulkDetails?: BulkOperationDetail[];
}

// Bulk operation detail
export interface BulkOperationDetail {
  name: string;
  status: 'success' | 'failure';
  error?: string;
}

// Filter for querying audit logs
export interface AuditLogFilter {
  operationType?: AuditOperationType;
  templateName?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: AuditOperationStatus;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'templateName' | 'operationType';
  orderDir?: 'ASC' | 'DESC';
}

// Audit statistics
export interface AuditStats {
  totalLogs: number;
  byOperation: Record<AuditOperationType, number>;
  oldestEntry: string | null;
  storageSizeMb: number;
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
