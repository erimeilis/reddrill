/**
 * Audit Database Layer using Prisma ORM
 * Handles all database operations for audit trail system
 */

import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import type {
  AuditLog,
  AuditSettings,
  AuditLogEntry,
  BulkAuditLogEntry,
  AuditLogFilter,
  AuditStats,
  AuditTemplateState,
  AuditChange,
} from '../types/audit';

let prisma: PrismaClient | null = null;

/**
 * Initialize Prisma Client with D1 adapter for Cloudflare Workers
 */
export function initializePrisma(db: any): PrismaClient {
  if (!prisma) {
    const adapter = new PrismaD1(db);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

/**
 * Get Prisma Client instance (for server-side code)
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * Settings Operations
 */

export async function getSettings(client: PrismaClient): Promise<AuditSettings | null> {
  const settings = await client.auditSettings.findUnique({
    where: { id: 1 },
  });

  if (!settings) {
    // Create default settings if not exists
    const created = await client.auditSettings.create({
      data: {
        id: 1,
        enabled: 0,
        retentionDays: 30,
      },
    });
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
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export async function isEnabled(client: PrismaClient): Promise<boolean> {
  const settings = await getSettings(client);
  return settings ? settings.enabled === 1 : false;
}

export async function updateSettings(
  client: PrismaClient,
  updates: Partial<Omit<AuditSettings, 'id' | 'updatedAt'>>
): Promise<AuditSettings> {
  const updated = await client.auditSettings.update({
    where: { id: 1 },
    data: {
      enabled: updates.enabled,
      retentionDays: updates.retentionDays,
      userIdentifier: updates.userIdentifier,
      updatedAt: new Date(),
    },
  });
  return mapSettingsToType(updated);
}

/**
 * Audit Log Operations
 */

export async function createAuditLog(
  client: PrismaClient,
  entry: AuditLogEntry
): Promise<number> {
  const enabled = await isEnabled(client);
  if (!enabled) {
    return -1; // Audit disabled
  }

  const searchText = buildSearchText(entry);

  const created = await client.auditLog.create({
    data: {
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
    },
  });

  return created.id;
}

export async function createBulkAuditLog(
  client: PrismaClient,
  entry: BulkAuditLogEntry
): Promise<number> {
  const enabled = await isEnabled(client);
  if (!enabled) {
    return -1;
  }

  const searchText = buildSearchText(entry);

  const created = await client.auditLog.create({
    data: {
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
    },
  });

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
  client: PrismaClient,
  filter?: AuditLogFilter
): Promise<AuditLog[]> {
  const where: any = {};

  if (filter?.operationType) {
    where.operationType = filter.operationType;
  }

  if (filter?.templateName) {
    where.templateName = { contains: filter.templateName };
  }

  if (filter?.status) {
    where.operationStatus = filter.status;
  }

  if (filter?.dateFrom || filter?.dateTo) {
    where.createdAt = {};
    if (filter.dateFrom) {
      where.createdAt.gte = new Date(filter.dateFrom);
    }
    if (filter.dateTo) {
      where.createdAt.lte = new Date(filter.dateTo);
    }
  }

  const orderBy = filter?.orderBy || 'createdAt';
  const orderDir = filter?.orderDir || 'DESC';

  const logs = await client.auditLog.findMany({
    where,
    orderBy: {
      [orderBy]: orderDir.toLowerCase(),
    },
    take: filter?.limit || 50,
    skip: filter?.offset || 0,
  });

  return logs.map(mapAuditLogToType);
}

export async function getAuditLogById(
  client: PrismaClient,
  id: number
): Promise<AuditLog | null> {
  const log = await client.auditLog.findUnique({
    where: { id },
  });
  return log ? mapAuditLogToType(log) : null;
}

export async function searchAuditLogs(
  client: PrismaClient,
  query: string,
  filter?: AuditLogFilter
): Promise<AuditLog[]> {
  const where: any = {
    searchText: { contains: query.toLowerCase() },
  };

  if (filter?.operationType) {
    where.operationType = filter.operationType;
  }

  if (filter?.status) {
    where.operationStatus = filter.status;
  }

  const logs = await client.auditLog.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    take: filter?.limit || 50,
    skip: filter?.offset || 0,
  });

  return logs.map(mapAuditLogToType);
}

export async function getAuditLogsByTemplate(
  client: PrismaClient,
  templateName: string
): Promise<AuditLog[]> {
  const logs = await client.auditLog.findMany({
    where: {
      templateName,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return logs.map(mapAuditLogToType);
}

/**
 * Retention and Cleanup
 */

export async function cleanupOldLogs(
  client: PrismaClient,
  retentionDays: number
): Promise<number> {
  if (retentionDays === -1) {
    return 0; // Forever retention
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await client.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

export async function clearAllLogs(client: PrismaClient): Promise<void> {
  await client.auditLog.deleteMany({});
}

/**
 * Statistics
 */

export async function getAuditStats(client: PrismaClient): Promise<AuditStats> {
  const totalLogs = await client.auditLog.count();

  const byOperation = await client.auditLog.groupBy({
    by: ['operationType'],
    _count: true,
  });

  const oldest = await client.auditLog.findFirst({
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      createdAt: true,
    },
  });

  const byOperationMap: Record<string, number> = {};
  byOperation.forEach((item) => {
    byOperationMap[item.operationType] = item._count;
  });

  // Rough storage estimate (2-5 KB per log)
  const storageSizeMb = (totalLogs * 3.5) / 1024; // Average 3.5 KB per log

  return {
    totalLogs: totalLogs,
    byOperation: byOperationMap as any,
    oldestEntry: oldest?.createdAt.toISOString() || null,
    storageSizeMb: parseFloat(storageSizeMb.toFixed(2)),
  };
}

/**
 * Utility Functions
 */

function buildSearchText(entry: AuditLogEntry | BulkAuditLogEntry): string {
  const parts: string[] = [
    entry.templateName,
    entry.operationType,
    entry.operationStatus,
  ];

  if (entry.templateSlug) {
    parts.push(entry.templateSlug);
  }

  if (entry.stateAfter) {
    const state = entry.stateAfter as AuditTemplateState;
    parts.push(...state.labels);
  }

  return parts.join(' ').toLowerCase();
}
