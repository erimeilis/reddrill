/**
 * Audit Database Layer using Drizzle ORM
 * Handles all database operations for audit trail system
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
 * Settings Operations
 */

export async function getSettings(db: Database): Promise<AuditSettings | null> {
  const settings = await db.select().from(auditSettings).where(eq(auditSettings.id, 1)).get();

  if (!settings) {
    // Create default settings if not exists
    const [created] = await db
      .insert(auditSettings)
      .values({
        id: 1,
        enabled: 0,
        retentionDays: 30,
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

export async function isEnabled(db: Database): Promise<boolean> {
  const settings = await getSettings(db);
  return settings ? settings.enabled === 1 : false;
}

export async function updateSettings(
  db: Database,
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

  const [updated] = await db
    .update(auditSettings)
    .set(updateData)
    .where(eq(auditSettings.id, 1))
    .returning();

  return mapSettingsToType(updated);
}

/**
 * Audit Log Operations
 */

export async function createAuditLog(db: Database, entry: AuditLogEntry): Promise<number> {
  const enabled = await isEnabled(db);
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
    })
    .returning();

  return created.id;
}

export async function createBulkAuditLog(db: Database, entry: BulkAuditLogEntry): Promise<number> {
  const enabled = await isEnabled(db);
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

export async function getAuditLogs(db: Database, filter?: AuditLogFilter): Promise<AuditLog[]> {
  const conditions: any[] = [];

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

  const whereQuery = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

  const orderedQuery = whereQuery.orderBy(orderByFn(auditLogs.createdAt));

  const logs = await orderedQuery.limit(limit).offset(offset).all();
  return logs.map(mapAuditLogToType);
}

export async function getAuditLogById(db: Database, id: number): Promise<AuditLog | null> {
  const log = await db.select().from(auditLogs).where(eq(auditLogs.id, id)).get();
  return log ? mapAuditLogToType(log) : null;
}

export async function searchAuditLogs(
  db: Database,
  query: string,
  filter?: AuditLogFilter
): Promise<AuditLog[]> {
  const conditions: any[] = [like(auditLogs.searchText, `%${query.toLowerCase()}%`)];

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

export async function getAuditLogsByTemplate(db: Database, templateName: string): Promise<AuditLog[]> {
  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.templateName, templateName))
    .orderBy(desc(auditLogs.createdAt))
    .all();

  return logs.map(mapAuditLogToType);
}

/**
 * Retention and Cleanup
 */

export async function cleanupOldLogs(db: Database, retentionDays: number): Promise<number> {
  if (retentionDays === -1) {
    return 0; // Forever retention
  }

  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const result = await db.delete(auditLogs).where(lt(auditLogs.createdAt, cutoffDate)).returning();

  return result.length;
}

export async function clearAllLogs(db: Database): Promise<void> {
  await db.delete(auditLogs);
}

/**
 * Statistics
 */

export async function getAuditStats(db: Database): Promise<AuditStats> {
  const totalLogsResult = await db.select({ count: count() }).from(auditLogs).get();
  const totalLogs = totalLogsResult?.count || 0;

  const byOperation = await db
    .select({
      operationType: auditLogs.operationType,
      count: count(),
    })
    .from(auditLogs)
    .groupBy(auditLogs.operationType)
    .all();

  const oldest = await db
    .select({ createdAt: auditLogs.createdAt })
    .from(auditLogs)
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
