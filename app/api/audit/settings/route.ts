/**
 * Audit Settings API
 * Manage audit trail configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db/audit-db';
import {
  getSettings,
  updateSettings,
  isEnabled,
} from '@/lib/db/audit-db';
import type { AuditSettings } from '@/lib/types/audit';

/**
 * GET /api/audit/settings
 * Retrieve current audit settings
 */
export async function GET() {
  try {
    const prisma = getPrismaClient();
    const settings = await getSettings(prisma);

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching audit settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/audit/settings
 * Update audit settings
 */
export async function PUT(request: NextRequest) {
  try {
    const prisma = getPrismaClient();
    const updates: Partial<Omit<AuditSettings, 'id' | 'updated_at'>> = await request.json();

    // Validate input
    if (updates.enabled !== undefined && ![0, 1].includes(updates.enabled)) {
      return NextResponse.json(
        { error: 'enabled must be 0 or 1' },
        { status: 400 }
      );
    }

    if (updates.retentionDays !== undefined) {
      if (typeof updates.retentionDays !== 'number' ||
          (updates.retentionDays < -1 && updates.retentionDays !== -1)) {
        return NextResponse.json(
          { error: 'retention_days must be -1 (forever) or a positive number' },
          { status: 400 }
        );
      }
    }

    const updated = await updateSettings(prisma, updates);

    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (error) {
    console.error('Error updating audit settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/audit/settings/status
 * Quick check if audit is enabled
 */
export async function HEAD() {
  try {
    const prisma = getPrismaClient();
    const enabled = await isEnabled(prisma);

    return new NextResponse(null, {
      status: enabled ? 200 : 204,
      headers: {
        'X-Audit-Enabled': enabled ? '1' : '0',
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
