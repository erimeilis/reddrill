/**
 * Audit Statistics API
 * Get audit trail statistics and metrics (per API key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { getAuditStats } from '@/lib/db/audit-db';
import { getApiKeyHash } from '@/lib/api/audit-middleware';

/**
 * GET /api/audit/stats
 * Get audit statistics (for authenticated API key only)
 */
export async function GET(request: NextRequest) {
  try {
    const apiKeyHash = await getApiKeyHash(request);
    const db = await getDb();
    const stats = await getAuditStats(db, apiKeyHash);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: error instanceof Error && error.message.includes('API key') ? 401 : 500 }
    );
  }
}
