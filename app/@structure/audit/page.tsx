'use client';

import { Suspense } from 'react';
import { AuditLogsViewer } from '@/components/audit/audit-logs-viewer';

export default function AuditPageRoute() {
  return (
    <Suspense fallback={<div>Loading audit logs...</div>}>
      <AuditLogsViewer />
    </Suspense>
  );
}
