import { Navbar } from './navbar';
import { headers } from 'next/headers';
import { getDb } from '@/lib/db/client';
import { isEnabled } from '@/lib/db/audit-db';

export async function NavbarWrapper() {
  // Server Component: fetches audit status on each render
  // When router.refresh() is called, this re-executes and gets fresh data

  // Access request data first to satisfy Next.js 16 prerendering requirements
  await headers();

  // Check if audit system is enabled using Drizzle
  let auditEnabled = false;
  try {
    const db = await getDb();
    auditEnabled = await isEnabled(db);
  } catch (error) {
    console.error('Failed to check audit status:', error);
  }

  return <Navbar auditEnabled={auditEnabled} />;
}
