/**
 * Audit Settings API
 * Manage audit trail configuration (per API key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { getSettings, updateSettings, isEnabled } from '@/lib/db/audit-db';
import { getApiKeyHash } from '@/lib/api/audit-middleware';
import type { AuditSettings } from '@/lib/types/audit';

/**
 * GET /api/audit/settings
 * Retrieve current audit settings for the authenticated API key
 */
export async function GET(request: NextRequest) {
  try {
    const apiKeyHash = await getApiKeyHash(request);
    const db = await getDb();
    const settings = await getSettings(db, apiKeyHash);

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching audit settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch settings' },
      { status: error instanceof Error && error.message.includes('API key') ? 401 : 500 }
    );
  }
}

/**
 * PUT /api/audit/settings
 * Update audit settings for the authenticated API key
 */
export async function PUT(request: NextRequest) {
  try {
    const apiKeyHash = await getApiKeyHash(request);
    const db = await getDb();
    const updates: Partial<Omit<AuditSettings, 'id' | 'updated_at'>> = await request.json();

    // Validate input
    if (updates.enabled !== undefined && ![0, 1].includes(updates.enabled)) {
      return NextResponse.json({ error: 'enabled must be 0 or 1' }, { status: 400 });
    }

    if (updates.retentionDays !== undefined) {
      if (typeof updates.retentionDays !== 'number' || (updates.retentionDays < -1 && updates.retentionDays !== -1)) {
        return NextResponse.json(
          { error: 'retention_days must be -1 (forever) or a positive number' },
          { status: 400 }
        );
      }
    }

    const updated = await updateSettings(db, apiKeyHash, updates);

    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (error) {
    console.error('Error updating audit settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: error instanceof Error && error.message.includes('API key') ? 401 : 500 }
    );
  }
}

/**
 * HEAD /api/audit/settings/status
 * Quick check if audit is enabled for the authenticated API key
 */
export async function HEAD(request: NextRequest) {
  try {
    const apiKeyHash = await getApiKeyHash(request);
    const db = await getDb();
    const enabled = await isEnabled(db, apiKeyHash);

    return new NextResponse(null, {
      status: enabled ? 200 : 204,
      headers: {
        'X-Audit-Enabled': enabled ? '1' : '0',
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: error instanceof Error && error.message.includes('API key') ? 401 : 500 });
  }
}
