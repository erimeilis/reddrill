/**
 * Drizzle ORM Schema for Audit Trail System
 * Compatible with Cloudflare D1 (SQLite)
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Schema version tracking
export const schemaMigrations = sqliteTable('schema_migrations', {
  version: integer('version').primaryKey(),
  appliedAt: integer('applied_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Main audit log table
export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),

    // Operation metadata
    operationType: text('operation_type').notNull(), // 'create', 'update', 'delete', 'import', 'restore'
    operationStatus: text('operation_status').notNull(), // 'success', 'failure', 'partial'
    operationId: text('operation_id'),

    // Template identification
    templateSlug: text('template_slug'),
    templateName: text('template_name').notNull(),

    // State snapshots (stored as JSON strings)
    stateBefore: text('state_before'),
    stateAfter: text('state_after'),

    // Change details (JSON string)
    changesSummary: text('changes_summary'),

    // User context
    userIdentifier: text('user_identifier'),

    // API key isolation (hashed for security)
    apiKeyHash: text('api_key_hash').notNull().default(''),

    // Error tracking
    errorMessage: text('error_message'),
    errorDetails: text('error_details'),

    // Bulk operation metadata
    bulkOperation: integer('bulk_operation').notNull().default(0), // 0 or 1 (SQLite boolean)
    bulkTotalCount: integer('bulk_total_count'),
    bulkSuccessCount: integer('bulk_success_count'),
    bulkFailureCount: integer('bulk_failure_count'),

    // Searchability
    searchText: text('search_text'),
  },
  (table) => ({
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
    templateNameIdx: index('audit_logs_template_name_idx').on(table.templateName),
    operationTypeIdx: index('audit_logs_operation_type_idx').on(table.operationType),
    operationIdIdx: index('audit_logs_operation_id_idx').on(table.operationId),
    searchTextIdx: index('audit_logs_search_text_idx').on(table.searchText),
    operationTypeCreatedAtIdx: index('audit_logs_operation_type_created_at_idx').on(
      table.operationType,
      table.createdAt
    ),
    apiKeyHashIdx: index('audit_logs_api_key_hash_idx').on(table.apiKeyHash),
    apiKeyHashCreatedAtIdx: index('audit_logs_api_key_created_at_idx').on(
      table.apiKeyHash,
      table.createdAt
    ),
  })
);

// User settings (per API key, not singleton anymore)
export const auditSettings = sqliteTable('audit_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  enabled: integer('enabled').notNull().default(0), // 0 or 1 (SQLite boolean)
  retentionDays: integer('retention_days').notNull().default(30), // -1 = forever
  userIdentifier: text('user_identifier'),
  apiKeyHash: text('api_key_hash').notNull().default(''),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Type exports for use in application code
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type AuditSettings = typeof auditSettings.$inferSelect;
export type NewAuditSettings = typeof auditSettings.$inferInsert;
