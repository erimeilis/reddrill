/**
 * Audit Logs API
 * Query and search audit trail entries (filtered by API key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { getAuditLogs, searchAuditLogs } from '@/lib/db/audit-db';
import { getApiKeyHash } from '@/lib/api/audit-middleware';
import { auditLogs } from '@/lib/db/schema';
import { and, eq, like, gte, lte, count } from 'drizzle-orm';
import type { AuditLogFilter } from '@/lib/types/audit';

/**
 * GET /api/audit/logs
 * Get audit logs with optional filtering (for authenticated API key only)
 */
export async function GET(request: NextRequest) {
  try {
    const apiKeyHash = await getApiKeyHash(request);
    const db = await getDb();
    const searchParams = request.nextUrl.searchParams;

    // Build filter from query parameters
    const filter: AuditLogFilter = {};

    const operationType = searchParams.get('operation_type');
    if (operationType) {
      filter.operationType = operationType as any;
    }

    const templateName = searchParams.get('template_name');
    if (templateName) {
      filter.templateName = templateName;
    }

    const status = searchParams.get('status');
    if (status) {
      filter.status = status as any;
    }

    const dateFrom = searchParams.get('date_from');
    if (dateFrom) {
      filter.dateFrom = dateFrom;
    }

    const dateTo = searchParams.get('date_to');
    if (dateTo) {
      filter.dateTo = dateTo;
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
      const orderByMapping: Record<string, 'createdAt' | 'templateName' | 'operationType'> = {
        'created_at': 'createdAt',
        'template_name': 'templateName',
        'operation_type': 'operationType',
        'createdAt': 'createdAt',
        'templateName': 'templateName',
        'operationType': 'operationType',
      };
      filter.orderBy = orderByMapping[orderBy] || 'createdAt';
    }

    const orderDir = searchParams.get('order_dir');
    if (orderDir) {
      filter.orderDir = orderDir.toUpperCase() as any;
    }

    const logs = await getAuditLogs(db, apiKeyHash, filter);

    // Get total count for pagination (filtered by API key)
    const conditions: any[] = [eq(auditLogs.apiKeyHash, apiKeyHash)];
    if (filter.operationType) {
      conditions.push(eq(auditLogs.operationType, filter.operationType));
    }
    if (filter.templateName) {
      conditions.push(like(auditLogs.templateName, `%${filter.templateName}%`));
    }
    if (filter.status) {
      conditions.push(eq(auditLogs.operationStatus, filter.status));
    }
    if (filter.dateFrom) {
      conditions.push(gte(auditLogs.createdAt, new Date(filter.dateFrom)));
    }
    if (filter.dateTo) {
      conditions.push(lte(auditLogs.createdAt, new Date(filter.dateTo)));
    }

    const countQuery = db.select({ count: count() }).from(auditLogs);
    const totalCountResult = await countQuery.where(and(...conditions)).get();

    const totalCount = totalCountResult?.count || 0;

    return NextResponse.json({
      success: true,
      logs,
      totalCount,
      filter,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch logs' },
      { status: error instanceof Error && error.message.includes('API key') ? 401 : 500 }
    );
  }
}

/**
 * POST /api/audit/logs/search
 * Search audit logs by text query (for authenticated API key only)
 */
export async function POST(request: NextRequest) {
  try {
    const apiKeyHash = await getApiKeyHash(request);
    const db = await getDb();
    const { query, filter } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query parameter is required' }, { status: 400 });
    }

    const logs = await searchAuditLogs(db, apiKeyHash, query, filter);

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
      { status: error instanceof Error && error.message.includes('API key') ? 401 : 500 }
    );
  }
}
