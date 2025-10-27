/**
 * Drizzle Client for Cloudflare D1
 * Handles database connection initialization
 */

import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * Get Drizzle database instance with D1 binding
 * Works in:
 * - Production/Preview (Cloudflare Workers)
 * - Local development with wrangler pages dev
 */
export async function getDb() {
  try {
    // Dynamic import at runtime to avoid Turbopack issues
    const cloudflare = await import('@opennextjs/cloudflare');
    const { env} = await cloudflare.getCloudflareContext();

    if ((env as any).DB) {
      return drizzle((env as any).DB, { schema });
    }

    throw new Error('DB binding not found in Cloudflare context');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (process.env.NODE_ENV === 'development') {
      console.warn('[Audit] D1 not available in Next.js dev mode:', errorMessage);
      console.warn('[Audit] To enable audit in local dev, use: wrangler pages dev');
    } else {
      console.error('[Audit] Failed to access D1 database:', errorMessage);
    }

    throw new Error('D1 database unavailable');
  }
}

/**
 * Type export for database instance
 */
export type Database = Awaited<ReturnType<typeof getDb>>;
