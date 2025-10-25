/**
 * Audit Cleanup API
 * Manage audit log retention and cleanup
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db/audit-db';
import {
  cleanupOldLogs,
  clearAllLogs,
  getSettings,
} from '@/lib/db/audit-db';

/**
 * POST /api/audit/cleanup
 * Cleanup old audit logs based on retention policy
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient();
    const body = await request.json().catch(() => ({}));

    // Check for explicit "clear all" request
    if (body.clear_all === true) {
      await clearAllLogs(prisma);
      return NextResponse.json({
        success: true,
        message: 'All audit logs cleared',
        deleted_count: 'all',
      });
    }

    // Otherwise, cleanup based on retention policy
    const settings = await getSettings(prisma);

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    const retentionDays = settings.retention_days;

    if (retentionDays === -1) {
      return NextResponse.json({
        success: true,
        message: 'Retention policy set to forever, no cleanup needed',
        deleted_count: 0,
      });
    }

    const deletedCount = await cleanupOldLogs(prisma, retentionDays);

    return NextResponse.json({
      success: true,
      message: `Cleaned up logs older than ${retentionDays} days`,
      deleted_count: deletedCount,
      retention_days: retentionDays,
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cleanup failed' },
      { status: 500 }
    );
  }
}
