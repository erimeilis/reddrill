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
      operation_type: 'create',
      operation_status: 'success',
      template_slug: template.slug,
      template_name: template.name,
      state_after: templateToAuditState(template),
      user_identifier: userContext,
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
      operation_type: 'update',
      operation_status: 'success',
      template_slug: after.slug,
      template_name: after.name,
      state_before: beforeState,
      state_after: afterState,
      changes_summary: changes,
      user_identifier: userContext,
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
      operation_type: 'delete',
      operation_status: 'success',
      template_slug: template.slug,
      template_name: template.name,
      state_before: templateToAuditState(template),
      user_identifier: userContext,
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
      operation_type: 'import',
      operation_status: status,
      operation_id: operationId,
      template_name: `Bulk Import (${result.total} templates)`,
      bulk_operation: true,
      bulk_total_count: result.total,
      bulk_success_count: result.imported,
      bulk_failure_count: result.failed,
      error_message: result.errors.length > 0 ? `${result.errors.length} errors` : undefined,
      error_details: result.errors.length > 0 ? result.errors : undefined,
      user_identifier: userContext,
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
      operation_type: 'restore',
      operation_status: 'success',
      operation_id: `restore-from-${auditLog.id}`,
      template_slug: restoredTemplate.slug,
      template_name: restoredTemplate.name,
      state_after: templateToAuditState(restoredTemplate),
      user_identifier: userContext,
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

    // For delete operations, restore from state_before
    // For update operations, restore from state_before
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
