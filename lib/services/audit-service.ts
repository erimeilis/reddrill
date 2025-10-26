/**
 * Audit Service Layer
 * High-level audit operations and business logic
 */

import { PrismaClient } from '@prisma/client';
import type { MandrillTemplate } from '../api/mandrill';
import type {
  AuditLog,
  RestoreOptions,
  RestoreResult,
  ImportResult,
} from '../types/audit';
import {
  createAuditLog,
  createBulkAuditLog,
  getAuditLogById,
  isEnabled,
} from '../db/audit-db';
import {
  templateToAuditState,
  generateChangesSummary,
  buildSearchText,
} from '../utils/template-diff';

/**
 * Log template creation
 */
export async function logTemplateCreate(
  client: PrismaClient,
  template: MandrillTemplate,
  userContext?: string
): Promise<void> {
  try {
    const enabled = await isEnabled(client);
    if (!enabled) return;

    await createAuditLog(client, {
      operationType: 'create',
      operationStatus: 'success',
      templateSlug: template.slug,
      templateName: template.name,
      stateAfter: templateToAuditState(template),
      userIdentifier: userContext,
    });
  } catch (error) {
    console.error('Failed to log template creation:', error);
    // Non-blocking: don't throw
  }
}

/**
 * Log template update
 */
export async function logTemplateUpdate(
  client: PrismaClient,
  before: MandrillTemplate,
  after: MandrillTemplate,
  userContext?: string
): Promise<void> {
  try {
    const enabled = await isEnabled(client);
    if (!enabled) return;

    const beforeState = templateToAuditState(before);
    const afterState = templateToAuditState(after);
    const changes = generateChangesSummary(beforeState, afterState);

    await createAuditLog(client, {
      operationType: 'update',
      operationStatus: 'success',
      templateSlug: after.slug,
      templateName: after.name,
      stateBefore: beforeState,
      stateAfter: afterState,
      changesSummary: changes,
      userIdentifier: userContext,
    });
  } catch (error) {
    console.error('Failed to log template update:', error);
  }
}

/**
 * Log template deletion
 */
export async function logTemplateDelete(
  client: PrismaClient,
  template: MandrillTemplate,
  userContext?: string
): Promise<void> {
  try {
    const enabled = await isEnabled(client);
    if (!enabled) return;

    await createAuditLog(client, {
      operationType: 'delete',
      operationStatus: 'success',
      templateSlug: template.slug,
      templateName: template.name,
      stateBefore: templateToAuditState(template),
      userIdentifier: userContext,
    });
  } catch (error) {
    console.error('Failed to log template deletion:', error);
  }
}

/**
 * Log bulk import operation
 */
export async function logBulkImport(
  client: PrismaClient,
  result: ImportResult,
  userContext?: string
): Promise<void> {
  try {
    const enabled = await isEnabled(client);
    if (!enabled) return;

    const operationId = `import-${Date.now()}`;
    const status = result.failed === 0 ? 'success' : result.imported > 0 ? 'partial' : 'failure';

    await createBulkAuditLog(client, {
      operationType: 'import',
      operationStatus: status,
      operationId: operationId,
      templateName: `Bulk Import (${result.total} templates)`,
      bulkOperation: true,
      bulkTotalCount: result.total,
      bulkSuccessCount: result.imported,
      bulkFailureCount: result.failed,
      errorMessage: result.errors.length > 0 ? `${result.errors.length} errors` : undefined,
      errorDetails: result.errors.length > 0 ? result.errors : undefined,
      userIdentifier: userContext,
    });
  } catch (error) {
    console.error('Failed to log bulk import:', error);
  }
}

/**
 * Log restore operation
 */
export async function logRestore(
  client: PrismaClient,
  auditLog: AuditLog,
  restoredTemplate: MandrillTemplate,
  userContext?: string
): Promise<void> {
  try {
    const enabled = await isEnabled(client);
    if (!enabled) return;

    await createAuditLog(client, {
      operationType: 'restore',
      operationStatus: 'success',
      operationId: `restore-from-${auditLog.id}`,
      templateSlug: restoredTemplate.slug,
      templateName: restoredTemplate.name,
      stateAfter: templateToAuditState(restoredTemplate),
      userIdentifier: userContext,
    });
  } catch (error) {
    console.error('Failed to log restore operation:', error);
  }
}

/**
 * Restore template from audit log
 * Note: Actual Mandrill API call must be done by caller
 */
export async function prepareRestore(
  client: PrismaClient,
  logId: number,
  options?: RestoreOptions
): Promise<{
  success: boolean;
  templateState?: any;
  error?: string;
}> {
  try {
    const auditLog = await getAuditLogById(client, logId);

    if (!auditLog) {
      return {
        success: false,
        error: 'Audit log not found',
      };
    }

    // For delete operations, restore from stateBefore
    // For update operations, restore from stateBefore
    const stateToRestore = auditLog.operationType === 'delete'
      ? auditLog.stateBefore
      : auditLog.stateBefore;

    if (!stateToRestore) {
      return {
        success: false,
        error: 'No state available to restore',
      };
    }

    const templateState = JSON.parse(stateToRestore);

    return {
      success: true,
      templateState,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
