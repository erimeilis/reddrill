/**
 * Audit Database Layer using Drizzle ORM
 * Handles all database operations for audit trail system
 * Includes API key isolation for multi-tenancy
 */

import { eq, and, desc, asc, like, lt, gte, lte, count, sql } from 'drizzle-orm';
import { getDb, type Database } from './client';
import { auditLogs, auditSettings } from './schema';
import type {
  AuditLog,
  AuditSettings,
  AuditLogEntry,
  BulkAuditLogEntry,
  AuditLogFilter,
  AuditStats,
  AuditTemplateState,
} from '../types/audit';

/**
 * Hash API key for secure storage
 * Uses SHA-256 for consistent, secure hashing
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Fallback for environments without Web Crypto API
    // This should not happen in Cloudflare Workers or modern browsers
    throw new Error('Web Crypto API not available');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Settings Operations
 */

export async function getSettings(db: Database, apiKeyHash: string): Promise<AuditSettings | null> {
  const settings = await db
    .select()
    .from(auditSettings)
    .where(eq(auditSettings.apiKeyHash, apiKeyHash))
    .get();

  if (!settings) {
    // Create default settings for this API key if not exists
    const [created] = await db
      .insert(auditSettings)
      .values({
        enabled: 0,
        retentionDays: 30,
        apiKeyHash,
      })
      .returning();
    return mapSettingsToType(created);
  }

  return mapSettingsToType(settings);
}

function mapSettingsToType(settings: any): AuditSettings {
  return {
    id: settings.id,
    enabled: settings.enabled,
    retentionDays: settings.retentionDays,
    userIdentifier: settings.userIdentifier,
    updatedAt: settings.updatedAt
      ? (typeof settings.updatedAt === 'number'
          ? new Date(settings.updatedAt * 1000).toISOString()
          : settings.updatedAt.toISOString())
      : new Date().toISOString(),
  };
}

export async function isEnabled(db: Database, apiKeyHash: string): Promise<boolean> {
  const settings = await getSettings(db, apiKeyHash);
  return settings ? settings.enabled === 1 : false;
}

export async function updateSettings(
  db: Database,
  apiKeyHash: string,
  updates: Partial<Omit<AuditSettings, 'id' | 'updatedAt'>>
): Promise<AuditSettings> {
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (updates.enabled !== undefined) {
    updateData.enabled = updates.enabled;
  }
  if (updates.retentionDays !== undefined) {
    updateData.retentionDays = updates.retentionDays;
  }
  if (updates.userIdentifier !== undefined) {
    updateData.userIdentifier = updates.userIdentifier;
  }

  // Check if settings exist
  const existing = await db
    .select()
    .from(auditSettings)
    .where(eq(auditSettings.apiKeyHash, apiKeyHash))
    .get();

  if (!existing) {
    // Create new settings for this API key
    const [created] = await db
      .insert(auditSettings)
      .values({
        enabled: updates.enabled || 0,
        retentionDays: updates.retentionDays || 30,
        userIdentifier: updates.userIdentifier || null,
        apiKeyHash,
      })
      .returning();
    return mapSettingsToType(created);
  }

  // Update existing settings
  const [updated] = await db
    .update(auditSettings)
    .set(updateData)
    .where(eq(auditSettings.apiKeyHash, apiKeyHash))
    .returning();

  return mapSettingsToType(updated);
}

/**
 * Audit Log Operations
 */

export async function createAuditLog(
  db: Database,
  apiKeyHash: string,
  entry: AuditLogEntry
): Promise<number> {
  const enabled = await isEnabled(db, apiKeyHash);
  if (!enabled) {
    return -1; // Audit disabled
  }

  const searchText = buildSearchText(entry);

  const [created] = await db
    .insert(auditLogs)
    .values({
      operationType: entry.operationType,
      operationStatus: entry.operationStatus,
      operationId: entry.operationId || null,
      templateSlug: entry.templateSlug || null,
      templateName: entry.templateName,
      stateBefore: entry.stateBefore ? JSON.stringify(entry.stateBefore) : null,
      stateAfter: entry.stateAfter ? JSON.stringify(entry.stateAfter) : null,
      changesSummary: entry.changesSummary ? JSON.stringify(entry.changesSummary) : null,
      userIdentifier: entry.userIdentifier || null,
      errorMessage: entry.errorMessage || null,
      errorDetails: entry.errorDetails ? JSON.stringify(entry.errorDetails) : null,
      bulkOperation: 0,
      searchText,
      apiKeyHash,
    })
    .returning();

  return created.id;
}

