/**
 * Single Audit Log API
 * Retrieve specific audit log entry by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { getAuditLogById } from '@/lib/db/audit-db';

/**
 * GET /api/audit/logs/:id
 * Get specific audit log by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const logId = parseInt(id, 10);

    if (isNaN(logId)) {
      return NextResponse.json({ error: 'Invalid log ID' }, { status: 400 });
    }

    const db = await getDb();
    const log = await getAuditLogById(db, logId);

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
      { status: 500 }
    );
  }
}
