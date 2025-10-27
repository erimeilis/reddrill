/**
 * Audit Log Creation API
 * Create new audit log entries (per API key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/db/audit-db';
import { getDb } from '@/lib/db/client';
import { getApiKeyHash } from '@/lib/api/audit-middleware';
import type { AuditLogEntry } from '@/lib/types/audit';

/**
 * POST /api/audit/log
 * Create a new audit log entry (for authenticated API key)
 */
export async function POST(request: NextRequest) {
  try {
    const apiKeyHash = await getApiKeyHash(request);
    const db = await getDb();
    const body = await request.json();
    const entry: AuditLogEntry = body;

    // Create audit log entry
    const logId = await createAuditLog(db, apiKeyHash, entry);

    return NextResponse.json({ success: true, logId }, { status: 200 });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('API key') ? 401 : 500 }
    );
  }
}
