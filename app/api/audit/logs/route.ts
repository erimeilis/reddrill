/**
 * Audit Logs API
 * Query and search audit trail entries
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db/audit-db';
import {
  getAuditLogs,
  searchAuditLogs,
  getAuditLogById,
  getAuditStats,
} from '@/lib/db/audit-db';
import type { AuditLogFilter } from '@/lib/types/audit';

/**
 * GET /api/audit/logs
 * Get audit logs with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient();
    const searchParams = request.nextUrl.searchParams;

    // Build filter from query parameters
    const filter: AuditLogFilter = {};

    const operationType = searchParams.get('operation_type');
    if (operationType) {
      filter.operation_type = operationType as any;
    }

    const templateName = searchParams.get('template_name');
    if (templateName) {
      filter.template_name = templateName;
    }

    const status = searchParams.get('status');
    if (status) {
      filter.status = status as any;
    }

    const dateFrom = searchParams.get('date_from');
    if (dateFrom) {
      filter.date_from = dateFrom;
    }

    const dateTo = searchParams.get('date_to');
    if (dateTo) {
      filter.date_to = dateTo;
    }

    const limit = searchParams.get('limit');
    if (limit) {
      filter.limit = parseInt(limit, 10);
    }

    const offset = searchParams.get('offset');
    if (offset) {
      filter.offset = parseInt(offset, 10);
    }

    const orderBy = searchParams.get('order_by');
    if (orderBy) {
      filter.order_by = orderBy as any;
    }

    const orderDir = searchParams.get('order_dir');
    if (orderDir) {
      filter.order_dir = orderDir.toUpperCase() as any;
    }

    const logs = await getAuditLogs(prisma, filter);

    return NextResponse.json({
      success: true,
      logs,
      filter,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/audit/logs/search
 * Search audit logs by text query
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient();
    const { query, filter } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'query parameter is required' },
        { status: 400 }
      );
    }

    const logs = await searchAuditLogs(prisma, query, filter);

    return NextResponse.json({
      success: true,
      query,
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Error searching audit logs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
