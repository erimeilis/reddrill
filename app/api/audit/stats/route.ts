/**
 * Audit Statistics API
 * Get audit trail statistics and metrics
 */

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { getAuditStats } from '@/lib/db/audit-db';

/**
 * GET /api/audit/stats
 * Get audit statistics
 */
export async function GET() {
  try {
    const db = await getDb();
    const stats = await getAuditStats(db);

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
