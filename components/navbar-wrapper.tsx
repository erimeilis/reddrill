import { Navbar } from './navbar';
import { headers } from 'next/headers';

export async function NavbarWrapper() {
  // Server Component
  // Access request data first to satisfy Next.js 16 prerendering requirements
  await headers();

  // Note: Audit settings are now per-API-key and fetched client-side by Navbar
  return <Navbar />;
}
