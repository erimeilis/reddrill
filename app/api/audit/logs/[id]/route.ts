/**
 * Single Audit Log API
 * Retrieve specific audit log entry by ID (filtered by API key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { getAuditLogById } from '@/lib/db/audit-db';
import { getApiKeyHash } from '@/lib/api/audit-middleware';

/**
 * GET /api/audit/logs/:id
 * Get specific audit log by ID (for authenticated API key only)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const apiKeyHash = await getApiKeyHash(request);
    const { id } = await params;
    const logId = parseInt(id, 10);

    if (isNaN(logId)) {
      return NextResponse.json({ error: 'Invalid log ID' }, { status: 400 });
    }

    const db = await getDb();
    const log = await getAuditLogById(db, apiKeyHash, logId);

    if (!log) {
      return NextResponse.json({ error: 'Audit log not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      log,
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch log' },
      { status: error instanceof Error && error.message.includes('API key') ? 401 : 500 }
    );
  }
}
