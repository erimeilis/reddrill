'use client';

import { Suspense } from 'react';
import { TemplatesPage } from '@/components/templates/templates-page';

export default function TemplatesPageRoute() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TemplatesPage />
    </Suspense>
  );
}
