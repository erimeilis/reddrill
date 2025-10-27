import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/db/audit-db';
import { getDb } from '@/lib/db/client';
import type { AuditLogEntry } from '@/lib/types/audit';

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const entry: AuditLogEntry = body;

    // Create audit log entry
    const logId = await createAuditLog(db, entry);

    return NextResponse.json({ success: true, logId }, { status: 200 });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
