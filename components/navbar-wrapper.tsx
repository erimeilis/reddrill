import { Navbar } from './navbar';
import { PrismaClient } from '@prisma/client';
import { getSettings } from '@/lib/db/audit-db';

export async function NavbarWrapper() {
  // Server Component: fetches audit status on each render
  // When router.refresh() is called, this re-executes and gets fresh data
  const client = new PrismaClient();

  try {
    const settings = await getSettings(client);
    const auditEnabled = settings?.enabled === 1;
    return <Navbar auditEnabled={auditEnabled} />;
  } finally {
    await client.$disconnect();
  }
}
