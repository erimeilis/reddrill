/**
 * Audit Statistics API
 * Get audit trail statistics and metrics
 */

import { NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db/audit-db';
import { getAuditStats } from '@/lib/db/audit-db';

/**
 * GET /api/audit/stats
 * Get audit statistics
 */
export async function GET() {
  try {
    const prisma = getPrismaClient();
    const stats = await getAuditStats(prisma);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
