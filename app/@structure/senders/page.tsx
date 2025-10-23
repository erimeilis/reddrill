'use client';

import { Suspense } from 'react';
import { SendersPage } from '@/components/senders/senders-page';

export default function SendersPageRoute() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SendersPage />
    </Suspense>
  );
}
