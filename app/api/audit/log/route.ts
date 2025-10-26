import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '@/lib/db/audit-db';
import type { AuditLogEntry } from '@/lib/types/audit';

const client = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entry: AuditLogEntry = body;

    // Create audit log entry
    const logId = await createAuditLog(client, entry);

    return NextResponse.json({ success: true, logId }, { status: 200 });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await client.$disconnect();
  }
}