export async function createBulkAuditLog(
  db: Database,
  apiKeyHash: string,
  entry: BulkAuditLogEntry
): Promise<number> {
  const enabled = await isEnabled(db, apiKeyHash);
  if (!enabled) {
    return -1;
  }

  const searchText = buildSearchText(entry);

  const [created] = await db
    .insert(auditLogs)
    .values({
      operationType: entry.operationType,
      operationStatus: entry.operationStatus,
      operationId: entry.operationId || null,
      templateSlug: null,
      templateName: entry.templateName,
      stateBefore: entry.stateBefore ? JSON.stringify(entry.stateBefore) : null,
      stateAfter: entry.stateAfter ? JSON.stringify(entry.stateAfter) : null,
      changesSummary: entry.changesSummary ? JSON.stringify(entry.changesSummary) : null,
      userIdentifier: entry.userIdentifier || null,
      errorMessage: entry.errorMessage || null,
      errorDetails: entry.errorDetails ? JSON.stringify(entry.errorDetails) : null,
      bulkOperation: 1,
      bulkTotalCount: entry.bulkTotalCount,
      bulkSuccessCount: entry.bulkSuccessCount,
      bulkFailureCount: entry.bulkFailureCount,
      searchText,
      apiKeyHash,
    })
    .returning();

  return created.id;
}

/**
 * Query Operations
 */

function mapAuditLogToType(log: any): AuditLog {
  return {
    id: log.id,
    createdAt: log.createdAt.toISOString(),
    operationType: log.operationType,
    operationStatus: log.operationStatus,
    operationId: log.operationId,
    templateSlug: log.templateSlug,
    templateName: log.templateName,
    stateBefore: log.stateBefore,
    stateAfter: log.stateAfter,
    changesSummary: log.changesSummary,
    userIdentifier: log.userIdentifier,
    errorMessage: log.errorMessage,
    errorDetails: log.errorDetails,
    bulkOperation: log.bulkOperation,
    bulkTotalCount: log.bulkTotalCount,
    bulkSuccessCount: log.bulkSuccessCount,
    bulkFailureCount: log.bulkFailureCount,
    searchText: log.searchText,
  };
}

export async function getAuditLogs(
  db: Database,
  apiKeyHash: string,
  filter?: AuditLogFilter
): Promise<AuditLog[]> {
  const conditions: any[] = [eq(auditLogs.apiKeyHash, apiKeyHash)];

  if (filter?.operationType) {
    conditions.push(eq(auditLogs.operationType, filter.operationType));
  }

  if (filter?.templateName) {
    conditions.push(like(auditLogs.templateName, `%${filter.templateName}%`));
  }

  if (filter?.status) {
    conditions.push(eq(auditLogs.operationStatus, filter.status));
  }

  if (filter?.dateFrom) {
    conditions.push(gte(auditLogs.createdAt, new Date(filter.dateFrom)));
  }

  if (filter?.dateTo) {
    conditions.push(lte(auditLogs.createdAt, new Date(filter.dateTo)));
  }

  const orderDir = filter?.orderDir || 'DESC';
  const orderByFn = orderDir === 'DESC' ? desc : asc;

  const limit = filter?.limit || 50;
  const offset = filter?.offset || 0;

  const baseQuery = db.select().from(auditLogs);

  const whereQuery = baseQuery.where(and(...conditions));

  const orderedQuery = whereQuery.orderBy(orderByFn(auditLogs.createdAt));

  const logs = await orderedQuery.limit(limit).offset(offset).all();
  return logs.map(mapAuditLogToType);
}

