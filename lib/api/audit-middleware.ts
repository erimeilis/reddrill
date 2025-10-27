/**
 * Audit API Middleware
 * Handles API key extraction and hashing for multi-tenancy
 */

import { NextRequest } from 'next/server';
import { hashApiKey } from '@/lib/db/audit-db';

/**
 * Extract API key from request headers
 * Supports both Authorization Bearer token and X-API-Key header
 */
export function extractApiKey(request: NextRequest): string | null {
  // Try Authorization header first (Bearer token)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try X-API-Key header
  const apiKeyHeader = request.headers.get('X-API-Key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Get hashed API key from request
 * Returns hashed API key or throws error if not found
 */
export async function getApiKeyHash(request: NextRequest): Promise<string> {
  const apiKey = extractApiKey(request);

  if (!apiKey) {
    throw new Error('API key required - send via Authorization: Bearer <key> or X-API-Key header');
  }

  return await hashApiKey(apiKey);
}

/**
 * Validate and get API key hash with error handling
 * Returns { apiKeyHash, error } for easier error handling in routes
 */
export async function validateApiKey(request: NextRequest): Promise<{
  apiKeyHash: string | null;
  error: string | null;
}> {
  try {
    const apiKeyHash = await getApiKeyHash(request);
    return { apiKeyHash, error: null };
  } catch (error) {
    return {
      apiKeyHash: null,
      error: error instanceof Error ? error.message : 'Failed to validate API key',
    };
  }
}
