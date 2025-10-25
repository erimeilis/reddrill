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
export function initializePrisma(db: D1Database): PrismaClient {
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
    return await client.auditSettings.create({
      data: {
        id: 1,
        enabled: 0,
        retentionDays: 30,
      },
    });
  }

  return settings;
}

export async function isEnabled(client: PrismaClient): Promise<boolean> {
  const settings = await getSettings(client);
  return settings ? settings.enabled === 1 : false;
}

export async function updateSettings(
  client: PrismaClient,
  updates: Partial<Omit<AuditSettings, 'id' | 'updatedAt'>>
): Promise<AuditSettings> {
  return await client.auditSettings.update({
    where: { id: 1 },
    data: {
      ...updates,
      updatedAt: new Date(),
    },
  });
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
      operationType: entry.operation_type,
      operationStatus: entry.operation_status,
      operationId: entry.operation_id || null,
      templateSlug: entry.template_slug || null,
      templateName: entry.template_name,
      stateBefore: entry.state_before ? JSON.stringify(entry.state_before) : null,
      stateAfter: entry.state_after ? JSON.stringify(entry.state_after) : null,
      changesSummary: entry.changes_summary ? JSON.stringify(entry.changes_summary) : null,
      userIdentifier: entry.user_identifier || null,
      errorMessage: entry.error_message || null,
      errorDetails: entry.error_details ? JSON.stringify(entry.error_details) : null,
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
      operationType: entry.operation_type,
      operationStatus: entry.operation_status,
      operationId: entry.operation_id || null,
      templateSlug: null,
      templateName: entry.template_name,
      stateBefore: entry.state_before ? JSON.stringify(entry.state_before) : null,
      stateAfter: entry.state_after ? JSON.stringify(entry.state_after) : null,
      changesSummary: entry.changes_summary ? JSON.stringify(entry.changes_summary) : null,
      userIdentifier: entry.user_identifier || null,
      errorMessage: entry.error_message || null,
      errorDetails: entry.error_details ? JSON.stringify(entry.error_details) : null,
      bulkOperation: 1,
      bulkTotalCount: entry.bulk_total_count,
      bulkSuccessCount: entry.bulk_success_count,
      bulkFailureCount: entry.bulk_failure_count,
      searchText,
    },
  });

  return created.id;
}

/**
 * Query Operations
 */

export async function getAuditLogs(
  client: PrismaClient,
  filter?: AuditLogFilter
): Promise<AuditLog[]> {
  const where: any = {};

  if (filter?.operation_type) {
    where.operationType = filter.operation_type;
  }

  if (filter?.template_name) {
    where.templateName = { contains: filter.template_name };
  }

  if (filter?.status) {
    where.operationStatus = filter.status;
  }

  if (filter?.date_from || filter?.date_to) {
    where.createdAt = {};
    if (filter.date_from) {
      where.createdAt.gte = new Date(filter.date_from);
    }
    if (filter.date_to) {
      where.createdAt.lte = new Date(filter.date_to);
    }
  }

  const orderBy = filter?.order_by || 'createdAt';
  const orderDir = filter?.order_dir || 'DESC';

  return await client.auditLog.findMany({
    where,
    orderBy: {
      [orderBy]: orderDir.toLowerCase(),
    },
    take: filter?.limit || 50,
    skip: filter?.offset || 0,
  });
}

export async function getAuditLogById(
  client: PrismaClient,
  id: number
): Promise<AuditLog | null> {
  return await client.auditLog.findUnique({
    where: { id },
  });
}

export async function searchAuditLogs(
  client: PrismaClient,
  query: string,
  filter?: AuditLogFilter
): Promise<AuditLog[]> {
  const where: any = {
    searchText: { contains: query.toLowerCase() },
  };

  if (filter?.operation_type) {
    where.operationType = filter.operation_type;
  }

  if (filter?.status) {
    where.operationStatus = filter.status;
  }

  return await client.auditLog.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    take: filter?.limit || 50,
    skip: filter?.offset || 0,
  });
}

export async function getAuditLogsByTemplate(
  client: PrismaClient,
  templateName: string
): Promise<AuditLog[]> {
  return await client.auditLog.findMany({
    where: {
      templateName,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
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
    total_logs: totalLogs,
    by_operation: byOperationMap as any,
    oldest_entry: oldest?.createdAt.toISOString() || null,
    storage_size_mb: parseFloat(storageSizeMb.toFixed(2)),
  };
}

/**
 * Utility Functions
 */

function buildSearchText(entry: AuditLogEntry | BulkAuditLogEntry): string {
  const parts: string[] = [
    entry.template_name,
    entry.operation_type,
    entry.operation_status,
  ];

  if (entry.template_slug) {
    parts.push(entry.template_slug);
  }

  if (entry.state_after) {
    const state = entry.state_after as AuditTemplateState;
    parts.push(...state.labels);
  }

  return parts.join(' ').toLowerCase();
}