export async function getAuditLogById(
  db: Database,
  apiKeyHash: string,
  id: number
): Promise<AuditLog | null> {
  const log = await db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.id, id), eq(auditLogs.apiKeyHash, apiKeyHash)))
    .get();
  return log ? mapAuditLogToType(log) : null;
}

export async function searchAuditLogs(
  db: Database,
  apiKeyHash: string,
  query: string,
  filter?: AuditLogFilter
): Promise<AuditLog[]> {
  const conditions: any[] = [
    eq(auditLogs.apiKeyHash, apiKeyHash),
    like(auditLogs.searchText, `%${query.toLowerCase()}%`)
  ];

  if (filter?.operationType) {
    conditions.push(eq(auditLogs.operationType, filter.operationType));
  }

  if (filter?.status) {
    conditions.push(eq(auditLogs.operationStatus, filter.status));
  }

  const logs = await db
    .select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(filter?.limit || 50)
    .offset(filter?.offset || 0)
    .all();

  return logs.map(mapAuditLogToType);
}

export async function getAuditLogsByTemplate(
  db: Database,
  apiKeyHash: string,
  templateName: string
): Promise<AuditLog[]> {
  const logs = await db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.templateName, templateName), eq(auditLogs.apiKeyHash, apiKeyHash)))
    .orderBy(desc(auditLogs.createdAt))
    .all();

  return logs.map(mapAuditLogToType);
}

/**
 * Retention and Cleanup
 */

export async function cleanupOldLogs(
  db: Database,
  apiKeyHash: string,
  retentionDays: number
): Promise<number> {
  if (retentionDays === -1) {
    return 0; // Forever retention
  }

  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const result = await db
    .delete(auditLogs)
    .where(and(lt(auditLogs.createdAt, cutoffDate), eq(auditLogs.apiKeyHash, apiKeyHash)))
    .returning();

  return result.length;
}

export async function clearAllLogs(db: Database, apiKeyHash: string): Promise<void> {
  await db.delete(auditLogs).where(eq(auditLogs.apiKeyHash, apiKeyHash));
}

/**
 * Statistics
 */

export async function getAuditStats(db: Database, apiKeyHash: string): Promise<AuditStats> {
  const totalLogsResult = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(eq(auditLogs.apiKeyHash, apiKeyHash))
    .get();
  const totalLogs = totalLogsResult?.count || 0;

  const byOperation = await db
    .select({
      operationType: auditLogs.operationType,
      count: count(),
    })
    .from(auditLogs)
    .where(eq(auditLogs.apiKeyHash, apiKeyHash))
    .groupBy(auditLogs.operationType)
    .all();

  const oldest = await db
    .select({ createdAt: auditLogs.createdAt })
    .from(auditLogs)
    .where(eq(auditLogs.apiKeyHash, apiKeyHash))
    .orderBy(asc(auditLogs.createdAt))
    .limit(1)
    .get();

  const byOperationMap: Record<string, number> = {};
  byOperation.forEach((item) => {
    byOperationMap[item.operationType] = item.count;
  });

  // Rough storage estimate (2-5 KB per log)
  const storageSizeMb = (totalLogs * 3.5) / 1024; // Average 3.5 KB per log

  return {
    totalLogs,
    byOperation: byOperationMap as any,
    oldestEntry: oldest ? oldest.createdAt.toISOString() : null,
    storageSizeMb: parseFloat(storageSizeMb.toFixed(2)),
  };
}

/**
 * Utility Functions
 */

function buildSearchText(entry: AuditLogEntry | BulkAuditLogEntry): string {
  const parts: string[] = [entry.templateName, entry.operationType, entry.operationStatus];

  if (entry.templateSlug) {
    parts.push(entry.templateSlug);
  }

  if (entry.stateAfter) {
    const state = entry.stateAfter as AuditTemplateState;
    parts.push(...state.labels);
  }

  return parts.join(' ').toLowerCase();
}
