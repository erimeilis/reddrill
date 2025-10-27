/**
 * Drizzle Client for Cloudflare D1
 * Handles database connection initialization
 */

import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * Get Drizzle database instance with D1 binding
 * IMPORTANT: Only works in Cloudflare Workers environment (production/preview)
 * In local dev, audit system is disabled
 */
export async function getDb() {
  // Only try Cloudflare context in production
  if (process.env.NODE_ENV !== 'development') {
    try {
      // Dynamic import at runtime to avoid Turbopack issues
      const cloudflare = await import('@opennextjs/cloudflare');
      const { env} = await cloudflare.getCloudflareContext();

      if ((env as any).DB) {
        return drizzle((env as any).DB, { schema });
      }
    } catch (error) {
      console.warn('Cloudflare context unavailable:', error);
    }
  }

  // Development mode or Cloudflare context failed
  throw new Error('D1 not available - audit disabled in development');
}

/**
 * Type export for database instance
 */
export type Database = Awaited<ReturnType<typeof getDb>>;
